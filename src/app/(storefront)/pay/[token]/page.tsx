import { db } from "@/lib/db";
import { orders, orderItems, users, addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import PayClient from "./pay-client";

export const dynamic = "force-dynamic";

export default async function PayPage({
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

  if (!order) {
    return (
      <InvalidLinkPage
        title="Payment link not found"
        message="This payment link is no longer valid. Please contact support if you believe this is in error."
      />
    );
  }

  if (order.status === "confirmed" || order.status === "paid_offline") {
    redirect(`/pay/${token}/success`);
  }

  if (order.status !== "pending_payment") {
    return (
      <InvalidLinkPage
        title="Order not available"
        message={`This order is in status "${order.status}" and cannot be paid through this link.`}
      />
    );
  }

  if (order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) {
    return (
      <InvalidLinkPage
        title="Payment link expired"
        message="This payment link has expired. Please contact us so we can send a new one."
      />
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  let shippingAddress = null;
  if (order.shippingAddressId) {
    const [a] = await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)).limit(1);
    shippingAddress = a || null;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-2">Review & Pay</h1>
      <p className="text-muted-foreground mb-8">
        Order <span className="font-mono">{order.orderNumber}</span>
      </p>

      <div className="rounded-2xl border bg-card p-6 mb-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="text-left py-2">Item</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="py-3">
                  {it.productName}
                  {it.isCustom && (
                    <span className="ml-2 text-xs text-muted-foreground">(custom)</span>
                  )}
                </td>
                <td className="text-center">{it.quantity}</td>
                <td className="text-right">${parseFloat(it.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-1 text-sm">
          <Row label="Subtotal" value={`$${parseFloat(order.subtotal).toFixed(2)}`} />
          {parseFloat(order.discountAmount) > 0 && (
            <Row label="Coupon discount" value={`-$${parseFloat(order.discountAmount).toFixed(2)}`} />
          )}
          {parseFloat(order.manualDiscountAmount) > 0 && (
            <Row label="Discount" value={`-$${parseFloat(order.manualDiscountAmount).toFixed(2)}`} />
          )}
          <Row label="Shipping" value={`$${parseFloat(order.shippingCost).toFixed(2)}`} />
          <Row label="Tax" value={`$${parseFloat(order.taxAmount).toFixed(2)}`} />
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {shippingAddress && (
        <div className="rounded-2xl border bg-card p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold mb-2">Shipping to</h2>
          <p className="text-sm text-muted-foreground">
            {user?.name}
            <br />
            {shippingAddress.line1}
            {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
          </p>
        </div>
      )}

      {order.isGift && order.giftMessage && (
        <div className="rounded-2xl border bg-card p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold mb-2">Gift message</h2>
          <p className="text-sm whitespace-pre-wrap">{order.giftMessage}</p>
        </div>
      )}

      <PayClient token={token} successUrl={`/pay/${token}/success`} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function InvalidLinkPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="container mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
