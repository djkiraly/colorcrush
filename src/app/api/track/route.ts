import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

/**
 * Parse a user-agent string into browser, OS, and device type.
 * Lightweight — no dependency needed for the top-level signals we track.
 */
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, sessionId, productId } = body;

    if (!path) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") || "";
    const { browser, os, deviceType } = parseUserAgent(ua);

    // Geo headers — set by Vercel, Cloudflare, or similar edge platforms
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const city =
      request.headers.get("x-vercel-ip-city") ||
      request.headers.get("cf-ipcity") ||
      null;

    // Get user ID from session if logged in (non-blocking)
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      // Auth failure should not block tracking
    }

    await db.insert(pageViews).values({
      path,
      referrer: referrer || null,
      browser,
      os,
      deviceType,
      country: country ? decodeURIComponent(country) : null,
      city: city ? decodeURIComponent(city) : null,
      productId: productId || null,
      userId,
      sessionId: sessionId || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ ok: true }); // Never fail visibly
  }
}
