import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
  const source = typeof body?.source === "string" ? body.source.slice(0, 50) : "footer";

  if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  const email = rawEmail.toLowerCase();

  // Reactivate a previously-unsubscribed row instead of creating a duplicate.
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    if (existing.isActive) {
      return NextResponse.json({ alreadySubscribed: true });
    }
    await db
      .update(newsletterSubscribers)
      .set({ isActive: true, unsubscribedAt: null, source })
      .where(eq(newsletterSubscribers.id, existing.id));
    return NextResponse.json({ resubscribed: true });
  }

  await db.insert(newsletterSubscribers).values({ email, source });
  return NextResponse.json({ subscribed: true });
}
