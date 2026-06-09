import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories, inventory, shippingBoxes } from "@/lib/db/schema";
import { eq, asc, inArray, and, isNull } from "drizzle-orm";
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
      defaultBoxId: products.defaultBoxId,
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

  const productIds = allProducts.map((p) => p.id);
  // Base-product stock lives in the inventory row with no variant. (Since the
  // variants refactor a product can have many inventory rows — one per variant
  // — so we must scope to variantId IS NULL.)
  const invRows = productIds.length
    ? await db
        .select({ productId: inventory.productId, quantity: inventory.quantity })
        .from(inventory)
        .where(
          and(inArray(inventory.productId, productIds), isNull(inventory.variantId))
        )
    : [];
  const stockMap = new Map(invRows.map((r) => [r.productId, r.quantity]));

  const withStock = allProducts.map((p) => ({
    ...p,
    stock: stockMap.get(p.id) ?? 0,
  }));

  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  const allBoxes = await db
    .select({
      id: shippingBoxes.id,
      name: shippingBoxes.name,
      maxWeightOz: shippingBoxes.maxWeightOz,
      isActive: shippingBoxes.isActive,
    })
    .from(shippingBoxes)
    .orderBy(asc(shippingBoxes.sortOrder), asc(shippingBoxes.maxWeightOz));

  return NextResponse.json({
    products: withStock,
    categories: allCategories,
    boxes: allBoxes,
  });
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
        defaultBoxId: item.defaultBoxId || null,
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

    if (typeof item.stock === "number" && Number.isFinite(item.stock)) {
      const quantity = Math.max(0, Math.floor(item.stock));
      // Update the base inventory row (variantId IS NULL), or create it if the
      // product has none yet. There's no longer a unique constraint on
      // product_id (variants can each have their own row), so an upsert by
      // product_id would error.
      const [existing] = await db
        .select({ id: inventory.id })
        .from(inventory)
        .where(and(eq(inventory.productId, item.id), isNull(inventory.variantId)))
        .limit(1);

      if (existing) {
        await db
          .update(inventory)
          .set({ quantity, updatedAt: new Date() })
          .where(eq(inventory.id, existing.id));
      } else {
        await db.insert(inventory).values({ productId: item.id, quantity });
      }
    }
    updatedCount++;
  }

  return NextResponse.json({ success: true, updatedCount });
}
