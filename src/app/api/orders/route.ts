import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) conditions.push(eq(orders.userId, userId));
  if (status) conditions.push(eq(orders.status, status as any));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [orderRows, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        discountAmount: orders.discountAmount,
        total: orders.total,
        shippingMethod: orders.shippingMethod,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
  ]);

  return NextResponse.json({
    orders: orderRows,
    total: Number(countResult[0]?.count || 0),
    page,
    totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
  });
}
