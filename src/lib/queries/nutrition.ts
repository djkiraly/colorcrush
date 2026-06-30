import "server-only";
import { db } from "@/lib/db";
import { products, productNutrition } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type ProductNutritionRecord = typeof productNutrition.$inferSelect;

/** Admin: fetch the nutrition record for a product id (or null if none yet). */
export async function getNutritionByProductId(
  productId: string
): Promise<ProductNutritionRecord | null> {
  const [row] = await db
    .select()
    .from(productNutrition)
    .where(eq(productNutrition.productId, productId))
    .limit(1);
  return row ?? null;
}

/**
 * Public: fetch the product (active only) and its nutrition record by slug.
 * Returns null if the product doesn't exist or is inactive; `nutrition` is null
 * when the product exists but no nutrition has been entered yet.
 */
export async function getNutritionBySlug(slug: string): Promise<{
  product: { id: string; name: string; slug: string };
  nutrition: ProductNutritionRecord | null;
} | null> {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      isActive: products.isActive,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product || !product.isActive) return null;

  const nutrition = await getNutritionByProductId(product.id);
  return {
    product: { id: product.id, name: product.name, slug: product.slug },
    nutrition,
  };
}
