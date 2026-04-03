import { NextResponse } from "next/server";
import { getAuthSession, isSuperAdmin } from "@/lib/auth-helpers";
import { testOpenAIConnection } from "@/lib/openai";

export async function POST() {
  const session = await getAuthSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await testOpenAIConnection();
  return NextResponse.json(result);
}
