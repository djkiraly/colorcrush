import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [list, counts] = await Promise.all([
    db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.subscribedAt))
      .limit(500),
    db
      .select({
        active: sql<number>`count(*) filter (where ${newsletterSubscribers.isActive} = true)`,
        total: sql<number>`count(*)`,
      })
      .from(newsletterSubscribers),
  ]);

  return NextResponse.json({
    subscribers: list,
    counts: {
      active: Number(counts[0]?.active ?? 0),
      total: Number(counts[0]?.total ?? 0),
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  // Mark inactive rather than hard-delete so historical campaign send logs
  // remain joinable for analytics.
  await db
    .update(newsletterSubscribers)
    .set({ isActive: false, unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.id, id));
  return NextResponse.json({ success: true });
}
