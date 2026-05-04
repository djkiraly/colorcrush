import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { products, coupons, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { siteConfig } from "../../../../site.config";

interface SelectedRateInput {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  estimatedDays: number | null;
}

interface GuestInfo {
  email: string;
  name: string;
  createAccount?: boolean;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      couponCode,
      giftMessage,
      isGift,
      guest,
      shippingRate,
    }: {
      items: { productId: string; quantity: number }[];
      couponCode?: string;
      giftMessage?: string;
      isGift?: boolean;
      guest?: GuestInfo;
      shippingRate?: SelectedRateInput;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shippingRate || !shippingRate.rateId) {
      return NextResponse.json({ error: "Shipping option not selected" }, { status: 400 });
    }

    // Resolve userId server-side: prefer authed session, fall back to guest path.
    const session = await auth();
    const sessionUserId = session?.user?.id;
    let userId: string;
    let triggerVerifyEmail = false;

    if (sessionUserId) {
      userId = sessionUserId;
    } else {
      // Guest path
      if (!guest?.email || !guest?.name) {
        return NextResponse.json(
          { error: "Email and name are required for guest checkout" },
          { status: 400 }
        );
      }
      const email = guest.email.trim().toLowerCase();
      const name = guest.name.trim();

      if (guest.createAccount && (!guest.password || guest.password.length < 8)) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const [existing] = await db
        .select({
          id: users.id,
          isGuest: users.isGuest,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        if (!existing.isGuest || existing.passwordHash) {
          // Real account exists — refuse to hijack it.
          return NextResponse.json(
            {
              error:
                "An account with that email already exists. Please sign in to complete your purchase.",
              code: "ACCOUNT_EXISTS",
            },
            { status: 409 }
          );
        }
        // Reuse the existing guest stub.
        userId = existing.id;
        if (guest.createAccount && guest.password) {
          // Upgrade guest stub to a real account.
          const passwordHash = await bcrypt.hash(guest.password, 12);
          await db
            .update(users)
            .set({ passwordHash, isGuest: false, name, updatedAt: new Date() })
            .where(eq(users.id, existing.id));
          triggerVerifyEmail = true;
        } else {
          // Keep as guest, but refresh name.
          await db
            .update(users)
            .set({ name, updatedAt: new Date() })
            .where(eq(users.id, existing.id));
        }
      } else {
        const passwordHash = guest.createAccount && guest.password
          ? await bcrypt.hash(guest.password, 12)
          : null;
        const [created] = await db
          .insert(users)
          .values({
            email,
            name,
            role: "customer",
            passwordHash,
            isGuest: !guest.createAccount,
          })
          .returning({ id: users.id });
        userId = created.id;
        triggerVerifyEmail = !!guest.createAccount;
      }
    }

    // Fetch products
    const productIds = items.map((i) => i.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const lineItems = items.map((item) => {
      const product = productRows.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      return {
        price_data: {
          currency: siteConfig.currency.toLowerCase(),
          product_data: {
            name: product.name,
            description: product.shortDescription || undefined,
          },
          unit_amount: Math.round(parseFloat(product.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    // Handle coupon
    let discountAmount = 0;
    if (couponCode) {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase()))
        .limit(1);

      if (coupon && coupon.isActive) {
        const subtotal = items.reduce((sum, item) => {
          const product = productRows.find((p) => p.id === item.productId);
          return sum + (product ? parseFloat(product.price) * item.quantity : 0);
        }, 0);

        if (coupon.type === "percentage") {
          discountAmount = subtotal * (parseFloat(coupon.value) / 100);
        } else if (coupon.type === "fixed") {
          discountAmount = parseFloat(coupon.value);
        }
      }
    }

    // Shipping line item from selected Shippo (or flat) rate
    const shippingLineItem = {
      price_data: {
        currency: siteConfig.currency.toLowerCase(),
        product_data: {
          name:
            shippingRate.carrier === "flat"
              ? `Shipping — ${shippingRate.service}`
              : `Shipping — ${shippingRate.carrier.toUpperCase()} ${shippingRate.service}`,
        },
        unit_amount: shippingRate.amountCents,
      },
      quantity: 1,
    };

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...lineItems, shippingLineItem],
      metadata: {
        userId,
        couponCode: couponCode || "",
        giftMessage: giftMessage || "",
        isGift: isGift ? "true" : "false",
        discountAmount: discountAmount.toFixed(2),
        shippoRateId: shippingRate.rateId,
        shippingCarrier: shippingRate.carrier,
        shippingService: shippingRate.service,
        shippingRateCents: String(shippingRate.amountCents),
        shippingEstimatedDays:
          shippingRate.estimatedDays != null ? String(shippingRate.estimatedDays) : "",
        triggerVerifyEmail: triggerVerifyEmail ? "true" : "false",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
