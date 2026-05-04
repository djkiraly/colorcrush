import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logOrderAction } from "@/lib/order-audit";

const CANCELLABLE_STATUSES = new Set(["draft", "pending_payment"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const adminId = (session?.user as { id?: string })?.id;

  const body = await request.json().catch(() => ({}));
  const reason: string | undefined = body?.reason;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: `Cannot cancel order in status "${order.status}"` },
      { status: 400 }
    );
  }

  await db
    .update(orders)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || "Cancelled by admin",
      paymentLinkToken: null,
      paymentLinkExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  await logOrderAction({
    orderId: id,
    adminId,
    action: "draft_cancelled",
    details: reason || "Draft cancelled",
    previousValue: order.status,
    newValue: "cancelled",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
