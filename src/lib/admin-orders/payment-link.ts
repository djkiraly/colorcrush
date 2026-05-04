import crypto from "node:crypto";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail";
import { paymentLinkEmail } from "@/lib/email-templates/payment-link";
import { logOrderAction } from "@/lib/order-audit";
import { siteConfig } from "../../../site.config";

const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function generatePaymentLinkToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function buildPayUrl(token: string): string {
  return `${siteConfig.url}/pay/${token}`;
}

/**
 * Generate (or rotate) a payment-link token for an order, send the email, and log audit.
 * Transitions draft → pending_payment. For resend, status is already pending_payment;
 * we just rotate the token.
 */
export async function issuePaymentLink(orderId: string, adminId: string | undefined, isResend: boolean) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  if (!isResend && order.status !== "draft") {
    throw new Error(`Cannot send payment link from status "${order.status}"`);
  }
  if (isResend && order.status !== "pending_payment") {
    throw new Error(`Cannot resend payment link from status "${order.status}"`);
  }

  const token = generatePaymentLinkToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db
    .update(orders)
    .set({
      status: "pending_payment",
      paymentLinkToken: token,
      paymentLinkExpiresAt: expiresAt,
      paymentLinkSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) throw new Error("Customer not found for order");

  const items = await db
    .select({
      name: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const payUrl = buildPayUrl(token);
  const html = paymentLinkEmail({
    customerName: user.name,
    orderNumber: order.orderNumber,
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: parseFloat(i.unitPrice) })),
    subtotal: parseFloat(order.subtotal),
    shippingCost: parseFloat(order.shippingCost),
    taxAmount: parseFloat(order.taxAmount),
    total: parseFloat(order.total),
    payUrl,
    expiresAt,
  });

  await sendEmail({
    to: user.email,
    subject: isResend
      ? `Reminder: Pay for order ${order.orderNumber}`
      : `Your order ${order.orderNumber} is ready for payment`,
    html,
    templateName: "payment-link",
    userId: user.id,
    orderId,
  });

  await logOrderAction({
    orderId,
    adminId,
    action: isResend ? "payment_link_resent" : "payment_link_sent",
    details: `Sent to ${user.email}; expires ${expiresAt.toISOString()}`,
  }).catch(() => {});

  return { payUrl, expiresAt };
}
