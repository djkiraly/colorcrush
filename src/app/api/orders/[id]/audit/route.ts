import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderAuditLog, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entries = await db
    .select({
      id: orderAuditLog.id,
      action: orderAuditLog.action,
      details: orderAuditLog.details,
      previousValue: orderAuditLog.previousValue,
      newValue: orderAuditLog.newValue,
      createdAt: orderAuditLog.createdAt,
      adminName: users.name,
      adminEmail: users.email,
    })
    .from(orderAuditLog)
    .leftJoin(users, eq(orderAuditLog.adminId, users.id))
    .where(eq(orderAuditLog.orderId, id))
    .orderBy(desc(orderAuditLog.createdAt));

  return NextResponse.json(entries);
}
