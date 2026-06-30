import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNutritionByProductId } from "@/lib/queries/nutrition";
import { NutritionEditor } from "@/components/admin/NutritionEditor";

// Admin access is enforced by src/app/admin/layout.tsx (role gate).
export default async function ProductNutritionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product] = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const nutrition = await getNutritionByProductId(product.id);

  return <NutritionEditor product={product} initialNutrition={nutrition} />;
}
