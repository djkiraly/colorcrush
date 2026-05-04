import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users, addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentLinkToken, token))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const expired = order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date();
  const wrongStatus = !["pending_payment", "confirmed", "paid_offline"].includes(order.status);

  // Allow status==confirmed/paid_offline to fall through so the success page can show "paid".
  if (wrongStatus) {
    return NextResponse.json({ error: "invalid_status", status: order.status }, { status: 400 });
  }
  if (expired && order.status === "pending_payment") {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
  const items = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      isCustom: orderItems.isCustom,
      customDescription: orderItems.customDescription,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  let shippingAddress = null;
  if (order.shippingAddressId) {
    const [a] = await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)).limit(1);
    shippingAddress = a || null;
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      manualDiscountAmount: order.manualDiscountAmount,
      total: order.total,
      shippingMethod: order.shippingMethod,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      paymentLinkExpiresAt: order.paymentLinkExpiresAt,
    },
    customer: user ? { name: user.name, email: user.email } : null,
    items,
    shippingAddress,
  });
}
