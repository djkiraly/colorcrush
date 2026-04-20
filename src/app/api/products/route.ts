import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, categories, inventory, reviews, productCategories, orderItems, orders } from "@/lib/db/schema";
import { eq, ilike, and, gte, lte, inArray, sql, desc, asc, like } from "drizzle-orm";

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

    const { categoryIds: _ignore, ...rest } = body;
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
  const sort = searchParams.get("sort") || "featured";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const featured = searchParams.get("featured");
  const includeInactive = searchParams.get("includeInactive") === "true";
  const offset = (page - 1) * limit;

  const conditions = includeInactive ? [] : [eq(products.isActive, true)];

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (cat) {
      conditions.push(
        inArray(
          products.id,
          db
            .select({ id: productCategories.productId })
            .from(productCategories)
            .where(eq(productCategories.categoryId, cat.id))
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

  if (featured === "true") {
    conditions.push(eq(products.isFeatured, true));
  }

  let orderBy;
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
    default:
      orderBy = desc(products.isFeatured);
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
