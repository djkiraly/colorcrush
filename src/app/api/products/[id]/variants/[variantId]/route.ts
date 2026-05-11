import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { inventory, productVariants } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  priceOverride: z.coerce.number().positive().nullable().optional(),
  compareAtPriceOverride: z.coerce.number().positive().nullable().optional(),
  weightOzOverride: z.coerce.number().int().nonnegative().nullable().optional(),
  weight: z.coerce.number().positive().nullable().optional(),
  imageOverrideId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  // stock is updated through inventory, but we accept it here as a convenience.
  stock: z.coerce.number().int().nonnegative().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId, variantId } = await params;

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const { stock, ...variantPatch } = parsed;

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (variantPatch.sku !== undefined) updateValues.sku = variantPatch.sku;
  if (variantPatch.priceOverride !== undefined)
    updateValues.priceOverride =
      variantPatch.priceOverride === null ? null : String(variantPatch.priceOverride);
  if (variantPatch.compareAtPriceOverride !== undefined)
    updateValues.compareAtPriceOverride =
      variantPatch.compareAtPriceOverride === null
        ? null
        : String(variantPatch.compareAtPriceOverride);
  if (variantPatch.weightOzOverride !== undefined)
    updateValues.weightOzOverride = variantPatch.weightOzOverride;
  if (variantPatch.weight !== undefined)
    updateValues.weight = variantPatch.weight === null ? null : String(variantPatch.weight);
  if (variantPatch.imageOverrideId !== undefined)
    updateValues.imageOverrideId = variantPatch.imageOverrideId;
  if (variantPatch.isActive !== undefined) updateValues.isActive = variantPatch.isActive;
  if (variantPatch.sortOrder !== undefined) updateValues.sortOrder = variantPatch.sortOrder;

  const [updated] = await db
    .update(productVariants)
    .set(updateValues)
    .where(
      and(eq(productVariants.id, variantId), eq(productVariants.productId, productId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  if (stock !== undefined) {
    await db
      .update(inventory)
      .set({ quantity: stock, updatedAt: new Date() })
      .where(eq(inventory.variantId, variantId));
  }

  return NextResponse.json({ variant: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId, variantId } = await params;

  const result = await db
    .delete(productVariants)
    .where(
      and(eq(productVariants.id, variantId), eq(productVariants.productId, productId))
    )
    .returning({ id: productVariants.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
