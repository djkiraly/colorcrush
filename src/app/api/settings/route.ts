import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings, getSettingOverrides, saveSetting } from "@/lib/settings";
import { invalidateGcsClient } from "@/lib/gcs";
import { invalidateGmailClient } from "@/lib/gmail";
import { siteConfig } from "../../../../site.config";

export async function GET() {
  const [settings, overrides] = await Promise.all([
    getSettings(),
    getSettingOverrides(),
  ]);

  return NextResponse.json({
    defaults: siteConfig,
    overrides,
    merged: settings,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can edit settings" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  // Validate key is an allowed setting
  const allowedKeys = [
    "name",
    "tagline",
    "description",
    "url",
    "taxRate",
    "freeShippingThreshold",
    "shippingRates",
    "contact",
    "social",
    "features",
    "gcs",
    "gmail",
    "logoUrl",
    "faviconUrl",
  ];

  if (!allowedKeys.includes(key)) {
    return NextResponse.json(
      { error: `Invalid setting key: ${key}` },
      { status: 400 }
    );
  }

  await saveSetting(key, value, session.user.id!);

  if (key === "gcs") invalidateGcsClient();
  if (key === "gmail") invalidateGmailClient();

  return NextResponse.json({ success: true });
}
