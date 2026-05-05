import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  orders,
  addresses,
  reviews,
  customerInteractions,
  emailLog,
  orderAuditLog,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user || user.role !== "customer") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [userOrders, userAddresses] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    db.select().from(addresses).where(eq(addresses.userId, id)),
  ]);

  return NextResponse.json({
    ...user,
    passwordHash: undefined,
    orders: userOrders,
    addresses: userAddresses,
  });
}

/**
 * Permanently delete a customer and all their orders.
 *
 * Gated by both admin role and the `features.customerDeletion` flag in
 * settings. Intended for development environments only — there is no audit
 * trail and no recovery.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  if (!settings.features.customerDeletion) {
    return NextResponse.json(
      { error: "Customer deletion is disabled. Enable it in Admin → Settings → Feature Flags." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Refuse to delete admins via this endpoint — they can have audit trails
  // and admin actions that aren't trivially cascadable.
  if (user.role !== "customer") {
    return NextResponse.json(
      { error: "Only customer accounts can be deleted via this endpoint." },
      { status: 400 }
    );
  }

  // Block self-deletion.
  if (session?.user?.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from here." },
      { status: 400 }
    );
  }

  const customerOrderIds = (
    await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, id))
  ).map((o) => o.id);

  // Order of operations matters: clear FKs that are NOT cascade/set-null,
  // then delete orders, then delete the user (which cascades addresses,
  // wishlists, email_verification_tokens).
  if (customerOrderIds.length > 0) {
    // email_log.orderId is NOT cascade — null it for orders being removed
    await db
      .update(emailLog)
      .set({ orderId: null })
      .where(inArray(emailLog.orderId, customerOrderIds));
    // customer_interactions.relatedOrderId restricts, but we'll delete the
    // interactions themselves below; first null the FK to be safe in case
    // any interaction is for a different user but references this user's order.
    await db
      .update(customerInteractions)
      .set({ relatedOrderId: null })
      .where(inArray(customerInteractions.relatedOrderId, customerOrderIds));
  }

  // reviews.userId is NOT cascade
  await db.delete(reviews).where(eq(reviews.userId, id));
  // customer_interactions where this user was the customer
  await db.delete(customerInteractions).where(eq(customerInteractions.userId, id));
  // ...or where this user was somehow recorded as the responding admin
  await db
    .update(customerInteractions)
    .set({ adminId: null })
    .where(eq(customerInteractions.adminId, id));
  // email_log.userId is NOT cascade — preserve the log row, null the FK
  await db.update(emailLog).set({ userId: null }).where(eq(emailLog.userId, id));
  // order_audit_log.adminId is NOT cascade — null where this user is recorded
  await db.update(orderAuditLog).set({ adminId: null }).where(eq(orderAuditLog.adminId, id));

  // Now safe to drop the orders (cascades order_items + order_audit_log rows)
  await db.delete(orders).where(eq(orders.userId, id));

  // Finally the user (cascades addresses, wishlists, email_verification_tokens;
  // sets null on inventory_log.adminId, orders.createdByAdminId,
  // scheduled_alerts.acknowledgedBy/createdBy, page_views.userId).
  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({
    success: true,
    deletedOrders: customerOrderIds.length,
  });
}
