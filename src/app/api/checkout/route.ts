import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { products, coupons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { siteConfig } from "../../../../site.config";

interface SelectedRateInput {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  estimatedDays: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      couponCode,
      giftMessage,
      isGift,
      userId,
      shippingRate,
    }: {
      items: { productId: string; quantity: number }[];
      couponCode?: string;
      giftMessage?: string;
      isGift?: boolean;
      userId?: string;
      shippingRate?: SelectedRateInput;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shippingRate || !shippingRate.rateId) {
      return NextResponse.json({ error: "Shipping option not selected" }, { status: 400 });
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...lineItems, shippingLineItem],
      metadata: {
        userId: userId || "",
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
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
