import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  newsletterCampaigns,
  newsletterSends,
  newsletterSubscribers,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/gmail";
import { getSettings } from "@/lib/settings";
import { newsletterEmail } from "@/lib/email-templates/newsletter";
import { getPublicBaseUrl } from "@/lib/app-url";
import { randomBytes } from "crypto";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * POST: send the campaign.
 *
 * Body options:
 *   { testEmail?: string }  → sends a single test message to the supplied
 *     address using a transient send row (so the unsubscribe token still works
 *     against you in QA). Does NOT mark the campaign as sent.
 *
 *   {}                       → real send to every active subscriber.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const testEmail =
    typeof body?.testEmail === "string" && body.testEmail.trim()
      ? body.testEmail.trim().toLowerCase()
      : null;

  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, id))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (!testEmail && campaign.status !== "draft") {
    return NextResponse.json(
      { error: `Campaign has already been ${campaign.status}` },
      { status: 400 }
    );
  }

  const settings = await getSettings();
  const baseUrl = await getPublicBaseUrl();

  // ─── Test send ───────────────────────────────────────────────────────────
  if (testEmail) {
    const token = newToken();
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${token}`;
    const html = newsletterEmail({
      settings,
      htmlBody: campaign.htmlBody,
      preheader: campaign.preheader ?? undefined,
      unsubscribeUrl,
    });
    const subject = `[TEST] ${campaign.subject}`;
    const ok = await sendEmail({
      to: testEmail,
      subject,
      html,
      templateName: "newsletter-test",
    });
    return NextResponse.json({ test: true, sent: ok });
  }

  // ─── Real send ───────────────────────────────────────────────────────────
  // Mark as sending up front so a long send can't be triggered twice.
  await db
    .update(newsletterCampaigns)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(newsletterCampaigns.id, id));

  let recipients: { id: string; email: string }[] = [];
  try {
    recipients = await db
      .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true));
  } catch (err) {
    await db
      .update(newsletterCampaigns)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(newsletterCampaigns.id, id));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load subscribers" },
      { status: 500 }
    );
  }

  let sentCount = 0;
  let failedCount = 0;

  // Sequential — Gmail API quotas + simpler error handling. For larger lists,
  // promote this to a background job (queue + worker).
  for (const r of recipients) {
    const token = newToken();
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${token}`;
    const html = newsletterEmail({
      settings,
      htmlBody: campaign.htmlBody,
      preheader: campaign.preheader ?? undefined,
      unsubscribeUrl,
    });

    // Record the send row *before* dispatching so a partial failure leaves a
    // diagnosable trail.
    const [sendRow] = await db
      .insert(newsletterSends)
      .values({
        campaignId: id,
        subscriberId: r.id,
        email: r.email,
        unsubscribeToken: token,
        status: "queued",
      })
      .returning();

    const ok = await sendEmail({
      to: r.email,
      subject: campaign.subject,
      html,
      templateName: "newsletter",
    });

    if (ok) {
      sentCount++;
      await db
        .update(newsletterSends)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(newsletterSends.id, sendRow.id));
    } else {
      failedCount++;
      await db
        .update(newsletterSends)
        .set({ status: "failed" })
        .where(eq(newsletterSends.id, sendRow.id));
    }
  }

  await db
    .update(newsletterCampaigns)
    .set({
      status: failedCount === recipients.length && recipients.length > 0 ? "failed" : "sent",
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, id));

  return NextResponse.json({
    recipientCount: recipients.length,
    sentCount,
    failedCount,
  });
}
