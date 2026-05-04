import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe, getPublishableKey } from "@/lib/stripe";

const PAYABLE_STATUSES = new Set(["draft", "pending_payment"]);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!PAYABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: `Cannot charge order in status "${order.status}"` },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Ensure Stripe Customer exists for this user
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const amount = Math.round(parseFloat(order.total) * 100);

  // Reuse existing PaymentIntent if amount + customer match.
  let intent;
  if (order.stripePaymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (
        existing.amount === amount &&
        existing.customer === customerId &&
        existing.status !== "canceled" &&
        existing.metadata?.mode === "admin_charge"
      ) {
        intent = existing;
      }
    } catch {}
  }

  if (!intent) {
    intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, mode: "admin_charge" },
      description: `Order ${order.orderNumber} (admin charge)`,
    });
    await db
      .update(orders)
      .set({
        stripePaymentIntentId: intent.id,
        status: order.status === "draft" ? "pending_payment" : order.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  }

  const publishableKey = await getPublishableKey();
  return NextResponse.json({
    clientSecret: intent.client_secret,
    publishableKey,
  });
}
