import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledAlerts, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
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
      isAcknowledged: scheduledAlerts.isAcknowledged,
      acknowledgedAt: scheduledAlerts.acknowledgedAt,
      createdAt: scheduledAlerts.createdAt,
    })
    .from(scheduledAlerts)
    .leftJoin(products, eq(scheduledAlerts.productId, products.id))
    .orderBy(desc(scheduledAlerts.createdAt));

  return NextResponse.json({ alerts: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const body = await request.json();

  if (!body.type || !body.title) {
    return NextResponse.json({ error: "type and title are required" }, { status: 400 });
  }
  if (body.type === "date" && !body.triggerAt) {
    return NextResponse.json({ error: "triggerAt is required for date alerts" }, { status: 400 });
  }
  if (body.type === "inventory" && (!body.productId || body.thresholdQuantity == null)) {
    return NextResponse.json(
      { error: "productId and thresholdQuantity are required for inventory alerts" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(scheduledAlerts)
    .values({
      type: body.type,
      severity: body.severity ?? "info",
      title: body.title,
      message: body.message ?? null,
      triggerAt: body.triggerAt ? new Date(body.triggerAt) : null,
      productId: body.productId ?? null,
      thresholdQuantity: body.thresholdQuantity ?? null,
      createdBy: userId,
    })
    .returning();

  return NextResponse.json(created);
}
