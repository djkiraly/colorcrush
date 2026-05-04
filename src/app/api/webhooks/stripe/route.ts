import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { logOrderAction } from "@/lib/order-audit";
import { finalizeOrderAfterPayment } from "@/lib/admin-orders/finalize";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    const webhookSecret = await getWebhookSecret();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Idempotency: did we already create an order for this session?
    const existingOrders = await db
      .select({ id: orders.id, paidAt: orders.paidAt })
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id))
      .limit(1);

    if (existingOrders.length > 0 && existingOrders[0].paidAt) {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const couponCode = metadata.couponCode || null;
    const discountAmount = parseFloat(metadata.discountAmount || "0");

    if (!userId) {
      // Self-checkout requires a userId in metadata
      return NextResponse.json({ received: true });
    }

    // Build the order if it doesn't exist yet (self-checkout path).
    let orderId = existingOrders[0]?.id;

    if (!orderId) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const date = new Date();
      const orderNumber = `SH-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

      const subtotal = (session.amount_total || 0) / 100;
      const shippingCost = (session.total_details?.amount_shipping || 0) / 100;
      const taxAmount = (session.total_details?.amount_tax || 0) / 100;
      const total = subtotal;

      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          userId,
          status: "pending_payment", // bumped to confirmed by finalize
          subtotal: (subtotal - shippingCost - taxAmount + discountAmount).toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          shippingMethod: "standard",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          isGift: metadata.isGift === "true",
          giftMessage: metadata.giftMessage || null,
        })
        .returning();

      orderId = order.id;

      for (const item of lineItems.data) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.name, item.description || ""))
          .limit(1);

        if (product) {
          await db.insert(orderItems).values({
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity || 1,
            unitPrice: product.price,
            totalPrice: ((item.quantity || 1) * parseFloat(product.price)).toFixed(2),
          });
        }
      }

      await logOrderAction({
        orderId: order.id,
        action: "order_created",
        details: `Order ${orderNumber} created via Stripe checkout`,
        newValue: "pending_payment",
      }).catch(() => {});
    }

    await finalizeOrderAfterPayment(orderId, {
      method: "stripe_checkout",
      sessionId: session.id,
      paymentIntentId: (session.payment_intent as string) || null,
      couponCode,
    });
  }

  // Manual-order pay paths (admin charge OR customer pay link) emit payment_intent.succeeded
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    const mode = intent.metadata?.mode;

    if (orderId && (mode === "admin_charge" || mode === "customer_pay")) {
      await finalizeOrderAfterPayment(orderId, {
        method: mode === "admin_charge" ? "stripe_admin_charge" : "stripe_customer_pay",
        paymentIntentId: intent.id,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await logOrderAction({
        orderId,
        action: "order_payment_failed",
        details: intent.last_payment_error?.message || "Payment failed",
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
