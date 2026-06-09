import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, ggsaOrders } from "@/lib/db/schema";
import { inArray, eq, sql } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

// "Open" standard orders = paid and awaiting fulfillment (not yet shipped,
// delivered, cancelled, or refunded; excludes drafts and unpaid orders).
const OPEN_ORDER_STATUSES: (typeof orders.$inferSelect)["status"][] = [
  "confirmed",
  "paid_offline",
  "processing",
];

export async function GET() {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [[ordersRow], [ggsaRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(inArray(orders.status, OPEN_ORDER_STATUSES)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ggsaOrders)
      .where(eq(ggsaOrders.status, "paid")),
  ]);

  return NextResponse.json({
    orders: ordersRow?.count ?? 0,
    ggsa: ggsaRow?.count ?? 0,
  });
}
