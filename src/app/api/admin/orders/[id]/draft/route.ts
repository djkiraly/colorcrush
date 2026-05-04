import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateManualOrderSchema } from "@/lib/validators/manual-order";
import { computeTotals } from "@/lib/admin-orders/build-draft";
import { logOrderAction } from "@/lib/order-audit";

const EDITABLE_STATUSES = new Set(["draft", "pending_payment"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!EDITABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: `Cannot edit order in status "${order.status}"` },
      { status: 400 }
    );
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = updateManualOrderSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  try {
    // computeTotals expects the customer field — synthesize a placeholder since we're only updating items/adjustments.
    const { resolvedItems, totals } = await computeTotals({
      ...parsed,
      customer: { mode: "existing", userId: order.userId },
    });

    // Replace order items
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    for (const item of resolvedItems) {
      await db.insert(orderItems).values({
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.lineTotal.toFixed(2),
        isCustom: item.kind === "custom",
        customDescription: item.kind === "custom" ? item.customDescription : null,
        priceOverride: item.priceOverride,
      });
    }

    await db
      .update(orders)
      .set({
        subtotal: totals.subtotal.toFixed(2),
        shippingCost: totals.shippingCost.toFixed(2),
        taxAmount: totals.taxAmount.toFixed(2),
        discountAmount: totals.couponDiscount.toFixed(2),
        manualDiscountAmount: totals.manualDiscount.toFixed(2),
        manualDiscountReason: parsed.manualDiscount?.reason || null,
        total: totals.total.toFixed(2),
        shippingMethod: parsed.shippingMethod,
        isGift: parsed.isGift,
        giftMessage: parsed.giftMessage || null,
        notes: parsed.notes || null,
        taxOverride:
          parsed.taxOverride !== undefined ? parsed.taxOverride.toFixed(2) : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await logOrderAction({
      orderId: id,
      adminId: (session?.user as { id?: string })?.id,
      action: "order_edited_manual",
      details: `Order ${order.orderNumber} updated`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update draft" },
      { status: 400 }
    );
  }
}
