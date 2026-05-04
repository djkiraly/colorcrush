import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe, getPublishableKey } from "@/lib/stripe";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentLinkToken, token))
    .limit(1);

  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  if (order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const amount = Math.round(parseFloat(order.total) * 100);

  // Reuse existing PaymentIntent if one is already attached and amount matches.
  let intent;
  if (order.stripePaymentIntentId) {
    try {
      intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (intent.amount !== amount || intent.status === "canceled") {
        intent = null;
      }
    } catch {
      intent = null;
    }
  }

  if (!intent) {
    intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, mode: "customer_pay" },
      description: `Order ${order.orderNumber}`,
    });
    await db
      .update(orders)
      .set({ stripePaymentIntentId: intent.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  }

  const publishableKey = await getPublishableKey();
  return NextResponse.json({
    clientSecret: intent.client_secret,
    publishableKey,
  });
}
