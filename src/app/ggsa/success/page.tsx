export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { ggsaOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  GGSA_PICKUP_NOTICE,
  formatPickupDate,
  getNextPickupDate,
} from "@/lib/ggsa-pickup";
import { GGSA_FLAVOR_LABELS, type GgsaFlavor } from "@/lib/validators/ggsa";

export const metadata: Metadata = {
  title: "Order Confirmed — GGSA Team Sweet Bags",
  robots: { index: false, follow: false },
};

export default async function GgsaSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  const order = sessionId
    ? (
        await db
          .select()
          .from(ggsaOrders)
          .where(eq(ggsaOrders.stripeSessionId, sessionId))
          .limit(1)
      )[0]
    : undefined;

  const pickupDate = order?.pickupDate
    ? formatPickupDate(new Date(order.pickupDate))
    : formatPickupDate(getNextPickupDate());

  return (
    <div className="min-h-screen bg-[#FBF7FD]">
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-[#7B2D8E]/10 bg-white p-8 text-center shadow-lg">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-[#14B8A6]" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-[#7B2D8E]">
            Order Confirmed!
          </h1>
          <p className="mt-3 text-gray-600">
            Thank you for supporting the Gering Girls Softball Association. A
            receipt has been emailed to you.
          </p>

          {order && (
            <div className="mt-6 rounded-xl bg-[#7B2D8E]/5 p-5 text-left text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Flavor</span>
                <span className="font-semibold text-[#1E1B2E]">
                  {GGSA_FLAVOR_LABELS[order.flavor as GgsaFlavor] ?? order.flavor}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Quantity</span>
                <span className="font-semibold text-[#1E1B2E]">
                  {order.quantity} {order.quantity === 1 ? "bag" : "bags"}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#7B2D8E]/10 pt-2">
                <span className="text-gray-500">Total paid</span>
                <span className="font-heading text-lg font-bold text-[#7B2D8E]">
                  ${(order.totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Pickup notice — repeated on confirmation per spec */}
          <div className="mt-6 rounded-xl border-2 border-[#14B8A6]/30 bg-[#14B8A6]/5 p-5 text-left">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0F766E]" />
              <div>
                <p className="font-heading font-bold text-[#0F766E]">
                  Pick up on: {pickupDate}
                </p>
                <p className="mt-1 text-sm text-[#334155]">{GGSA_PICKUP_NOTICE}</p>
              </div>
            </div>
          </div>

          <Link
            href="/ggsa"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#7B2D8E] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#6A2479]"
          >
            Order more bags
          </Link>
        </div>
      </div>
    </div>
  );
}
