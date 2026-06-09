import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders, orderItems, products, users, ggsaOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { logOrderAction } from "@/lib/order-audit";
import { finalizeOrderAfterPayment } from "@/lib/admin-orders/finalize";

type CheckoutCartItem = {
  productId: string;
  variantId: string | null;
  sku?: string | null;
  name: string;
  variantDescription: string | null;
  unitPrice: number;
  quantity: number;
};

function decodeCartItems(metadata: Stripe.Metadata): CheckoutCartItem[] | null {
  const chunkCount = parseInt(metadata.cartItemsChunks || "0", 10);
  if (!chunkCount) return null;
  let json = "";
  for (let i = 0; i < chunkCount; i++) {
    const part = metadata[`cartItems_${i}`];
    if (typeof part !== "string") return null;
    json += part;
  }
  try {
    return JSON.parse(json) as CheckoutCartItem[];
  } catch {
    return null;
  }
}

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

    // GGSA promo orders live in their own table and have no user/shipping.
    // Handle (and short-circuit) before the main self-checkout path, which
    // requires a userId in metadata.
    if (session.metadata?.source === "ggsa") {
      const ggsaOrderId = session.metadata.ggsaOrderId;
      if (ggsaOrderId) {
        // Idempotent: only stamp paidAt if not already set.
        const [existing] = await db
          .select({ id: ggsaOrders.id, paidAt: ggsaOrders.paidAt })
          .from(ggsaOrders)
          .where(eq(ggsaOrders.id, ggsaOrderId))
          .limit(1);
        if (existing && !existing.paidAt) {
          await db
            .update(ggsaOrders)
            .set({
              status: "paid",
              paidAt: new Date(),
              stripeSessionId: session.id,
              stripePaymentIntentId: (session.payment_intent as string) || null,
              updatedAt: new Date(),
            })
            .where(eq(ggsaOrders.id, ggsaOrderId));
        }
      }
      return NextResponse.json({ received: true });
    }

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
      const taxAmount = (session.total_details?.amount_tax || 0) / 100;
      const total = subtotal;

      // Shipping cost comes from the Shippo line item we passed in metadata
      const shippingRateCents = parseInt(metadata.shippingRateCents || "0", 10);
      const shippingCost = shippingRateCents / 100;
      const shippingEstimatedDays = metadata.shippingEstimatedDays
        ? parseInt(metadata.shippingEstimatedDays, 10)
        : null;

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
          shippingCarrier: metadata.shippingCarrier || null,
          shippingService: metadata.shippingService || null,
          shippingRateCents: shippingRateCents || null,
          shippingEstimatedDays,
          shippoRateId: metadata.shippoRateId || null,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          isGift: metadata.isGift === "true",
          giftMessage: metadata.giftMessage || null,
          // Last-touch ad attribution — captured by the client before
          // redirecting to Stripe, surfaced through session metadata.
          utmSource: metadata.utmSource || null,
          utmMedium: metadata.utmMedium || null,
          utmCampaign: metadata.utmCampaign || null,
          utmContent: metadata.utmContent || null,
          utmTerm: metadata.utmTerm || null,
          gclid: metadata.gclid || null,
          fbclid: metadata.fbclid || null,
          landingReferrer: metadata.landingReferrer || null,
        })
        .returning();

      orderId = order.id;

      // Prefer the cartItems metadata we stuffed into the session — it has variant info.
      // Fall back to the legacy product-name lookup so in-flight pre-deploy sessions still work.
      const cartItems = decodeCartItems(session.metadata || {});
      if (cartItems && cartItems.length > 0) {
        for (const ci of cartItems) {
          await db.insert(orderItems).values({
            orderId: order.id,
            productId: ci.productId,
            variantId: ci.variantId,
            sku: ci.sku ?? null,
            productName: ci.name,
            variantDescription: ci.variantDescription,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice.toFixed(2),
            totalPrice: (ci.unitPrice * ci.quantity).toFixed(2),
          });
        }
      } else {
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
              sku: product.sku,
              productName: product.name,
              quantity: item.quantity || 1,
              unitPrice: product.price,
              totalPrice: ((item.quantity || 1) * parseFloat(product.price)).toFixed(2),
            });
          }
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

    // If checkout flagged "create account", fire verification email now that
    // the user has actually paid. We POST to our own endpoint so rate-limit
    // and token-issuance logic stays in one place.
    if (metadata.triggerVerifyEmail === "true") {
      try {
        const [u] = await db
          .select({ email: users.email, emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (u && !u.emailVerified) {
          const { issueVerificationEmail } = await import("@/lib/auth-verification");
          await issueVerificationEmail(u.email, { bypassRateLimit: true });
        }
      } catch (e) {
        console.error("Failed to trigger post-checkout verify email:", e);
      }
    }
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
