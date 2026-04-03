import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logOrderAction } from "@/lib/order-audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
  const body = await request.json();
  const { amount, reason } = body;

  // Retrieve the payment intent to get the charge
  const pi = await stripe.paymentIntents.retrieve(id);
  if (!pi.latest_charge) {
    return NextResponse.json(
      { error: "No charge found for this payment" },
      { status: 400 }
    );
  }

  const chargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge.id;

  const refundParams: Record<string, unknown> = { charge: chargeId };
  if (amount) refundParams.amount = Math.round(amount * 100);
  if (reason) refundParams.reason = reason;

  const refund = await stripe.refunds.create(refundParams as any);

  // Update order status if there's a linked order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, id))
    .limit(1);

  if (order) {
    const isFullRefund = !amount || amount * 100 >= pi.amount;
    if (isFullRefund) {
      await db
        .update(orders)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }

    logOrderAction({
      orderId: order.id,
      action: isFullRefund ? "order_refunded" : "order_partial_refund",
      details: `Refund of $${(refund.amount / 100).toFixed(2)} issued${reason ? `: ${reason}` : ""}`,
      previousValue: order.status,
      newValue: isFullRefund ? "refunded" : order.status,
    }).catch(() => {});
  }

  return NextResponse.json({
    refund: {
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
      reason: refund.reason,
      created: refund.created,
    },
  });
  } catch (err: any) {
    console.error("Refund error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
