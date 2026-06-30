import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, categories, inventory, reviews, productCategories, orderItems, orders, pageViews } from "@/lib/db/schema";
import { eq, ilike, and, or, gte, lte, inArray, notInArray, sql, desc, asc, like, type SQL } from "drizzle-orm";

function toSkuSegment(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
}

async function generateSku(categoryName: string | null, productName: string): Promise<string> {
  const catPart = toSkuSegment(categoryName || "GNRL");
  const prodPart = toSkuSegment(productName);
  const prefix = `${catPart}-${prodPart}-`;

  // Find the highest existing number with this prefix
  const [latest] = await db
    .select({ sku: products.sku })
    .from(products)
    .where(like(products.sku, `${prefix}%`))
    .orderBy(desc(products.sku))
    .limit(1);

  let nextNum = 1;
  if (latest?.sku) {
    const lastPart = latest.sku.slice(prefix.length);
    const parsed = parseInt(lastPart);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const categoryIds: string[] = Array.isArray(body.categoryIds)
      ? body.categoryIds.filter(Boolean)
      : body.categoryId
      ? [body.categoryId]
      : [];
    const primaryCategoryId = categoryIds[0] || null;

    // Resolve category name for SKU generation
    let categoryName: string | null = null;
    if (primaryCategoryId) {
      const [cat] = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, primaryCategoryId))
        .limit(1);
      categoryName = cat?.name || null;
    }

    const sku = await generateSku(categoryName, body.name);

    const rest = { ...body };
    delete rest.categoryIds;
    const [product] = await db
      .insert(products)
      .values({
        ...rest,
        categoryId: primaryCategoryId,
        slug,
        sku,
        price: String(body.price),
        compareAtPrice: body.compareAtPrice ? String(body.compareAtPrice) : null,
        costPrice: body.costPrice ? String(body.costPrice) : null,
        weight: body.weight ? String(body.weight) : null,
      })
      .returning();

    if (categoryIds.length > 0) {
      await db
        .insert(productCategories)
        .values(categoryIds.map((categoryId) => ({ productId: product.id, categoryId })))
        .onConflictDoNothing();
    }

    // Create inventory record
    await db.insert(inventory).values({
      productId: product.id,
      quantity: 0,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const typeSlugs = searchParams.get("type")?.split(",").filter(Boolean) || [];
  const colorSlugs = searchParams.get("color")?.split(",").filter(Boolean) || [];
  const eventSlugs = searchParams.get("event")?.split(",").filter(Boolean) || [];
  const sort = searchParams.get("sort") || "featured";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minStockParam = searchParams.get("minStock");
  const maxStockParam = searchParams.get("maxStock");
  const minOrderedParam = searchParams.get("minOrdered");
  const maxOrderedParam = searchParams.get("maxOrdered");
  const categoryIdParam = searchParams.get("categoryId");
  // status: "all" | "active" | "inactive" | "featured". Takes precedence over
  // the legacy `includeInactive` flag when both are supplied.
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const featured = searchParams.get("featured");
  const includeInactive = searchParams.get("includeInactive") === "true";
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (status === "active") {
    conditions.push(eq(products.isActive, true));
  } else if (status === "inactive") {
    conditions.push(eq(products.isActive, false));
  } else if (status === "featured") {
    conditions.push(eq(products.isFeatured, true));
  } else if (status === "all") {
    // no isActive filter
  } else if (!includeInactive) {
    conditions.push(eq(products.isActive, true));
  }

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (category) {
    const [cat] = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (cat) {
      // If the matched category is a root, include its descendants so e.g.
      // `/categories/shop-by-type` lists every product under any Type child.
      let categoryIds: string[] = [cat.id];
      if (cat.parentId === null) {
        const descendants = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, cat.id));
        if (descendants.length > 0) {
          categoryIds = [cat.id, ...descendants.map((d) => d.id)];
        }
      }
      conditions.push(
        inArray(
          products.id,
          db
            .select({ id: productCategories.productId })
            .from(productCategories)
            .where(inArray(productCategories.categoryId, categoryIds))
        )
      );
    }
  }

  // Multi-facet taxonomy filtering: type / color / event
  // Each facet ANDs across; multiple slugs within a facet OR (any match counts).
  const facetSlugLists = [typeSlugs, colorSlugs, eventSlugs].filter(
    (slugs) => slugs.length > 0
  );
  if (facetSlugLists.length > 0) {
    const allSlugs = facetSlugLists.flat();
    const matchedCats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories)
      .where(inArray(categories.slug, allSlugs));
    const idBySlug = new Map(matchedCats.map((c) => [c.slug, c.id]));

    for (const slugs of facetSlugLists) {
      const ids = slugs.map((s) => idBySlug.get(s)).filter((id): id is string => !!id);
      if (ids.length === 0) {
        // Slug not found → impossible match → force empty result
        conditions.push(sql`false`);
        continue;
      }
      conditions.push(
        inArray(
          products.id,
          db
            .select({ id: productCategories.productId })
            .from(productCategories)
            .where(inArray(productCategories.categoryId, ids))
        )
      );
    }
  }

  if (minPrice) {
    conditions.push(gte(products.price, minPrice));
  }
  if (maxPrice) {
    conditions.push(lte(products.price, maxPrice));
  }

  // Admin filter: filter by primary category UUID (separate from public-facing
  // `category` slug filter, which goes through the M:N table and resolves
  // descendants).
  if (categoryIdParam) {
    conditions.push(eq(products.categoryId, categoryIdParam));
  }

  // Stock range — sums `inventory.quantity` per product (covers variant rows
  // too) and matches the configured range. minStock=0 also matches products
  // with no inventory rows at all.
  const minStock = minStockParam !== null ? Number(minStockParam) : null;
  const maxStock = maxStockParam !== null ? Number(maxStockParam) : null;
  if (
    (minStock !== null && Number.isFinite(minStock)) ||
    (maxStock !== null && Number.isFinite(maxStock))
  ) {
    const havingParts = [];
    if (minStock !== null && Number.isFinite(minStock)) {
      havingParts.push(sql`coalesce(sum(${inventory.quantity}), 0) >= ${minStock}`);
    }
    if (maxStock !== null && Number.isFinite(maxStock)) {
      havingParts.push(sql`coalesce(sum(${inventory.quantity}), 0) <= ${maxStock}`);
    }
    const havingExpr = havingParts.reduce(
      (acc, part, i) => (i === 0 ? part : sql`${acc} AND ${part}`),
      sql``
    );
    // EXISTS-style: filter products whose summed inventory falls in range.
    // Falling back via NOT IN handles the "no inventory rows" case for minStock=0.
    const matchingIds = db
      .select({ id: inventory.productId })
      .from(inventory)
      .groupBy(inventory.productId)
      .having(havingExpr);
    if (minStock !== null && minStock <= 0) {
      const productsWithInventory = db
        .select({ id: inventory.productId })
        .from(inventory);
      conditions.push(
        or(
          inArray(products.id, matchingIds),
          notInArray(products.id, productsWithInventory)
        )!
      );
    } else {
      conditions.push(inArray(products.id, matchingIds));
    }
  }

  // Ordered range — total quantity sold across non-cancelled orders.
  const minOrdered = minOrderedParam !== null ? Number(minOrderedParam) : null;
  const maxOrdered = maxOrderedParam !== null ? Number(maxOrderedParam) : null;
  if (
    (minOrdered !== null && Number.isFinite(minOrdered)) ||
    (maxOrdered !== null && Number.isFinite(maxOrdered))
  ) {
    const havingParts = [];
    if (minOrdered !== null && Number.isFinite(minOrdered)) {
      havingParts.push(
        sql`coalesce(sum(${orderItems.quantity}), 0) >= ${minOrdered}`
      );
    }
    if (maxOrdered !== null && Number.isFinite(maxOrdered)) {
      havingParts.push(
        sql`coalesce(sum(${orderItems.quantity}), 0) <= ${maxOrdered}`
      );
    }
    const havingExpr = havingParts.reduce(
      (acc, part, i) => (i === 0 ? part : sql`${acc} AND ${part}`),
      sql``
    );
    const matchingIds = db
      .select({ id: orderItems.productId })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.status} <> 'cancelled'`)
      .groupBy(orderItems.productId)
      .having(havingExpr);
    if (minOrdered !== null && minOrdered <= 0) {
      // Products with zero orders won't appear in the subquery; include them
      // explicitly when the minimum allows 0.
      const productsWithOrders = db
        .select({ id: orderItems.productId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(sql`${orders.status} <> 'cancelled'`);
      conditions.push(
        or(
          inArray(products.id, matchingIds),
          notInArray(products.id, productsWithOrders)
        )!
      );
    } else {
      conditions.push(inArray(products.id, matchingIds));
    }
  }

  if (featured === "true") {
    conditions.push(eq(products.isFeatured, true));
  }

  let orderBy;
  let trendingOrderedIds: string[] | null = null;
  switch (sort) {
    case "price-asc":
      orderBy = asc(products.price);
      break;
    case "price-desc":
      orderBy = desc(products.price);
      break;
    case "newest":
      orderBy = desc(products.createdAt);
      break;
    case "name-asc":
      orderBy = asc(products.name);
      break;
    case "trending": {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const trendingBase = and(
        eq(products.isActive, true),
        sql`${pageViews.productId} is not null`,
        gte(pageViews.createdAt, since)
      );
      const trendingRows = await db
        .select({
          productId: pageViews.productId,
          views: sql<number>`count(*)`,
        })
        .from(pageViews)
        .innerJoin(products, eq(products.id, pageViews.productId))
        .where(trendingBase)
        .groupBy(pageViews.productId)
        .orderBy(sql`count(*) desc`)
        .limit(limit);

      const trendingIds = trendingRows
        .map((r) => r.productId)
        .filter((id): id is string => !!id);

      if (trendingIds.length < limit) {
        const fillerRows = await db
          .select({ id: products.id })
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              trendingIds.length > 0
                ? sql`${products.id} not in (${sql.join(
                    trendingIds.map((id) => sql`${id}`),
                    sql`, `
                  )})`
                : sql`true`
            )
          )
          .orderBy(asc(products.name))
          .limit(limit - trendingIds.length);
        trendingOrderedIds = [...trendingIds, ...fillerRows.map((r) => r.id)];
      } else {
        trendingOrderedIds = trendingIds;
      }

      orderBy = desc(products.isFeatured);
      break;
    }
    default:
      orderBy = desc(products.isFeatured);
  }

  if (trendingOrderedIds) {
    if (trendingOrderedIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, page, totalPages: 0 });
    }
    conditions.push(inArray(products.id, trendingOrderedIds));
  }

  const where = and(...conditions);

  const [productRows, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        tags: products.tags,
        isFeatured: products.isFeatured,
        isActive: products.isActive,
        sku: products.sku,
        categoryId: products.categoryId,
        hasVariants: products.hasVariants,
        weightOz: products.weightOz,
      })
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  // Get images and categories for the products
  const productIds = productRows.map((p) => p.id);

  if (productIds.length === 0) {
    return NextResponse.json({ products: [], total: 0, page, totalPages: 0 });
  }

  const [images, cats, inventoryData, reviewData, orderedData] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, productIds),
          eq(productImages.isPrimary, true)
        )
      ),
    db.select().from(categories).where(inArray(categories.id, productRows.filter(p => p.categoryId).map(p => p.categoryId!) )),
    db.select().from(inventory).where(inArray(inventory.productId, productIds)),
    db
      .select({
        productId: reviews.productId,
        avgRating: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(and(inArray(reviews.productId, productIds), eq(reviews.isApproved, true)))
      .groupBy(reviews.productId),
    db
      .select({
        productId: orderItems.productId,
        totalOrdered: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          sql`${orders.status} <> 'cancelled'`
        )
      )
      .groupBy(orderItems.productId),
  ]);

  // Filter by tags in application layer (pg array contains is complex)
  let filteredProducts = productRows;
  if (tags && tags.length > 0) {
    filteredProducts = productRows.filter((p) =>
      tags.some((tag) => p.tags?.includes(tag))
    );
  }

  if (trendingOrderedIds) {
    const order = new Map(trendingOrderedIds.map((id, i) => [id, i]));
    filteredProducts = [...filteredProducts].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }

  const total = Number(countResult[0]?.count || 0);

  const result = filteredProducts.map((p) => {
    const image = images.find((i) => i.productId === p.id);
    const cat = cats.find((c) => c.id === p.categoryId);
    const inv = inventoryData.find((i) => i.productId === p.id);
    const rev = reviewData.find((r) => r.productId === p.id);
    const ord = orderedData.find((o) => o.productId === p.id);

    return {
      ...p,
      image: image?.url || null,
      category: cat?.name || null,
      categorySlug: cat?.slug || null,
      stock: inv?.quantity ?? 0,
      averageRating: rev ? Number(rev.avgRating) : 0,
      reviewCount: rev ? Number(rev.count) : 0,
      orderedCount: ord ? Number(ord.totalOrdered) : 0,
    };
  });

  return NextResponse.json({
    products: result,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
