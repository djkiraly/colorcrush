import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  // Return all products with full editable fields for bulk edit
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      costPrice: products.costPrice,
      manufacturer: products.manufacturer,
      weight: products.weight,
      categoryId: products.categoryId,
      shortDescription: products.shortDescription,
      description: products.description,
      tags: products.tags,
      allergens: products.allergens,
      ingredients: products.ingredients,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      isGiftEligible: products.isGiftEligible,
    })
    .from(products)
    .orderBy(asc(products.name));

  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  return NextResponse.json({ products: allProducts, categories: allCategories });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: any[] = body.products;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No products to update" }, { status: 400 });
  }

  let updatedCount = 0;

  for (const item of updates) {
    await db
      .update(products)
      .set({
        name: item.name,
        sku: item.sku,
        price: String(item.price),
        compareAtPrice: item.compareAtPrice ? String(item.compareAtPrice) : null,
        costPrice: item.costPrice ? String(item.costPrice) : null,
        manufacturer: item.manufacturer || null,
        weight: item.weight ? String(item.weight) : null,
        categoryId: item.categoryId || null,
        shortDescription: item.shortDescription || null,
        description: item.description || null,
        tags: item.tags || [],
        allergens: item.allergens || [],
        ingredients: item.ingredients || null,
        isActive: item.isActive,
        isFeatured: item.isFeatured,
        isGiftEligible: item.isGiftEligible,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.id));
    updatedCount++;
  }

  return NextResponse.json({ success: true, updatedCount });
}
