import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  newsletterCampaigns,
  newsletterSends,
  newsletterSubscribers,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, id))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Per-recipient sends, ordered by sent time, for the campaign detail view
  const sends = await db
    .select()
    .from(newsletterSends)
    .where(eq(newsletterSends.campaignId, id));
  return NextResponse.json({ campaign, sends });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Don't allow editing a campaign that's already been (or is being) sent.
  const [existing] = await db
    .select({ status: newsletterCampaigns.status })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft campaigns can be edited" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(newsletterCampaigns)
    .set({
      name: body?.name?.trim() ?? undefined,
      subject: body?.subject?.trim() ?? undefined,
      preheader: body?.preheader?.trim() || null,
      htmlBody: typeof body?.htmlBody === "string" ? body.htmlBody : undefined,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, id))
    .returning();
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const [existing] = await db
    .select({ status: newsletterCampaigns.status })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft campaigns can be deleted" },
      { status: 400 }
    );
  }
  await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
  return NextResponse.json({ success: true });
}
