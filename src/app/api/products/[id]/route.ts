import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  categories,
  inventory,
  reviews,
  users,
  productCategories,
  orderItems,
  orders,
} from "@/lib/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

  // Try by slug first, then by id
  let [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, id))
    .limit(1);

  if (!product) {
    [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
  }

  if (!product || (!includeInactive && !product.isActive)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const [images, category, inv, productReviews, linkedCategories] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.sortOrder),
    product.categoryId
      ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      : Promise.resolve([]),
    db.select().from(inventory).where(eq(inventory.productId, product.id)).limit(1),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        adminResponse: reviews.adminResponse,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)))
      .orderBy(reviews.createdAt),
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, product.id)),
  ]);

  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;

  return NextResponse.json({
    ...product,
    images,
    category: category[0] || null,
    categories: linkedCategories,
    categoryIds: linkedCategories.map((c) => c.id),
    inventory: inv[0] || null,
    reviews: productReviews,
    averageRating: avgRating,
    reviewCount: productReviews.length,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const hasCategoryIds = Array.isArray(body.categoryIds);
  const categoryIds: string[] = hasCategoryIds ? body.categoryIds.filter(Boolean) : [];
  const { categoryIds: _ignore, ...rest } = body;

  const updatePayload: Record<string, unknown> = {
    ...rest,
    price: String(body.price),
    compareAtPrice: body.compareAtPrice ? String(body.compareAtPrice) : null,
    costPrice: body.costPrice ? String(body.costPrice) : null,
    weight: body.weight ? String(body.weight) : null,
    updatedAt: new Date(),
  };
  if (hasCategoryIds) {
    updatePayload.categoryId = categoryIds[0] || null;
  }

  const [updated] = await db
    .update(products)
    .set(updatePayload)
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (hasCategoryIds) {
    await db.delete(productCategories).where(eq(productCategories.productId, id));
    if (categoryIds.length > 0) {
      await db
        .insert(productCategories)
        .values(categoryIds.map((categoryId) => ({ productId: id, categoryId })))
        .onConflictDoNothing();
    }
  }

  return NextResponse.json(updated);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
  if (typeof body.isFeatured === "boolean") patch.isFeatured = body.isFeatured;

  const [updated] = await db
    .update(products)
    .set(patch)
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const blocking = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orderItems.productId, id), ne(orders.status, "cancelled")))
      .limit(6);

    if (blocking.length > 0) {
      const unique = Array.from(new Set(blocking.map((b) => b.orderNumber)));
      const shown = unique.slice(0, 5).join(", ");
      const suffix = unique.length > 5 ? ` and ${unique.length - 5} more` : "";
      return NextResponse.json(
        {
          error: `This product is referenced by order(s) ${shown}${suffix} and cannot be deleted. Deactivate it instead to hide it from the storefront.`,
        },
        { status: 409 }
      );
    }

    await db.delete(orderItems).where(eq(orderItems.productId, id));
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "23503" || err?.cause?.code === "23503") {
      return NextResponse.json(
        {
          error:
            "This product is referenced by existing records and cannot be deleted. Deactivate it instead.",
        },
        { status: 409 }
      );
    }
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
