import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledAlerts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const body = await request.json();

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.isAcknowledged === "boolean") {
    patch.isAcknowledged = body.isAcknowledged;
    patch.acknowledgedAt = body.isAcknowledged ? new Date() : null;
    patch.acknowledgedBy = body.isAcknowledged ? session?.user?.id ?? null : null;
    // Un-acknowledging clears notifiedAt so the next cron run will re-notify
    if (!body.isAcknowledged) patch.notifiedAt = null;
  }
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.message === "string") patch.message = body.message;
  if (typeof body.severity === "string") patch.severity = body.severity;
  if (body.triggerAt !== undefined) patch.triggerAt = body.triggerAt ? new Date(body.triggerAt) : null;
  if (body.thresholdQuantity !== undefined) patch.thresholdQuantity = body.thresholdQuantity;

  const [updated] = await db
    .update(scheduledAlerts)
    .set(patch)
    .where(eq(scheduledAlerts.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(scheduledAlerts).where(eq(scheduledAlerts.id, id));
  return NextResponse.json({ success: true });
}
