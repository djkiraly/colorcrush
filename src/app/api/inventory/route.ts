import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventory, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const items = await db
    .select({
      id: inventory.id,
      productId: inventory.productId,
      productName: products.name,
      sku: products.sku,
      quantity: inventory.quantity,
      lowStockThreshold: inventory.lowStockThreshold,
      reorderPoint: inventory.reorderPoint,
      reorderQuantity: inventory.reorderQuantity,
      lastRestockedAt: inventory.lastRestockedAt,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .orderBy(inventory.quantity);

  return NextResponse.json({ items });
}
