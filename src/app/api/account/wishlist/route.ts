import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  wishlists,
  products,
  productImages,
  inventory,
} from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth-helpers";

type SessionUser = { id?: string; isGuest?: boolean };

async function requireRealUser() {
  const session = await getAuthSession();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    return { error: "Sign in to manage your wishlist", status: 401 as const };
  }
  if (user.isGuest) {
    return {
      error: "Create an account to save favorites to your wishlist",
      status: 403 as const,
    };
  }
  return { userId: user.id };
}

export async function GET() {
  const auth = await requireRealUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Pull wishlist rows joined to active products only. Inactive products are
  // filtered out so the wishlist UI doesn't surface unsellable items.
  const rows = await db
    .select({
      id: wishlists.id,
      createdAt: wishlists.createdAt,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isActive: products.isActive,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(and(eq(wishlists.userId, auth.userId), eq(products.isActive, true)))
    .orderBy(desc(wishlists.createdAt));

  const productIds = rows.map((r) => r.productId);
  const [images, invRows] = await Promise.all([
    productIds.length
      ? db
          .select()
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true)
            )
          )
      : Promise.resolve([] as (typeof productImages.$inferSelect)[]),
    productIds.length
      ? db.select().from(inventory).where(inArray(inventory.productId, productIds))
      : Promise.resolve([] as (typeof inventory.$inferSelect)[]),
  ]);
  const imageByProduct = new Map(images.map((i) => [i.productId, i.url]));
  const stockByProduct = new Map<string, number>();
  for (const i of invRows) {
    stockByProduct.set(i.productId, (stockByProduct.get(i.productId) ?? 0) + i.quantity);
  }

  const items = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    name: r.name,
    slug: r.slug,
    price: r.price,
    compareAtPrice: r.compareAtPrice,
    image: imageByProduct.get(r.productId) ?? null,
    inStock: (stockByProduct.get(r.productId) ?? 0) > 0,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireRealUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  if (typeof productId !== "string" || productId.length === 0) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  // Confirm the product exists + is active before saving — avoids accumulating
  // dangling rows from stale links / scraping.
  const [product] = await db
    .select({ id: products.id, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Idempotent: if it's already in the wishlist, just return success.
  const [existing] = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, auth.userId), eq(wishlists.productId, productId)))
    .limit(1);
  if (existing) {
    return NextResponse.json({ added: false, id: existing.id });
  }

  const [created] = await db
    .insert(wishlists)
    .values({ userId: auth.userId, productId })
    .returning({ id: wishlists.id });

  return NextResponse.json({ added: true, id: created.id });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRealUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { error: "productId query param required" },
      { status: 400 }
    );
  }

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, auth.userId), eq(wishlists.productId, productId)));

  return NextResponse.json({ success: true });
}
