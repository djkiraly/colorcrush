import { db } from "@/lib/db";
import {
  users,
  addresses,
  orders,
  orderItems,
  products,
  coupons,
} from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { logOrderAction } from "@/lib/order-audit";
import { siteConfig } from "../../../site.config";
import type { CreateManualOrderInput } from "@/lib/validators/manual-order";

type Money = number;

function round(n: Money): Money {
  return Math.round(n * 100) / 100;
}

export type ComputedTotals = {
  subtotal: Money;
  shippingCost: Money;
  taxAmount: Money;
  couponDiscount: Money;
  manualDiscount: Money;
  total: Money;
};

/**
 * Resolve products for catalog items and compute all totals from input.
 * Throws Error if any productId or coupon code is invalid.
 */
export async function computeTotals(input: CreateManualOrderInput) {
  const catalogIds = input.items
    .filter((i) => i.kind === "catalog")
    .map((i) => (i as { productId: string }).productId);

  const productRows = catalogIds.length
    ? await db.select().from(products).where(inArray(products.id, catalogIds))
    : [];
  const productById = new Map(productRows.map((p) => [p.id, p]));

  const resolvedItems = input.items.map((item) => {
    if (item.kind === "catalog") {
      const product = productById.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const catalogPrice = parseFloat(product.price);
      const unitPrice =
        item.unitPriceOverride !== undefined ? item.unitPriceOverride : catalogPrice;
      const priceOverride =
        item.unitPriceOverride !== undefined && item.unitPriceOverride !== catalogPrice;
      return {
        kind: "catalog" as const,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal: round(unitPrice * item.quantity),
        priceOverride,
      };
    }
    return {
      kind: "custom" as const,
      productId: null,
      productName: item.description.slice(0, 250),
      sku: null,
      customDescription: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: round(item.unitPrice * item.quantity),
      priceOverride: false,
    };
  });

  const subtotal = round(resolvedItems.reduce((s, i) => s + i.lineTotal, 0));

  // Coupon
  let couponDiscount = 0;
  let coupon: { id: string; code: string } | null = null;
  if (input.couponCode) {
    const [c] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, input.couponCode.toUpperCase()))
      .limit(1);
    if (!c || !c.isActive) throw new Error("Invalid coupon code");
    if (c.minOrderAmount && subtotal < parseFloat(c.minOrderAmount)) {
      throw new Error(`Coupon requires minimum order of $${c.minOrderAmount}`);
    }
    if (c.type === "percentage") {
      couponDiscount = round(subtotal * (parseFloat(c.value) / 100));
    } else if (c.type === "fixed") {
      couponDiscount = parseFloat(c.value);
    }
    coupon = { id: c.id, code: c.code };
  }

  // Manual discount
  let manualDiscount = 0;
  if (input.manualDiscount) {
    if (input.manualDiscount.type === "percent") {
      manualDiscount = round(subtotal * (input.manualDiscount.value / 100));
    } else {
      manualDiscount = round(input.manualDiscount.value);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount - manualDiscount);

  // Shipping
  const rates = siteConfig.shippingRates as Record<string, number>;
  const shippingCost =
    discountedSubtotal >= siteConfig.freeShippingThreshold
      ? 0
      : rates[input.shippingMethod] ?? rates.standard;

  // Tax: override if provided, else compute on discounted subtotal
  const taxAmount =
    input.taxOverride !== undefined
      ? round(input.taxOverride)
      : round(discountedSubtotal * siteConfig.taxRate);

  const total = round(discountedSubtotal + shippingCost + taxAmount);

  return {
    resolvedItems,
    coupon,
    totals: {
      subtotal,
      shippingCost,
      taxAmount,
      couponDiscount,
      manualDiscount,
      total,
    } satisfies ComputedTotals,
  };
}

async function ensureCustomer(input: CreateManualOrderInput): Promise<string> {
  if (input.customer.mode === "existing") return input.customer.userId;

  // New customer — create or reuse if email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, input.customer.email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) return existing[0].id;

  const placeholderPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
  const [created] = await db
    .insert(users)
    .values({
      email: input.customer.email.toLowerCase(),
      name: input.customer.name,
      phone: input.customer.phone || null,
      passwordHash: placeholderPassword,
      role: "customer",
    })
    .returning();
  return created.id;
}

async function ensureAddress(
  userId: string,
  addr: CreateManualOrderInput["shippingAddress"],
  isFirstAddress: boolean
): Promise<string> {
  if (addr.mode === "saved") return addr.addressId;

  const [created] = await db
    .insert(addresses)
    .values({
      userId,
      label: addr.label || null,
      line1: addr.line1,
      line2: addr.line2 || null,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country || "US",
      isDefault: isFirstAddress,
      isGuest: !isFirstAddress, // first inline address is treated as customer's primary; subsequent are flagged guest
    })
    .returning();
  return created.id;
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `SH-${date}-${rand}`;
}

/**
 * Persist a fully-validated manual order as a `draft`. Creates user/addresses
 * as needed; does NOT decrement inventory; does NOT send confirmation email.
 */
export async function createDraftOrder(
  input: CreateManualOrderInput,
  adminId: string
): Promise<{ orderId: string; orderNumber: string }> {
  const { resolvedItems, coupon, totals } = await computeTotals(input);

  const customerId = await ensureCustomer(input);

  // For new-customer + inline address, treat as first/default address (not guest).
  const isNewCustomer = input.customer.mode === "new";
  const shippingAddressId = await ensureAddress(
    customerId,
    input.shippingAddress,
    isNewCustomer && input.shippingAddress.mode === "inline"
  );

  let billingAddressId = shippingAddressId;
  if (!input.billingSameAsShipping && input.billingAddress) {
    billingAddressId = await ensureAddress(customerId, input.billingAddress, false);
  }

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: customerId,
      status: "draft",
      subtotal: totals.subtotal.toFixed(2),
      shippingCost: totals.shippingCost.toFixed(2),
      taxAmount: totals.taxAmount.toFixed(2),
      discountAmount: totals.couponDiscount.toFixed(2),
      manualDiscountAmount: totals.manualDiscount.toFixed(2),
      manualDiscountReason: input.manualDiscount?.reason || null,
      total: totals.total.toFixed(2),
      shippingMethod: input.shippingMethod,
      shippingAddressId,
      billingAddressId,
      isGift: input.isGift,
      giftMessage: input.giftMessage || null,
      notes: input.notes || null,
      taxOverride: input.taxOverride !== undefined ? input.taxOverride.toFixed(2) : null,
      createdByAdminId: adminId,
    })
    .returning();

  for (const item of resolvedItems) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: item.lineTotal.toFixed(2),
      isCustom: item.kind === "custom",
      customDescription: item.kind === "custom" ? item.customDescription : null,
      priceOverride: item.priceOverride,
    });
  }

  // Apply coupon usage immediately on manual orders (admin choice; locks discount).
  if (coupon) {
    await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.id, coupon.id));
  }

  await logOrderAction({
    orderId: order.id,
    adminId,
    action: "order_created_manual",
    details: `Draft order ${orderNumber} created`,
    newValue: "draft",
  }).catch(() => {});

  return { orderId: order.id, orderNumber };
}
