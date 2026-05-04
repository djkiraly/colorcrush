import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shippo } from "@/lib/shippo";
import { logOrderAction } from "@/lib/order-audit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminId = (session?.user as { id?: string })?.id;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.shippoRateId || order.shippoRateId === "flat-standard") {
    return NextResponse.json(
      {
        error:
          "Flat-rate orders need a manually purchased label — buy this one in the Shippo dashboard",
      },
      { status: 400 }
    );
  }

  if (order.shippoTransactionId) {
    return NextResponse.json({ error: "Label already purchased" }, { status: 400 });
  }

  try {
    const tx = (await shippo.transactions.create({
      rate: order.shippoRateId,
      labelFileType: "PDF",
      async: false,
    })) as {
      objectId?: string;
      status?: string;
      labelUrl?: string;
      trackingNumber?: string;
      trackingUrlProvider?: string;
      messages?: Array<{ text?: string; source?: string; code?: string }>;
    };

    if (tx.status !== "SUCCESS") {
      console.error("[admin/label] Shippo non-success status:", tx.status, tx.messages);
      return NextResponse.json(
        {
          error: "Shippo could not purchase the label",
          messages: tx.messages || [],
        },
        { status: 502 }
      );
    }

    const labelUrl = tx.labelUrl || null;
    const trackingNumber = tx.trackingNumber || null;
    const trackingUrl = tx.trackingUrlProvider || null;

    await db
      .update(orders)
      .set({
        shippoTransactionId: tx.objectId || null,
        shippoLabelUrl: labelUrl,
        shippoTrackingNumber: trackingNumber,
        shippoTrackingUrl: trackingUrl,
        trackingNumber: trackingNumber || order.trackingNumber,
        trackingCarrier: order.shippingCarrier || order.trackingCarrier,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await logOrderAction({
      orderId: id,
      adminId,
      action: "shipping_label_purchased",
      details: trackingNumber
        ? `Label purchased; tracking ${trackingNumber}`
        : "Label purchased",
    }).catch(() => {});

    return NextResponse.json({
      labelUrl,
      trackingNumber,
      trackingUrl,
    });
  } catch (err) {
    console.error("[admin/label]", err);
    return NextResponse.json(
      { error: "Failed to purchase label" },
      { status: 500 }
    );
  }
}
