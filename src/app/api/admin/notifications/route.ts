import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  scheduledAlerts,
  products,
  inventory,
  orders,
  ggsaOrders,
  customerInteractions,
  reviews,
} from "@/lib/db/schema";
import { and, eq, lte, desc, isNull, or, inArray, sql } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { GGSA_FLAVOR_LABELS, type GgsaFlavor } from "@/lib/validators/ggsa";

// Aggregates everything the admin should be nudged about into a single payload
// for the header bell: priority alerts, low stock, new orders (store + GGSA),
// open customer interactions, and reviews awaiting moderation.
//
// Each group carries its own total count plus up to MAX_ITEMS preview rows.
const MAX_ITEMS = 5;

// "Open" standard orders = paid and awaiting fulfillment (mirrors order-counts).
const OPEN_ORDER_STATUSES: (typeof orders.$inferSelect)["status"][] = [
  "confirmed",
  "paid_offline",
  "processing",
];

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  severity?: string;
  createdAt?: string | Date | null;
  href?: string;
};

type NotificationGroup = {
  key: string;
  label: string;
  href: string;
  count: number;
  items: NotificationItem[];
};

export async function GET() {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const [
    priorityAlerts,
    firingInventoryAlerts,
    lowStockRows,
    lowStockCountRow,
    storeOpenCountRow,
    ggsaPaidCountRow,
    storeOrderItems,
    ggsaOrderItems,
    interactionCountRow,
    interactionItems,
    reviewCountRow,
    reviewItems,
  ] = await Promise.all([
    // Priority alerts — system alerts (always) + date alerts whose trigger has passed.
    db
      .select({
        id: scheduledAlerts.id,
        title: scheduledAlerts.title,
        message: scheduledAlerts.message,
        severity: scheduledAlerts.severity,
        createdAt: scheduledAlerts.createdAt,
      })
      .from(scheduledAlerts)
      .where(
        and(
          eq(scheduledAlerts.isAcknowledged, false),
          or(
            eq(scheduledAlerts.type, "system"),
            and(
              eq(scheduledAlerts.type, "date"),
              or(
                isNull(scheduledAlerts.triggerAt),
                lte(scheduledAlerts.triggerAt, now)
              )
            )
          )
        )
      )
      .orderBy(desc(scheduledAlerts.createdAt)),

    // Inventory-type alerts that are currently firing (stock at/under threshold).
    db
      .select({
        id: scheduledAlerts.id,
        title: scheduledAlerts.title,
        message: scheduledAlerts.message,
        severity: scheduledAlerts.severity,
        createdAt: scheduledAlerts.createdAt,
        thresholdQuantity: scheduledAlerts.thresholdQuantity,
        currentQuantity: inventory.quantity,
      })
      .from(scheduledAlerts)
      .innerJoin(products, eq(scheduledAlerts.productId, products.id))
      .innerJoin(inventory, eq(inventory.productId, products.id))
      .where(
        and(
          eq(scheduledAlerts.isAcknowledged, false),
          eq(scheduledAlerts.type, "inventory")
        )
      ),

    // Low stock preview rows.
    db
      .select({
        id: inventory.id,
        productName: products.name,
        quantity: inventory.quantity,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`)
      .orderBy(inventory.quantity)
      .limit(MAX_ITEMS),

    // Low stock total count.
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventory)
      .where(sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(inArray(orders.status, OPEN_ORDER_STATUSES)),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ggsaOrders)
      .where(eq(ggsaOrders.status, "paid")),

    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(inArray(orders.status, OPEN_ORDER_STATUSES))
      .orderBy(desc(orders.createdAt))
      .limit(MAX_ITEMS),

    db
      .select({
        id: ggsaOrders.id,
        teamName: ggsaOrders.teamName,
        contactName: ggsaOrders.contactName,
        flavor: ggsaOrders.flavor,
        quantity: ggsaOrders.quantity,
        createdAt: ggsaOrders.createdAt,
      })
      .from(ggsaOrders)
      .where(eq(ggsaOrders.status, "paid"))
      .orderBy(desc(ggsaOrders.createdAt))
      .limit(MAX_ITEMS),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerInteractions)
      .where(inArray(customerInteractions.status, ["open", "in_progress"])),

    db
      .select({
        id: customerInteractions.id,
        subject: customerInteractions.subject,
        type: customerInteractions.type,
        priority: customerInteractions.priority,
        createdAt: customerInteractions.createdAt,
      })
      .from(customerInteractions)
      .where(inArray(customerInteractions.status, ["open", "in_progress"]))
      .orderBy(desc(customerInteractions.createdAt))
      .limit(MAX_ITEMS),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.isApproved, false)),

    db
      .select({
        id: reviews.id,
        title: reviews.title,
        rating: reviews.rating,
        productName: products.name,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.isApproved, false))
      .orderBy(desc(reviews.createdAt))
      .limit(MAX_ITEMS),
  ]);

  // ── Priority alerts group ──
  const firing = firingInventoryAlerts.filter(
    (r) => r.thresholdQuantity != null && r.currentQuantity <= r.thresholdQuantity
  );
  const alertItems: NotificationItem[] = [...firing, ...priorityAlerts]
    .slice(0, MAX_ITEMS)
    .map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.message ?? undefined,
      severity: a.severity ?? undefined,
      createdAt: a.createdAt,
      href: "/admin/alerts",
    }));

  // ── New orders group (store + GGSA) ──
  const mergedOrderItems: NotificationItem[] = [
    ...storeOrderItems.map((o) => ({
      id: o.id,
      title: `#${o.orderNumber}`,
      subtitle: o.status.replace(/_/g, " "),
      createdAt: o.createdAt,
      href: `/admin/orders/${o.id}`,
    })),
    ...ggsaOrderItems.map((o) => ({
      id: o.id,
      title: `GGSA · ${o.teamName || o.contactName}`,
      subtitle: `${o.quantity} × ${GGSA_FLAVOR_LABELS[o.flavor as GgsaFlavor] ?? o.flavor}`,
      createdAt: o.createdAt,
      href: "/admin/ggsa-orders",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt as Date).getTime() -
        new Date(a.createdAt as Date).getTime()
    )
    .slice(0, MAX_ITEMS);

  const groups: NotificationGroup[] = [
    {
      key: "alerts",
      label: "Priority Alerts",
      href: "/admin/alerts",
      count: firing.length + priorityAlerts.length,
      items: alertItems,
    },
    {
      key: "orders",
      label: "New Orders",
      href: "/admin/orders",
      count: (storeOpenCountRow[0]?.count ?? 0) + (ggsaPaidCountRow[0]?.count ?? 0),
      items: mergedOrderItems,
    },
    {
      key: "lowStock",
      label: "Low Stock",
      href: "/admin/inventory",
      count: lowStockCountRow[0]?.count ?? 0,
      items: lowStockRows.map((r) => ({
        id: r.id,
        title: r.productName,
        subtitle: `${r.quantity} left`,
        createdAt: null,
        href: "/admin/inventory",
      })),
    },
    {
      key: "interactions",
      label: "Customer Interactions",
      href: "/admin/interactions",
      count: interactionCountRow[0]?.count ?? 0,
      items: interactionItems.map((i) => ({
        id: i.id,
        title: i.subject,
        subtitle: `${i.type.replace(/_/g, " ")} · ${i.priority}`,
        createdAt: i.createdAt,
        href: "/admin/interactions",
      })),
    },
    {
      key: "reviews",
      label: "Reviews Awaiting Approval",
      href: "/admin/reviews",
      count: reviewCountRow[0]?.count ?? 0,
      items: reviewItems.map((r) => ({
        id: r.id,
        title: r.title || `${r.rating}★ review`,
        subtitle: r.productName,
        createdAt: r.createdAt,
        href: "/admin/reviews",
      })),
    },
  ];

  const count = groups.reduce((sum, g) => sum + g.count, 0);

  return NextResponse.json({ count, groups });
}
