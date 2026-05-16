import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterCampaigns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db
    .select()
    .from(newsletterCampaigns)
    .orderBy(desc(newsletterCampaigns.createdAt))
    .limit(100);
  return NextResponse.json({ campaigns: rows });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const subject = (body?.subject as string | undefined)?.trim();
  const preheader = (body?.preheader as string | undefined)?.trim() || null;
  const htmlBody = (body?.htmlBody as string | undefined) ?? "";
  if (!name || !subject || !htmlBody.trim()) {
    return NextResponse.json(
      { error: "name, subject, and htmlBody are required" },
      { status: 400 }
    );
  }

  const userId = (session?.user as { id?: string })?.id ?? null;
  const [created] = await db
    .insert(newsletterCampaigns)
    .values({
      name,
      subject,
      preheader,
      htmlBody,
      createdBy: userId,
    })
    .returning();
  return NextResponse.json({ campaign: created });
}
