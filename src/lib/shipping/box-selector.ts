import { db } from "@/lib/db";
import { shippingBoxes } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export interface CartItemForShipping {
  productId: string;
  weightOz: number;
  quantity: number;
}

export interface SelectedBox {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  totalWeightOz: number;
}

export function calculateCartWeightOz(
  items: CartItemForShipping[],
  defaultWeightOz: number = 4
): number {
  return items.reduce((sum, item) => {
    const w = item.weightOz > 0 ? item.weightOz : defaultWeightOz;
    return sum + w * item.quantity;
  }, 0);
}

/**
 * Pick the smallest active box whose `maxWeightOz >= total cart weight`.
 * Falls back to the largest active box when nothing fits (caller can decide
 * whether to surface this — Shippo will still produce rates for over-weight
 * shipments, just based on the largest box's dimensions).
 *
 * Returns `null` only when no active boxes exist in the database.
 */
export async function selectBoxForCart(
  items: CartItemForShipping[],
  defaultWeightOz: number = 4
): Promise<SelectedBox | null> {
  const totalWeightOz = calculateCartWeightOz(items, defaultWeightOz);

  const boxes = await db
    .select()
    .from(shippingBoxes)
    .where(eq(shippingBoxes.isActive, true))
    .orderBy(asc(shippingBoxes.maxWeightOz));

  if (boxes.length === 0) return null;

  const fitting = boxes.find((b) => b.maxWeightOz >= totalWeightOz);
  const chosen = fitting ?? boxes[boxes.length - 1];

  return {
    id: chosen.id,
    name: chosen.name,
    lengthIn: parseFloat(chosen.lengthIn),
    widthIn: parseFloat(chosen.widthIn),
    heightIn: parseFloat(chosen.heightIn),
    totalWeightOz,
  };
}
