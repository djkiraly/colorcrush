import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders, addresses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [userOrders, userAddresses] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    db.select().from(addresses).where(eq(addresses.userId, id)),
  ]);

  return NextResponse.json({
    ...user,
    passwordHash: undefined,
    orders: userOrders,
    addresses: userAddresses,
  });
}
