import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const emails = await db
    .select()
    .from(emailLog)
    .orderBy(desc(emailLog.createdAt))
    .limit(100);

  return NextResponse.json({ emails });
}
