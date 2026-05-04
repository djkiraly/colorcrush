import { db } from "@/lib/db";
import { orders, orderItems, inventory, inventoryLog, coupons } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendOrderConfirmationEmail, sendLowStockAlerts } from "@/lib/email-notifications";
import { logOrderAction } from "@/lib/order-audit";

export type PaymentInfo =
  | { method: "stripe_checkout"; sessionId: string; paymentIntentId?: string | null; couponCode?: string | null }
  | { method: "stripe_admin_charge" | "stripe_customer_pay"; paymentIntentId: string }
  | { method: "offline_cash" | "offline_check" | "offline_other"; notes?: string; adminId: string };

/**
 * Idempotently finalize a paid order:
 *  - status → confirmed (or paid_offline for offline payments)
 *  - paidAt set
 *  - paymentMethod recorded
 *  - inventory decremented + inventory_log written for each catalog line item
 *  - coupon usedCount incremented (Stripe-checkout path only; manual orders apply coupon at draft time)
 *  - audit log entry
 *  - confirmation email sent
 *  - low-stock alert check fired (fire-and-forget)
 *
 * Safe to call from webhook handlers — re-entrant via paidAt check.
 */
export async function finalizeOrderAfterPayment(orderId: string, payment: PaymentInfo) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    console.error(`[finalize] order ${orderId} not found`);
    return;
  }

  // Idempotency: if already paid, do nothing
  if (order.paidAt) {
    return;
  }

  const isOffline = payment.method.startsWith("offline_");
  const newStatus = isOffline ? "paid_offline" : "confirmed";

  const updateValues: Record<string, unknown> = {
    status: newStatus,
    paymentMethod: payment.method,
    paidAt: new Date(),
    updatedAt: new Date(),
  };
  if ("paymentIntentId" in payment && payment.paymentIntentId) {
    updateValues.stripePaymentIntentId = payment.paymentIntentId;
  }
  if ("sessionId" in payment && payment.sessionId) {
    updateValues.stripeSessionId = payment.sessionId;
  }
  if (isOffline && "notes" in payment && payment.notes) {
    updateValues.offlinePaymentNotes = payment.notes;
  }

  await db.update(orders).set(updateValues).where(eq(orders.id, orderId));

  // Decrement inventory for catalog line items
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.isCustom || !item.productId) continue;

    await db
      .update(inventory)
      .set({
        quantity: sql`${inventory.quantity} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventory.productId, item.productId));

    const [inv] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, item.productId))
      .limit(1);

    if (inv) {
      await db.insert(inventoryLog).values({
        productId: item.productId,
        previousQty: inv.quantity + item.quantity,
        newQty: inv.quantity,
        changeReason: "sale",
        notes: `Order ${order.orderNumber}`,
      });
    }
  }

  // Coupon usage tracking (Stripe-checkout path only — manual orders bump coupon at draft create)
  if (payment.method === "stripe_checkout" && payment.couponCode) {
    await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.code, payment.couponCode.toUpperCase()));
  }

  // Audit
  const adminId = "adminId" in payment ? payment.adminId : undefined;
  await logOrderAction({
    orderId,
    adminId,
    action: "order_paid",
    details: `Payment recorded via ${payment.method}`,
    newValue: newStatus,
  }).catch(() => {});

  // Confirmation email + low-stock alerts (fire-and-forget)
  sendOrderConfirmationEmail(orderId).catch((err) =>
    console.error(`[finalize] confirmation email failed for ${orderId}:`, err)
  );
  sendLowStockAlerts().catch(() => {});
}
