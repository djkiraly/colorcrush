import { db } from "@/lib/db";
import { orderAuditLog } from "@/lib/db/schema";

interface AuditEntry {
  orderId: string;
  adminId?: string;
  action: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

export async function logOrderAction(entry: AuditEntry) {
  await db.insert(orderAuditLog).values({
    orderId: entry.orderId,
    adminId: entry.adminId || null,
    action: entry.action,
    details: entry.details || null,
    previousValue: entry.previousValue || null,
    newValue: entry.newValue || null,
  });
}
