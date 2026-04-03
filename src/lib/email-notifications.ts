import { db } from "@/lib/db";
import { users, orders, orderItems, products, inventory } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail";
import { welcomeEmail } from "@/lib/email-templates/welcome";
import { orderConfirmationEmail } from "@/lib/email-templates/order-confirmation";
import { orderShippedEmail } from "@/lib/email-templates/order-shipped";
import { orderDeliveredEmail } from "@/lib/email-templates/order-delivered";
import { lowStockAlertEmail } from "@/lib/email-templates/low-stock-alert";
import { siteConfig } from "../../site.config";

/**
 * Send welcome email to a newly registered customer.
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  const html = welcomeEmail(name);
  await sendEmail({
    to: email,
    subject: `Welcome to ${siteConfig.name}!`,
    html,
    templateName: "welcome",
    userId,
  });
}

/**
 * Send order confirmation email after successful checkout.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return;

  const items = await db
    .select({
      name: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const html = orderConfirmationEmail({
    customerName: user.name,
    orderNumber: order.orderNumber,
    items: items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: parseFloat(i.unitPrice),
    })),
    subtotal: parseFloat(order.subtotal),
    shippingCost: parseFloat(order.shippingCost),
    taxAmount: parseFloat(order.taxAmount),
    total: parseFloat(order.total),
    orderId: order.id,
  });

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
    templateName: "order-confirmation",
    userId: user.id,
    orderId: order.id,
  });
}

/**
 * Send shipping notification email.
 */
export async function sendOrderShippedEmail(
  orderId: string,
  trackingNumber: string,
  trackingCarrier: string
) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return;

  const html = orderShippedEmail({
    customerName: user.name,
    orderNumber: order.orderNumber,
    trackingNumber,
    trackingCarrier,
    orderId: order.id,
  });

  await sendEmail({
    to: user.email,
    subject: `Your Order Has Shipped — ${order.orderNumber}`,
    html,
    templateName: "order-shipped",
    userId: user.id,
    orderId: order.id,
  });
}

/**
 * Send delivery confirmation email.
 */
export async function sendOrderDeliveredEmail(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return;

  const html = orderDeliveredEmail({
    customerName: user.name,
    orderNumber: order.orderNumber,
    orderId: order.id,
  });

  await sendEmail({
    to: user.email,
    subject: `Your Order Has Been Delivered — ${order.orderNumber}`,
    html,
    templateName: "order-delivered",
    userId: user.id,
    orderId: order.id,
  });
}

/**
 * Check inventory levels and send low stock alerts to the store contact email.
 */
export async function sendLowStockAlerts() {
  const lowStockItems = await db
    .select({
      name: products.name,
      sku: products.sku,
      quantity: inventory.quantity,
      threshold: inventory.lowStockThreshold,
    })
    .from(inventory)
    .innerJoin(products, eq(products.id, inventory.productId))
    .where(
      and(
        lte(inventory.quantity, inventory.lowStockThreshold),
        eq(products.isActive, true)
      )
    );

  if (lowStockItems.length === 0) return;

  const html = lowStockAlertEmail(
    lowStockItems.map((i) => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      threshold: i.threshold,
    }))
  );

  await sendEmail({
    to: siteConfig.contact.email,
    subject: `Low Stock Alert — ${lowStockItems.length} product(s)`,
    html,
    templateName: "low-stock-alert",
  });
}
