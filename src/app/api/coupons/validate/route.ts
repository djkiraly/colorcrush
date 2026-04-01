import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { code, subtotal } = await request.json();

  if (!code) {
    return NextResponse.json({ valid: false, message: "No coupon code provided" });
  }

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);

  if (!coupon) {
    return NextResponse.json({ valid: false, message: "Invalid coupon code" });
  }

  if (!coupon.isActive) {
    return NextResponse.json({ valid: false, message: "This coupon is no longer active" });
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, message: "This coupon has expired" });
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, message: "This coupon has reached its usage limit" });
  }

  if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order amount of $${coupon.minOrderAmount} required`,
    });
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = subtotal * (parseFloat(coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    discount = parseFloat(coupon.value);
  } else if (coupon.type === "free_shipping") {
    discount = 0; // handled at checkout
  }

  return NextResponse.json({
    valid: true,
    discount,
    type: coupon.type,
    message: coupon.type === "free_shipping" ? "Free shipping applied!" : `$${discount.toFixed(2)} off!`,
  });
}
