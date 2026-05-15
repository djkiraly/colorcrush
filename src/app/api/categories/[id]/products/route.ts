import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productCategories, products } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

// GET returns the current memberships plus a slim catalog of all products,
// so the admin picker dialog can render everything from a single fetch.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [memberRows, productRows] = await Promise.all([
    db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, id)),
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        isActive: products.isActive,
      })
      .from(products)
      .orderBy(asc(products.name)),
  ]);

  return NextResponse.json({
    memberIds: memberRows.map((r) => r.productId),
    products: productRows,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: categoryId } = await params;
  const body = await request.json().catch(() => null);

  const action = body?.action;
  const productIds: unknown = body?.productIds;

  if (action !== "add" && action !== "remove" && action !== "replace") {
    return NextResponse.json(
      { error: "action must be one of: add, remove, replace" },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(productIds) ||
    !productIds.every((p): p is string => typeof p === "string")
  ) {
    return NextResponse.json(
      { error: "productIds must be an array of strings" },
      { status: 400 }
    );
  }

  const ids = Array.from(new Set(productIds));

  if (action === "add") {
    if (ids.length === 0) return NextResponse.json({ added: 0 });
    // onConflictDoNothing keeps this idempotent against the (productId, categoryId) PK.
    await db
      .insert(productCategories)
      .values(ids.map((productId) => ({ productId, categoryId })))
      .onConflictDoNothing();
    return NextResponse.json({ added: ids.length });
  }

  if (action === "remove") {
    if (ids.length === 0) return NextResponse.json({ removed: 0 });
    await db
      .delete(productCategories)
      .where(
        and(
          eq(productCategories.categoryId, categoryId),
          inArray(productCategories.productId, ids)
        )
      );
    return NextResponse.json({ removed: ids.length });
  }

  // replace: drop all current memberships for this category, then insert the new set
  await db
    .delete(productCategories)
    .where(eq(productCategories.categoryId, categoryId));
  if (ids.length > 0) {
    await db
      .insert(productCategories)
      .values(ids.map((productId) => ({ productId, categoryId })))
      .onConflictDoNothing();
  }
  return NextResponse.json({ replaced: ids.length });
}
