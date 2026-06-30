import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users, addresses, customerInteractions, emailLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Customers can only read their own orders.
  if (!isAdmin(session) && order.userId !== sessionUserId) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "cancelled") {
    return NextResponse.json(
      { error: "Only cancelled orders can be deleted." },
      { status: 409 }
    );
  }

  try {
    await db
      .update(customerInteractions)
      .set({ relatedOrderId: null })
      .where(eq(customerInteractions.relatedOrderId, id));
    await db.update(emailLog).set({ orderId: null }).where(eq(emailLog.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete order error:", err);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
