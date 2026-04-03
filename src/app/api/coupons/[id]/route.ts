import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.code !== undefined) updates.code = body.code;
  if (body.type !== undefined) updates.type = body.type;
  if (body.value !== undefined) updates.value = String(body.value);
  if (body.minOrderAmount !== undefined)
    updates.minOrderAmount = body.minOrderAmount ? String(body.minOrderAmount) : null;
  if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
  if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  const [coupon] = await db
    .update(coupons)
    .set(updates)
    .where(eq(coupons.id, id))
    .returning();

  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json(coupon);
}
