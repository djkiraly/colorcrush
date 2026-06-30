import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNutritionByProductId } from "@/lib/queries/nutrition";
import { buildLabelModel } from "@/lib/label-model";
import { LabelPrintView, type LabelSize } from "@/components/admin/LabelPrintView";

// Admin access is enforced by src/app/admin/layout.tsx (role gate).
export default async function ProductLabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { id } = await params;
  const { size } = await searchParams;

  const [product] = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const nutrition = await getNutritionByProductId(product.id);
  const model = buildLabelModel(product, nutrition);

  const allowed: LabelSize[] = ["2x2", "3x2", "4x3"];
  const initialSize: LabelSize = allowed.includes(size as LabelSize)
    ? (size as LabelSize)
    : "2x2";

  return (
    <LabelPrintView
      productId={product.id}
      model={model}
      initialSize={initialSize}
    />
  );
}
