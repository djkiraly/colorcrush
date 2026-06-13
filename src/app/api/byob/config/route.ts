import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Public, secret-free slice of settings: just the Build Your Box config
// (box sizes + taste/color/flavor taxonomy). Used by the storefront page and
// the admin product form's BYOB attribute dropdowns.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ byob: settings.byob });
}
