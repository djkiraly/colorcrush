import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledAlerts, products, inventory } from "@/lib/db/schema";
import { and, eq, lte, desc, isNull, or } from "drizzle-orm";

// Returns alerts that are currently "firing" — date alerts whose triggerAt has
// passed, or inventory alerts whose linked product stock is at or below the
// threshold. Acknowledged alerts are excluded.
export async function GET() {
  const now = new Date();

  const dateRows = await db
    .select({
      id: scheduledAlerts.id,
      type: scheduledAlerts.type,
      severity: scheduledAlerts.severity,
      title: scheduledAlerts.title,
      message: scheduledAlerts.message,
      triggerAt: scheduledAlerts.triggerAt,
      productId: scheduledAlerts.productId,
      productName: products.name,
      thresholdQuantity: scheduledAlerts.thresholdQuantity,
      createdAt: scheduledAlerts.createdAt,
    })
    .from(scheduledAlerts)
    .leftJoin(products, eq(scheduledAlerts.productId, products.id))
    .where(
      and(
        eq(scheduledAlerts.isAcknowledged, false),
        eq(scheduledAlerts.type, "date"),
        or(isNull(scheduledAlerts.triggerAt), lte(scheduledAlerts.triggerAt, now))
      )
    )
    .orderBy(desc(scheduledAlerts.triggerAt));

  const inventoryRows = await db
    .select({
      id: scheduledAlerts.id,
      type: scheduledAlerts.type,
      severity: scheduledAlerts.severity,
      title: scheduledAlerts.title,
      message: scheduledAlerts.message,
      triggerAt: scheduledAlerts.triggerAt,
      productId: scheduledAlerts.productId,
      productName: products.name,
      thresholdQuantity: scheduledAlerts.thresholdQuantity,
      currentQuantity: inventory.quantity,
      createdAt: scheduledAlerts.createdAt,
    })
    .from(scheduledAlerts)
    .innerJoin(products, eq(scheduledAlerts.productId, products.id))
    .innerJoin(inventory, eq(inventory.productId, products.id))
    .where(
      and(
        eq(scheduledAlerts.isAcknowledged, false),
        eq(scheduledAlerts.type, "inventory")
      )
    );

  const firingInventory = inventoryRows.filter(
    (r) => r.thresholdQuantity != null && r.currentQuantity <= r.thresholdQuantity
  );

  return NextResponse.json({
    alerts: [...dateRows, ...firingInventory],
    count: dateRows.length + firingInventory.length,
  });
}
