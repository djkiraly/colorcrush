import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSends, newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET — look up the subscriber for a given token, so the public unsubscribe
 * page can show "Unsubscribe <email>?" without forcing a click.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const [send] = await db
    .select({
      email: newsletterSends.email,
      unsubscribedAt: newsletterSends.unsubscribedAt,
      subscriberId: newsletterSends.subscriberId,
    })
    .from(newsletterSends)
    .where(eq(newsletterSends.unsubscribeToken, token))
    .limit(1);

  if (!send) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  // Cross-check that the subscriber is still active. They may have been
  // unsubscribed via a different campaign's link already.
  const [sub] = await db
    .select({ isActive: newsletterSubscribers.isActive })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, send.subscriberId))
    .limit(1);

  return NextResponse.json({
    email: send.email,
    alreadyUnsubscribed: !sub?.isActive || !!send.unsubscribedAt,
  });
}

/**
 * POST — perform the unsubscribe. Idempotent: re-posting with the same token
 * after success returns the same shape.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const [send] = await db
    .select()
    .from(newsletterSends)
    .where(eq(newsletterSends.unsubscribeToken, token))
    .limit(1);

  if (!send) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  const now = new Date();
  // Mark this specific send as the unsubscribe source (for campaign-level
  // attribution: which campaign drove the opt-out).
  if (!send.unsubscribedAt) {
    await db
      .update(newsletterSends)
      .set({ unsubscribedAt: now })
      .where(eq(newsletterSends.id, send.id));
  }

  // Also flip the subscriber inactive so they don't get any future campaigns.
  await db
    .update(newsletterSubscribers)
    .set({ isActive: false, unsubscribedAt: now })
    .where(eq(newsletterSubscribers.id, send.subscriberId));

  return NextResponse.json({ unsubscribed: true, email: send.email });
}
