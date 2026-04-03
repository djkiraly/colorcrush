import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/gmail";
import { verifyEmailTemplate } from "@/lib/email-templates/verify-email";
import { siteConfig } from "../../../../../site.config";

// Simple token store — in production consider a DB table or Redis
const tokens = new Map<string, { userId: string; email: string; expires: number }>();

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

  const token = crypto.randomBytes(32).toString("hex");
  tokens.set(token, {
    userId: user.id,
    email,
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const html = verifyEmailTemplate(user.name, verifyUrl);
  sendEmail({
    to: email,
    subject: `Verify your email — ${siteConfig.name}`,
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

  const data = tokens.get(token);
  if (!data || data.expires < Date.now()) {
    tokens.delete(token!);
    return NextResponse.redirect(new URL("/login?error=expired-token", request.url));
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, data.userId));

  tokens.delete(token);

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
