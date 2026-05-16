import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function parseUserAgent(ua: string) {
  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  let deviceType = "desktop";
  if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) deviceType = "mobile";
  else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) deviceType = "tablet";

  return { browser, os, deviceType };
}

const trim = (v: unknown, max = 255) =>
  typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      path,
      referrer,
      sessionId,
      productId: explicitProductId,
      productSlug,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      gclid,
      fbclid,
    } = body;

    if (!path) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") || "";
    const { browser, os, deviceType } = parseUserAgent(ua);

    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const city =
      request.headers.get("x-vercel-ip-city") ||
      request.headers.get("cf-ipcity") ||
      null;

    // Resolve productId from slug if the client sent one. The client never
    // sends an explicit productId for normal pageviews; this server-side
    // lookup is what makes "Most Viewed Products" actually populate.
    let productId: string | null =
      typeof explicitProductId === "string" ? explicitProductId : null;
    if (!productId && typeof productSlug === "string" && productSlug.length > 0) {
      const [row] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, productSlug))
        .limit(1);
      productId = row?.id ?? null;
    }

    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      // Auth failure should not block tracking
    }

    await db.insert(pageViews).values({
      path: String(path).slice(0, 500),
      referrer: trim(referrer, 1000),
      browser,
      os,
      deviceType,
      country: country ? decodeURIComponent(country) : null,
      city: city ? decodeURIComponent(city) : null,
      productId,
      userId,
      sessionId: trim(sessionId, 100),
      utmSource: trim(utmSource),
      utmMedium: trim(utmMedium),
      utmCampaign: trim(utmCampaign),
      utmContent: trim(utmContent),
      utmTerm: trim(utmTerm),
      gclid: trim(gclid),
      fbclid: trim(fbclid),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ ok: true }); // Never fail visibly
  }
}
