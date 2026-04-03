import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const [balance, recentCharges, recentRefunds] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges.list({ limit: 100, created: { gte: Math.floor(Date.now() / 1000) - 30 * 86400 } }),
      stripe.refunds.list({ limit: 100, created: { gte: Math.floor(Date.now() / 1000) - 30 * 86400 } }),
    ]);

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    const successfulCharges = recentCharges.data.filter((c) => c.status === "succeeded");
    const totalRevenue30d = successfulCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalRefunds30d = recentRefunds.data.reduce((sum, r) => sum + r.amount, 0);
    const transactionCount30d = successfulCharges.length;

    return NextResponse.json({
      available,
      pending,
      totalRevenue30d,
      totalRefunds30d,
      transactionCount30d,
      currency: balance.available[0]?.currency || "usd",
    });
  } catch (err: any) {
    console.error("Balance API error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch balance", available: 0, pending: 0, totalRevenue30d: 0, totalRefunds30d: 0, transactionCount30d: 0, currency: "usd" },
      { status: 500 }
    );
  }
}
