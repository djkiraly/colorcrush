import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { eq, sql, desc, and, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const q = (searchParams.get("q") || "").trim();
  const offset = (page - 1) * limit;

  const where = q
    ? and(
        eq(users.role, "customer"),
        or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`))
      )
    : eq(users.role, "customer");

  const customers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      totalOrders: sql<number>`(SELECT count(*) FROM orders WHERE orders.user_id = ${users.id})`,
      totalSpent: sql<number>`(SELECT COALESCE(sum(total::numeric), 0) FROM orders WHERE orders.user_id = ${users.id} AND orders.status != 'cancelled')`,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [count] = await db.select({ count: sql<number>`count(*)` }).from(users).where(where);

  return NextResponse.json({
    customers,
    total: Number(count.count),
    page,
    totalPages: Math.ceil(Number(count.count) / limit),
  });
}
