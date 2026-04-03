import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders, orderItems, inventory, inventoryLog, coupons, products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { sendOrderConfirmationEmail, sendLowStockAlerts } from "@/lib/email-notifications";
import { logOrderAction } from "@/lib/order-audit";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    const webhookSecret = await getWebhookSecret();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Check idempotency
    const existingOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id))
      .limit(1);

    if (existingOrders.length > 0) {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const couponCode = metadata.couponCode;
    const discountAmount = parseFloat(metadata.discountAmount || "0");

    // Get line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    const date = new Date();
    const orderNumber = `SH-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const subtotal = (session.amount_total || 0) / 100;
    const shippingCost = (session.total_details?.amount_shipping || 0) / 100;
    const taxAmount = (session.total_details?.amount_tax || 0) / 100;
    const total = subtotal;

    if (userId) {
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          userId,
          status: "confirmed",
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

      // Create order items and decrement inventory
      for (const item of lineItems.data) {
        // Find matching product by name
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

          // Decrement inventory
          await db
            .update(inventory)
            .set({
              quantity: sql`${inventory.quantity} - ${item.quantity || 1}`,
              updatedAt: new Date(),
            })
            .where(eq(inventory.productId, product.id));

          // Log inventory change
          const [inv] = await db
            .select()
            .from(inventory)
            .where(eq(inventory.productId, product.id))
            .limit(1);

          if (inv) {
            await db.insert(inventoryLog).values({
              productId: product.id,
              previousQty: inv.quantity + (item.quantity || 1),
              newQty: inv.quantity,
              changeReason: "sale",
              notes: `Order ${orderNumber}`,
            });
          }
        }
      }

      // Update coupon usage
      if (couponCode) {
        await db
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.code, couponCode.toUpperCase()));
      }

      // Audit log for order creation
      logOrderAction({
        orderId: order.id,
        action: "order_created",
        details: `Order ${orderNumber} created via Stripe checkout`,
        newValue: "confirmed",
      }).catch(() => {});

      // Send order confirmation and check low stock (fire-and-forget)
      sendOrderConfirmationEmail(order.id).catch(() => {});
      sendLowStockAlerts().catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
