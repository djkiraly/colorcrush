import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, inventory } from "@/lib/db/schema";
import { desc, like } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

function toSkuSegment(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4).padEnd(4, "X");
}

async function generateSku(categoryName: string | null, productName: string): Promise<string> {
  const prefix = `${toSkuSegment(categoryName || "GNRL")}-${toSkuSegment(productName)}-`;
  const [latest] = await db
    .select({ sku: products.sku })
    .from(products)
    .where(like(products.sku, `${prefix}%`))
    .orderBy(desc(products.sku))
    .limit(1);
  let nextNum = 1;
  if (latest?.sku) {
    const parsed = parseInt(latest.sku.slice(prefix.length));
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

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
      if (!row.name || !row.price) {
        errors.push(`Row ${i + 1}: name and price are required`);
        continue;
      }

      const sku = row.sku || await generateSku(null, row.name);

      const [product] = await db
        .insert(products)
        .values({
          name: row.name,
          slug: row.slug || slugify(row.name),
          sku,
          price: String(row.price),
          compareAtPrice: row.compareAtPrice ? String(row.compareAtPrice) : null,
          costPrice: row.costPrice ? String(row.costPrice) : null,
          manufacturer: row.manufacturer || null,
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
