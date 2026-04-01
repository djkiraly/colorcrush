import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventory, inventoryLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { productId, newQuantity, reason, notes, adminId } = await request.json();

  const [current] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "Product inventory not found" }, { status: 404 });
  }

  // Update inventory
  await db
    .update(inventory)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
      ...(reason === "restock" ? { lastRestockedAt: new Date() } : {}),
    })
    .where(eq(inventory.productId, productId));

  // Log the change
  await db.insert(inventoryLog).values({
    productId,
    previousQty: current.quantity,
    newQty: newQuantity,
    changeReason: reason,
    notes,
    adminId,
  });

  return NextResponse.json({ success: true });
}
