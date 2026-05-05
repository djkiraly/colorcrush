import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailVerificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { issueVerificationEmail } from "@/lib/auth-verification";
import { getPublicBaseUrl } from "@/lib/app-url";

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
  // Build redirect URLs from the configured public base URL rather than
  // request.url — when this app sits behind a reverse proxy, request.url
  // reflects the upstream connection (e.g. http://localhost:3007/...)
  // and would point customers at an unreachable internal address.
  const baseUrl = (await getPublicBaseUrl()) || new URL(request.url).origin;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, baseUrl));

  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return redirectTo("/login?error=invalid-token");
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
    return redirectTo("/login?error=expired-token");
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, row.userId));

  // Burn this and any other outstanding tokens for the user
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, row.userId));

  return redirectTo("/login?verified=true");
}
