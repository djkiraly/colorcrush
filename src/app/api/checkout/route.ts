import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { products, coupons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { siteConfig } from "../../../../site.config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingMethod, couponCode, giftMessage, isGift, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Fetch products
    const productIds = items.map((i: { productId: string }) => i.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const lineItems = items.map((item: { productId: string; quantity: number }) => {
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
        const subtotal = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
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

    // Shipping
    const shippingRate = siteConfig.shippingRates[shippingMethod as keyof typeof siteConfig.shippingRates] || siteConfig.shippingRates.standard;

    const shippingOptions = [
      {
        shipping_rate_data: {
          type: "fixed_amount" as const,
          fixed_amount: {
            amount: Math.round(shippingRate * 100),
            currency: siteConfig.currency.toLowerCase(),
          },
          display_name: shippingMethod === "express" ? "Express Shipping" : shippingMethod === "overnight" ? "Overnight Shipping" : "Standard Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: shippingMethod === "overnight" ? 1 : shippingMethod === "express" ? 2 : 5 },
            maximum: { unit: "business_day" as const, value: shippingMethod === "overnight" ? 1 : shippingMethod === "express" ? 3 : 7 },
          },
        },
      },
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_options: shippingOptions,
      metadata: {
        userId: userId || "",
        couponCode: couponCode || "",
        giftMessage: giftMessage || "",
        isGift: isGift ? "true" : "false",
        discountAmount: discountAmount.toFixed(2),
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
