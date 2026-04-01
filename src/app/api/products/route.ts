import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, categories, inventory, reviews } from "@/lib/db/schema";
import { eq, ilike, and, gte, lte, inArray, sql, desc, asc } from "drizzle-orm";

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
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];

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
      conditions.push(eq(products.categoryId, cat.id));
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

  const [images, cats, inventoryData, reviewData] = await Promise.all([
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

    return {
      ...p,
      image: image?.url || null,
      category: cat?.name || null,
      categorySlug: cat?.slug || null,
      stock: inv?.quantity ?? 0,
      averageRating: rev ? Number(rev.avgRating) : 0,
      reviewCount: rev ? Number(rev.count) : 0,
    };
  });

  return NextResponse.json({
    products: result,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
