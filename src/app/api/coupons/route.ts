import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json({ coupons: allCoupons });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [coupon] = await db.insert(coupons).values({
    ...body,
    value: String(body.value),
    minOrderAmount: body.minOrderAmount ? String(body.minOrderAmount) : null,
  }).returning();
  return NextResponse.json(coupon);
}
