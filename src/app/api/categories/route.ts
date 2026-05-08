import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

type CategoryRow = typeof categories.$inferSelect;
type CategoryNode = CategoryRow & { children: CategoryNode[] };

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [category] = await db.insert(categories).values(body).returning();
  return NextResponse.json(category);
}

export async function GET(request: NextRequest) {
  const tree = request.nextUrl.searchParams.get("tree") === "true";
  const wantsAll = request.nextUrl.searchParams.get("all") === "true";

  // `?all=true` returns inactive categories too. Gated to admins so the storefront
  // (which uses the same endpoint without the flag) can't accidentally leak them.
  let includeInactive = false;
  if (wantsAll) {
    const session = await getAuthSession();
    if (isAdmin(session)) includeInactive = true;
  }

  const baseQuery = db.select().from(categories);
  const allCategories = includeInactive
    ? await baseQuery.orderBy(asc(categories.sortOrder))
    : await baseQuery
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));

  if (!tree) {
    return NextResponse.json({ categories: allCategories });
  }

  const byId = new Map<string, CategoryNode>();
  for (const c of allCategories) byId.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return NextResponse.json({ categories: roots });
}
