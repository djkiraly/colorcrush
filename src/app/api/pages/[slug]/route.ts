import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const PAGE_KEYS: Record<string, string> = {
  "terms-and-conditions": "termsAndConditions",
  "privacy-policy": "privacyPolicy",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const key = PAGE_KEYS[slug];

  if (!key) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  return NextResponse.json({
    content: (row?.value as string) || "",
  });
}
