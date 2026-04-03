import { NextResponse } from "next/server";
import { getAuthSession, isSuperAdmin } from "@/lib/auth-helpers";
import { testStripeConnection } from "@/lib/stripe";

export async function POST() {
  const session = await getAuthSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await testStripeConnection();
  return NextResponse.json(result);
}
