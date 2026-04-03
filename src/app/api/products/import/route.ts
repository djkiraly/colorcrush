import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, inventory } from "@/lib/db/schema";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await request.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No data to import" }, { status: 400 });
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.name || !row.sku || !row.price) {
        errors.push(`Row ${i + 1}: name, sku, and price are required`);
        continue;
      }

      const [product] = await db
        .insert(products)
        .values({
          name: row.name,
          slug: row.slug || slugify(row.name),
          sku: row.sku,
          price: String(row.price),
          compareAtPrice: row.compareAtPrice ? String(row.compareAtPrice) : null,
          costPrice: row.costPrice ? String(row.costPrice) : null,
          weight: row.weight ? String(row.weight) : null,
          shortDescription: row.shortDescription || null,
          description: row.description || null,
          tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
          allergens: row.allergens ? row.allergens.split(",").map((a: string) => a.trim()) : [],
          ingredients: row.ingredients || null,
          isActive: row.isActive !== "false",
          isFeatured: row.isFeatured === "true",
          isGiftEligible: row.isGiftEligible !== "false",
        })
        .returning();

      await db.insert(inventory).values({
        productId: product.id,
        quantity: row.stock ? parseInt(row.stock) : 0,
      });

      imported++;
    } catch (err) {
      errors.push(
        `Row ${i + 1} (${row.name || row.sku || "unknown"}): ${err instanceof Error ? err.message : "Failed"}`
      );
    }
  }

  return NextResponse.json({ imported, errors });
}
