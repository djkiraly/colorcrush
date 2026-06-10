import { db } from "@/lib/db";
import { users, orders, orderItems, products, inventory, ggsaOrders } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail";
import { welcomeEmail } from "@/lib/email-templates/welcome";
import { orderConfirmationEmail } from "@/lib/email-templates/order-confirmation";
import { orderShippedEmail } from "@/lib/email-templates/order-shipped";
import { orderDeliveredEmail } from "@/lib/email-templates/order-delivered";
import { lowStockAlertEmail } from "@/lib/email-templates/low-stock-alert";
import { ggsaOrderConfirmationEmail } from "@/lib/email-templates/ggsa-order-confirmation";
import { ggsaOrderNotificationEmail } from "@/lib/email-templates/ggsa-order-notification";
import { GGSA_FLAVOR_LABELS, type GgsaFlavor } from "@/lib/validators/ggsa";
import { formatPickupDate, getNextPickupDate, GGSA_PICKUP_NOTICE } from "@/lib/ggsa-pickup";
import { getSettings } from "@/lib/settings";

/**
 * Send welcome email to a newly registered customer.
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string) {
  const settings = await getSettings();
  const html = await welcomeEmail(name);
  await sendEmail({
    to: email,
    subject: `Welcome to ${settings.name}!`,
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

  const html = await orderConfirmationEmail({
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

  const html = await orderShippedEmail({
    customerName: user.name,
    orderNumber: order.orderNumber,
    trackingNumber: trackingNumber || order.shippoTrackingNumber || "",
    trackingCarrier: trackingCarrier || order.shippingCarrier || "",
    trackingUrl: order.shippoTrackingUrl || null,
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

  const html = await orderDeliveredEmail({
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
 * On a completed GGSA Team Sweet Bag order: email the customer a receipt and
 * notify the store/GGSA contact so the order can be bagged for pickup.
 *
 * GGSA orders live in `ggsa_orders` (no user account / no `orders` row), so we
 * deliberately omit userId/orderId on sendEmail — those columns FK to
 * users/orders and would error.
 */
export async function sendGgsaOrderEmails(ggsaOrderId: string) {
  const [order] = await db
    .select()
    .from(ggsaOrders)
    .where(eq(ggsaOrders.id, ggsaOrderId))
    .limit(1);
  if (!order) return;

  const flavorLabel =
    GGSA_FLAVOR_LABELS[order.flavor as GgsaFlavor] ?? order.flavor;
  const total = order.totalCents / 100;
  const pickupDate = formatPickupDate(
    order.pickupDate ? new Date(order.pickupDate) : getNextPickupDate()
  );

  // 1) Customer confirmation
  try {
    const html = await ggsaOrderConfirmationEmail({
      contactName: order.contactName,
      flavorLabel,
      quantity: order.quantity,
      total,
      pickupDate,
      pickupNotice: GGSA_PICKUP_NOTICE,
    });
    await sendEmail({
      to: order.email,
      subject: "Your GGSA Team Sweet Bag order is confirmed",
      html,
      templateName: "ggsa-order-confirmation",
    });
  } catch (err) {
    console.error("[ggsa] customer confirmation email failed:", err);
  }

  // 2) Business / GGSA notification — to the configured store contact.
  try {
    const settings = await getSettings();
    const notifyTo =
      settings.contact?.email?.trim() || settings.shipping?.origin?.email?.trim() || "";
    if (!notifyTo) {
      console.warn("[ggsa] no store contact email configured — skipping order notification");
      return;
    }
    const html = await ggsaOrderNotificationEmail({
      teamName: order.teamName ?? "",
      contactName: order.contactName,
      email: order.email,
      phone: order.phone,
      flavorLabel,
      quantity: order.quantity,
      total,
      pickupDate,
      orderedAt: order.createdAt
        ? new Date(order.createdAt).toLocaleString("en-US")
        : "",
    });
    await sendEmail({
      to: notifyTo,
      subject: `New GGSA order — ${order.quantity} × ${flavorLabel} (pickup ${pickupDate})`,
      html,
      templateName: "ggsa-order-notification",
    });
  } catch (err) {
    console.error("[ggsa] store notification email failed:", err);
  }
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

  const settings = await getSettings();
  const html = await lowStockAlertEmail(
    lowStockItems.map((i) => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      threshold: i.threshold,
    }))
  );

  await sendEmail({
    to: settings.contact.email,
    subject: `Low Stock Alert — ${lowStockItems.length} product(s)`,
    html,
    templateName: "low-stock-alert",
  });
}
