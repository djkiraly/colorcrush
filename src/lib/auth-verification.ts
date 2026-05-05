import crypto from "crypto";
import { db } from "@/lib/db";
import { users, emailVerificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail";
import { verifyEmailTemplate } from "@/lib/email-templates/verify-email";
import { getSettings } from "@/lib/settings";
import { getPublicBaseUrl } from "@/lib/app-url";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 per minute per user

export interface IssueVerificationOptions {
  /** When true, skip the per-user 60s rate limit. Used for system-triggered
   * sends (signup, post-payment) so they always succeed regardless of any
   * recent customer-initiated request. */
  bypassRateLimit?: boolean;
}

export interface IssueVerificationResult {
  status: "sent" | "already-verified" | "user-not-found" | "rate-limited";
  retryAfterSeconds?: number;
}

/**
 * Issue a verification token for `email` and email the user a magic link.
 *
 * Idempotent and rate-limited: if a token was issued in the last 60s the
 * call returns `rate-limited` (unless `bypassRateLimit` is set). If the
 * user's email is already verified, returns `already-verified` without
 * sending. Returns `user-not-found` if no user matches the email — callers
 * should still report success to clients to avoid email enumeration.
 *
 * Throws only on programmer errors. Email send failures are swallowed so
 * the caller can decide what to do; the token row is still inserted.
 */
export async function issueVerificationEmail(
  email: string,
  options: IssueVerificationOptions = {}
): Promise<IssueVerificationResult> {
  const [user] = await db
    .select({ id: users.id, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return { status: "user-not-found" };
  if (user.emailVerified) return { status: "already-verified" };

  if (!options.bypassRateLimit) {
    const recent = await db
      .select({ createdAt: emailVerificationTokens.createdAt })
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id))
      .orderBy(emailVerificationTokens.createdAt)
      .limit(1);

    const mostRecent = recent[recent.length - 1];
    if (mostRecent) {
      const elapsed = Date.now() - mostRecent.createdAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        return {
          status: "rate-limited",
          retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
        };
      }
    }
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
  const baseUrl = await getPublicBaseUrl();
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const html = await verifyEmailTemplate(user.name, verifyUrl);

  // Await rather than fire-and-forget. Callers in fire-and-forget contexts
  // can wrap the whole call in their own .catch() to swallow errors, but
  // we don't want the email queueing race condition that comes with
  // returning early from the request handler.
  await sendEmail({
    to: email,
    subject: `Verify your email — ${settings.name}`,
    html,
    templateName: "verify-email",
    userId: user.id,
  });

  return { status: "sent" };
}
