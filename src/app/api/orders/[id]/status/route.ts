import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "@/lib/email-notifications";
import { logOrderAction } from "@/lib/order-audit";
import { getAuthSession } from "@/lib/auth-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const session = await getAuthSession();
  const adminId = session?.user?.id;

  // Get previous state for audit
  const [previous] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  const updateData: Record<string, unknown> = {
    status: body.status,
    updatedAt: new Date(),
  };

  if (body.trackingNumber) updateData.trackingNumber = body.trackingNumber;
  if (body.trackingCarrier) updateData.trackingCarrier = body.trackingCarrier;
  if (body.notes) updateData.notes = body.notes;

  if (body.status === "shipped") updateData.shippedAt = new Date();
  if (body.status === "delivered") updateData.deliveredAt = new Date();
  if (body.status === "cancelled") {
    updateData.cancelledAt = new Date();
    updateData.cancelReason = body.cancelReason || "Admin cancelled";
  }

  const [updated] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Audit log
  if (previous && previous.status !== body.status) {
    logOrderAction({
      orderId: id,
      adminId,
      action: "status_changed",
      details: `Status changed from ${previous.status} to ${body.status}`,
      previousValue: previous.status,
      newValue: body.status,
    }).catch(() => {});
  }
  if (body.trackingNumber && body.trackingNumber !== previous?.trackingNumber) {
    logOrderAction({
      orderId: id,
      adminId,
      action: "tracking_updated",
      details: `Tracking: ${body.trackingCarrier || ""} ${body.trackingNumber}`,
      previousValue: previous?.trackingNumber || undefined,
      newValue: body.trackingNumber,
    }).catch(() => {});
  }
  if (body.notes && body.notes !== previous?.notes) {
    logOrderAction({
      orderId: id,
      adminId,
      action: "notes_updated",
      details: body.notes,
    }).catch(() => {});
  }

  // Send status notification emails (fire-and-forget)
  if (body.status === "shipped" && body.trackingNumber) {
    sendOrderShippedEmail(id, body.trackingNumber, body.trackingCarrier || "").catch(() => {});
  }
  if (body.status === "delivered") {
    sendOrderDeliveredEmail(id).catch(() => {});
  }

  return NextResponse.json(updated);
}
