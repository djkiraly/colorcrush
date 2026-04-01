import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
  return NextResponse.json(updated);
}
