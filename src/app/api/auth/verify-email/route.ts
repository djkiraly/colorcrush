import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailVerificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { issueVerificationEmail } from "@/lib/auth-verification";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const result = await issueVerificationEmail(email);

  if (result.status === "rate-limited") {
    return NextResponse.json(
      {
        error: `Please wait ${result.retryAfterSeconds}s before requesting another email.`,
      },
      { status: 429 }
    );
  }

  // For already-verified or user-not-found, return success without revealing
  // which to avoid email enumeration.
  return NextResponse.json({
    success: true,
    alreadyVerified: result.status === "already-verified" || undefined,
  });
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
