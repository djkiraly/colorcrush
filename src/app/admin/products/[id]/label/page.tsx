import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNutritionByProductId } from "@/lib/queries/nutrition";
import { buildLabelModel } from "@/lib/label-model";
import { LabelPrintView } from "@/components/admin/LabelPrintView";
import {
  AVERY_TEMPLATE_IDS,
  type AveryTemplateId,
} from "@/lib/avery-templates";

// Admin access is enforced by src/app/admin/layout.tsx (role gate).
export default async function ProductLabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const { template } = await searchParams;

  const [product] = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const nutrition = await getNutritionByProductId(product.id);
  const model = buildLabelModel(product, nutrition);

  // Generate the bare QR once server-side and inline it into every label cell,
  // so a 30-up sheet doesn't fire 30 identical image requests at print time.
  // QR is optional — never let a generation failure crash the whole label.
  let qrSvg: string | null = null;
  if (model.qrUrl) {
    try {
      qrSvg = await QRCode.toString(model.qrUrl, { type: "svg", margin: 1 });
    } catch {
      qrSvg = null;
    }
  }

  const initialTemplate: AveryTemplateId = AVERY_TEMPLATE_IDS.includes(
    template as AveryTemplateId
  )
    ? (template as AveryTemplateId)
    : "22806";

  return (
    <LabelPrintView
      model={model}
      qrSvg={qrSvg}
      initialTemplate={initialTemplate}
    />
  );
}
