import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pi = await stripe.paymentIntents.retrieve(id, {
      expand: ["latest_charge", "latest_charge.balance_transaction"],
    });

    const charge = typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    const balanceTx =
      charge && typeof charge.balance_transaction === "object"
        ? charge.balance_transaction
        : null;

    // Fetch refunds for this payment intent
    const refunds = await stripe.refunds.list({ payment_intent: id, limit: 100 });

    return NextResponse.json({
      payment: {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        description: pi.description,
        receiptEmail: pi.receipt_email,
        paymentMethod: pi.payment_method_types?.[0] || "card",
        metadata: pi.metadata,
        chargeId: charge?.id || null,
        receiptUrl: charge?.receipt_url || null,
        amountRefunded: charge?.amount_refunded ?? 0,
        fee: balanceTx?.fee ?? 0,
        net: balanceTx?.net ?? 0,
        refunds: refunds.data.map((r) => ({
          id: r.id,
          amount: r.amount,
          status: r.status,
          reason: r.reason,
          created: r.created,
        })),
      },
    });
  } catch (err: any) {
    console.error("Payment detail error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
