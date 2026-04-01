import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  categories,
  inventory,
  reviews,
  users,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try by slug first, then by id
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, id))
    .limit(1);

  if (!product) {
    const [byId] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!byId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return getProductResponse(byId);
  }

  return getProductResponse(product);
}

async function getProductResponse(product: typeof products.$inferSelect) {
  const [images, category, inv, productReviews] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.sortOrder),
    product.categoryId
      ? db
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, product.id))
      .limit(1),
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
      .where(
        and(eq(reviews.productId, product.id), eq(reviews.isApproved, true))
      )
      .orderBy(reviews.createdAt),
  ]);

  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length
      : 0;

  return NextResponse.json({
    ...product,
    images,
    category: category[0] || null,
    inventory: inv[0] || null,
    reviews: productReviews,
    averageRating: avgRating,
    reviewCount: productReviews.length,
  });
}
