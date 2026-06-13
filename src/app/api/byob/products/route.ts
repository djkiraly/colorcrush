import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, inventory } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

// Public endpoint: active, BYOB-eligible candies with their taste/color/flavor
// slugs (which map to the site_settings.byob taxonomy) for the Build Your Box
// candy grid + filter chips.
export async function GET() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      byobTaste: products.byobTaste,
      byobColor: products.byobColor,
      byobFlavor: products.byobFlavor,
    })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.byobEligible, true)))
    .orderBy(products.name);

  if (rows.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const ids = rows.map((r) => r.id);
  const [images, inv] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, ids),
          eq(productImages.isPrimary, true)
        )
      ),
    db.select().from(inventory).where(inArray(inventory.productId, ids)),
  ]);

  const result = rows.map((p) => {
    const image = images.find((i) => i.productId === p.id);
    const stockRow = inv.find((i) => i.productId === p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: image?.url || null,
      taste: p.byobTaste,
      color: p.byobColor,
      flavor: p.byobFlavor,
      stock: stockRow?.quantity ?? 0,
    };
  });

  return NextResponse.json({ products: result });
}
