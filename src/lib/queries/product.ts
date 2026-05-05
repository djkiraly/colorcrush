import "server-only";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  categories,
  inventory,
  reviews,
  users,
  productCategories,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type ProductDetailData = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product || !product.isActive) return null;

  const [images, category, inv, productReviews, linkedCategories] =
    await Promise.all([
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
          and(
            eq(reviews.productId, product.id),
            eq(reviews.isApproved, true)
          )
        )
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
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length
      : 0;

  return {
    ...product,
    images,
    category: category[0] || null,
    categories: linkedCategories,
    categoryIds: linkedCategories.map((c) => c.id),
    inventory: inv[0] || null,
    reviews: productReviews,
    averageRating: avgRating,
    reviewCount: productReviews.length,
  };
}
