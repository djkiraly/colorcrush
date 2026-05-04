import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PaySuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentLinkToken, token))
    .limit(1);

  const isPaid = order?.status === "confirmed" || order?.status === "paid_offline";

  return (
    <div className="container mx-auto max-w-xl px-4 py-24 text-center">
      {isPaid ? (
        <>
          <h1 className="font-heading text-3xl font-bold mb-4">Payment successful</h1>
          <p className="text-muted-foreground mb-2">
            Thank you! Order <span className="font-mono">{order.orderNumber}</span> has been
            confirmed.
          </p>
          <p className="text-muted-foreground mb-8">A confirmation email is on its way.</p>
        </>
      ) : (
        <>
          <h1 className="font-heading text-3xl font-bold mb-4">Processing your payment…</h1>
          <p className="text-muted-foreground mb-8">
            We're confirming your payment with Stripe. This page will refresh automatically.
          </p>
          <meta httpEquiv="refresh" content="3" />
        </>
      )}
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-sm font-medium"
      >
        Return to store
      </Link>
    </div>
  );
}
