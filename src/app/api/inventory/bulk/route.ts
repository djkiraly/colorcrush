import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventory, inventoryLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { sendLowStockAlerts } from "@/lib/email-notifications";

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { items } = await request.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items to update" }, { status: 400 });
  }

  let updatedCount = 0;
  let hasLowStock = false;

  for (const item of items) {
    const [current] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, item.productId))
      .limit(1);

    if (!current) continue;

    const qtyChanged = current.quantity !== item.quantity;
    const isRestock = item.quantity > current.quantity;

    await db
      .update(inventory)
      .set({
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        updatedAt: new Date(),
        ...(isRestock ? { lastRestockedAt: new Date() } : {}),
      })
      .where(eq(inventory.productId, item.productId));

    if (qtyChanged) {
      await db.insert(inventoryLog).values({
        productId: item.productId,
        previousQty: current.quantity,
        newQty: item.quantity,
        changeReason: isRestock ? "restock" : "adjustment",
        notes: "Bulk edit",
        adminId: session?.user?.id,
      });

      if (item.quantity <= item.lowStockThreshold) {
        hasLowStock = true;
      }
    }

    updatedCount++;
  }

  if (hasLowStock) {
    sendLowStockAlerts().catch(() => {});
  }

  return NextResponse.json({ success: true, updatedCount });
}
