import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testGmailConnection } from "@/lib/gmail";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await testGmailConnection();
  return NextResponse.json(result);
}
