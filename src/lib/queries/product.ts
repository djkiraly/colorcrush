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
  productVariants,
  productVariantOptions,
  productOptionValues,
  productOptionTypes,
} from "@/lib/db/schema";
import { asc, eq, and, inArray } from "drizzle-orm";

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

  // Variant data (only meaningful when hasVariants is true, but we still load it
  // when present so admins can preview a draft set without flipping the flag).
  const variantRows = product.hasVariants
    ? await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.sku))
    : [];

  const variantIds = variantRows.map((v) => v.id);
  const [variantOptionRows, variantInventoryRows] = await Promise.all([
    variantIds.length > 0
      ? db
          .select({
            variantId: productVariantOptions.variantId,
            optionValueId: productOptionValues.id,
            value: productOptionValues.value,
            slug: productOptionValues.slug,
            code: productOptionValues.code,
            swatchHex: productOptionValues.swatchHex,
            sortOrder: productOptionValues.sortOrder,
            optionTypeId: productOptionTypes.id,
            optionTypeName: productOptionTypes.name,
            optionTypeSlug: productOptionTypes.slug,
            optionTypeSortOrder: productOptionTypes.sortOrder,
          })
          .from(productVariantOptions)
          .innerJoin(
            productOptionValues,
            eq(productVariantOptions.optionValueId, productOptionValues.id)
          )
          .innerJoin(
            productOptionTypes,
            eq(productOptionValues.optionTypeId, productOptionTypes.id)
          )
          .where(inArray(productVariantOptions.variantId, variantIds))
      : Promise.resolve(
          [] as {
            variantId: string;
            optionValueId: string;
            value: string;
            slug: string;
            code: string;
            swatchHex: string | null;
            sortOrder: number;
            optionTypeId: string;
            optionTypeName: string;
            optionTypeSlug: string;
            optionTypeSortOrder: number;
          }[]
        ),
    variantIds.length > 0
      ? db
          .select()
          .from(inventory)
          .where(inArray(inventory.variantId, variantIds))
      : Promise.resolve([] as (typeof inventory.$inferSelect)[]),
  ]);

  const optsByVariant = new Map<string, typeof variantOptionRows>();
  for (const row of variantOptionRows) {
    const arr = optsByVariant.get(row.variantId) ?? [];
    arr.push(row);
    optsByVariant.set(row.variantId, arr);
  }
  const invByVariant = new Map(variantInventoryRows.map((i) => [i.variantId!, i]));

  const variants = variantRows
    .filter((v) => v.isActive)
    .map((v) => ({
      ...v,
      options: (optsByVariant.get(v.id) ?? []).sort(
        (a, b) => a.optionTypeSortOrder - b.optionTypeSortOrder
      ),
      inventory: invByVariant.get(v.id) ?? null,
    }));

  // Aggregate the option types and ordered values offered by this product
  // (only types that have at least one selected value in an active variant).
  const optionTypesMap = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      sortOrder: number;
      values: Map<
        string,
        { id: string; value: string; slug: string; code: string; swatchHex: string | null; sortOrder: number }
      >;
    }
  >();
  for (const v of variants) {
    for (const opt of v.options) {
      let bucket = optionTypesMap.get(opt.optionTypeId);
      if (!bucket) {
        bucket = {
          id: opt.optionTypeId,
          name: opt.optionTypeName,
          slug: opt.optionTypeSlug,
          sortOrder: opt.optionTypeSortOrder,
          values: new Map(),
        };
        optionTypesMap.set(opt.optionTypeId, bucket);
      }
      if (!bucket.values.has(opt.optionValueId)) {
        bucket.values.set(opt.optionValueId, {
          id: opt.optionValueId,
          value: opt.value,
          slug: opt.slug,
          code: opt.code,
          swatchHex: opt.swatchHex,
          sortOrder: opt.sortOrder,
        });
      }
    }
  }
  const optionTypes = Array.from(optionTypesMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      sortOrder: t.sortOrder,
      values: Array.from(t.values.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value)
      ),
    }));

  // Compute "from $X" range when variants exist.
  const basePrice = parseFloat(product.price);
  const variantPrices = variants
    .map((v) => (v.priceOverride ? parseFloat(v.priceOverride) : basePrice))
    .filter((n) => Number.isFinite(n));
  const priceRange =
    variantPrices.length > 0
      ? {
          min: Math.min(...variantPrices),
          max: Math.max(...variantPrices),
        }
      : null;

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
    variants,
    optionTypes,
    priceRange,
  };
}
