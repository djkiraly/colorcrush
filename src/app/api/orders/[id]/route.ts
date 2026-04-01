import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, users, addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [items, user, shippingAddr] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1),
    order.shippingAddressId
      ? db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)).limit(1)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...order,
    items,
    user: user[0] || null,
    shippingAddress: shippingAddr[0] || null,
  });
}
