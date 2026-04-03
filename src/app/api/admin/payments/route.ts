import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const startingAfter = searchParams.get("starting_after") || undefined;
    const status = searchParams.get("status") || undefined;

    const params: Record<string, unknown> = { limit };
    if (startingAfter) params.starting_after = startingAfter;

    const paymentIntents = await stripe.paymentIntents.list(params as any);

    // Filter by status client-side if requested (Stripe doesn't support status filter on list)
    const filtered = status
      ? paymentIntents.data.filter((pi) => pi.status === status)
      : paymentIntents.data;

    return NextResponse.json({
      payments: filtered.map((pi) => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        description: pi.description,
        receiptEmail: pi.receipt_email,
        paymentMethod: pi.payment_method_types?.[0] || "card",
        metadata: pi.metadata,
        amountRefunded: (pi as any).amount_refunded ?? 0,
        latestCharge: pi.latest_charge,
      })),
      hasMore: paymentIntents.has_more,
      lastId: paymentIntents.data[paymentIntents.data.length - 1]?.id,
    });
  } catch (err: any) {
    console.error("Payments API error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch payments", payments: [], hasMore: false },
      { status: 500 }
    );
  }
}
