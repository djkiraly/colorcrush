import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerInteractions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const interactions = await db
    .select({
      id: customerInteractions.id,
      type: customerInteractions.type,
      subject: customerInteractions.subject,
      body: customerInteractions.body,
      status: customerInteractions.status,
      priority: customerInteractions.priority,
      createdAt: customerInteractions.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(customerInteractions)
    .innerJoin(users, eq(customerInteractions.userId, users.id))
    .orderBy(desc(customerInteractions.createdAt));

  return NextResponse.json({ interactions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const [interaction] = await db
    .insert(customerInteractions)
    .values(body)
    .returning();

  return NextResponse.json(interaction);
}
