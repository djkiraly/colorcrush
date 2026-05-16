import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Returns lightweight info about a completed Stripe Checkout Session, used
 * by the post-payment success page to decide whether to prompt the customer
 * to sign in (because they elected to create an account at checkout).
 *
 * No auth — the random Stripe session ID is the bearer; only fields the
 * customer would already know (their own email, whether they asked us to
 * create an account) are surfaced.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.userId;
    const accountCreated = session.metadata?.triggerVerifyEmail === "true";

    let email: string | null = null;
    let isGuest = false;
    if (userId) {
      const [u] = await db
        .select({ email: users.email, isGuest: users.isGuest })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      email = u?.email ?? null;
      isGuest = u?.isGuest ?? false;
    }

    // Surface the order total so the success page can fire client-side
    // purchase conversion events with the correct value.
    const amountTotal = (session.amount_total ?? 0) / 100;
    const currency = (session.currency || "usd").toUpperCase();

    return NextResponse.json({
      accountCreated,
      email,
      isGuest,
      orderTotal: amountTotal,
      currency,
      orderId: session.id,
    });
  } catch (err) {
    console.error("session-info error:", err);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
