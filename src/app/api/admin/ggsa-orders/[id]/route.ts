import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ggsaOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

// Admin can move a paid order to fulfilled (and back). "pending" rows are
// abandoned checkouts and aren't manually settable here.
const ALLOWED_STATUSES = ["paid", "fulfilled"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };

  if (!status || !ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(ggsaOrders)
    .set({
      status: status as AllowedStatus,
      fulfilledAt: status === "fulfilled" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(ggsaOrders.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
