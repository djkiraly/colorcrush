import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { finalizeOrderAfterPayment } from "@/lib/admin-orders/finalize";

const bodySchema = z.object({
  method: z.enum(["cash", "check", "other"]),
  notes: z.string().optional(),
});

const PAYABLE_STATUSES = new Set(["draft", "pending_payment"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const adminId = (session!.user as { id: string }).id;

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!PAYABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: `Cannot mark paid in status "${order.status}"` },
      { status: 400 }
    );
  }

  const method = (`offline_${parsed.method}` as const);

  await finalizeOrderAfterPayment(id, {
    method,
    notes: parsed.notes,
    adminId,
  });

  return NextResponse.json({ ok: true });
}
