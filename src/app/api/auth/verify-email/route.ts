import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailVerificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/gmail";
import { verifyEmailTemplate } from "@/lib/email-templates/verify-email";
import { getSettings } from "@/lib/settings";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 per minute per user

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Don't reveal whether user exists
    return NextResponse.json({ success: true });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  // Rate limit: refuse if a token was issued in the last RESEND_COOLDOWN_MS
  const recent = await db
    .select({ createdAt: emailVerificationTokens.createdAt })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, user.id))
    .orderBy(emailVerificationTokens.createdAt)
    .limit(1);

  const mostRecent = recent[recent.length - 1];
  if (mostRecent && Date.now() - mostRecent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const secondsLeft = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - mostRecent.createdAt.getTime())) / 1000
    );
    return NextResponse.json(
      { error: `Please wait ${secondsLeft}s before requesting another email.` },
      { status: 429 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(emailVerificationTokens).values({
    token,
    userId: user.id,
    email,
    expiresAt,
  });

  const settings = await getSettings();
  const baseUrl =
    settings.url ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const html = await verifyEmailTemplate(user.name, verifyUrl);
  sendEmail({
    to: email,
    subject: `Verify your email — ${settings.name}`,
    html,
    templateName: "verify-email",
    userId: user.id,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", request.url));
  }

  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.redirect(new URL("/login?error=expired-token", request.url));
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, row.userId));

  // Burn this and any other outstanding tokens for the user
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, row.userId));

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
