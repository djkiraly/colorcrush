import { db } from "@/lib/db";
import { shippingBoxes } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export interface CartItemForShipping {
  productId: string;
  weightOz: number;
  quantity: number;
  defaultBoxId?: string | null;
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
 * Pick the box for a cart, in priority order:
 *
 * 1. If any cart item declares a `defaultBoxId`, pick the largest declared box
 *    by `maxWeightOz` (so a small + large product ships in the larger box).
 *    If that declared box is still too small for total cart weight, escalate
 *    to the smallest active box that fits.
 * 2. Otherwise pick the smallest active box whose `maxWeightOz >= total cart
 *    weight`.
 * 3. If nothing fits, fall back to the largest active box (Shippo will still
 *    quote — just on the largest available dims).
 *
 * Returns `null` only when no active boxes exist.
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

  const declaredIds = Array.from(
    new Set(items.map((i) => i.defaultBoxId).filter((v): v is string => !!v))
  );

  let chosen: (typeof boxes)[number] | undefined;

  if (declaredIds.length > 0) {
    // Largest declared (still active) box — that's the carton everything goes in.
    const declared = boxes
      .filter((b) => declaredIds.includes(b.id))
      .sort((a, b) => b.maxWeightOz - a.maxWeightOz)[0];

    if (declared && declared.maxWeightOz >= totalWeightOz) {
      chosen = declared;
    } else {
      // Declared box(es) can't carry the cart weight — escalate.
      chosen = boxes.find((b) => b.maxWeightOz >= totalWeightOz);
    }
  } else {
    chosen = boxes.find((b) => b.maxWeightOz >= totalWeightOz);
  }

  if (!chosen) chosen = boxes[boxes.length - 1];

  return {
    id: chosen.id,
    name: chosen.name,
    lengthIn: parseFloat(chosen.lengthIn),
    widthIn: parseFloat(chosen.widthIn),
    heightIn: parseFloat(chosen.heightIn),
    totalWeightOz,
  };
}
