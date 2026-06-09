import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ggsaOrders } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = await db
    .select()
    .from(ggsaOrders)
    .orderBy(desc(ggsaOrders.createdAt))
    .limit(500);

  return NextResponse.json({ orders: list });
}
