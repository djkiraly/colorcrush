import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

type CategoryRow = typeof categories.$inferSelect;
type CategoryNode = CategoryRow & { children: CategoryNode[] };

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [category] = await db.insert(categories).values(body).returning();
  return NextResponse.json(category);
}

export async function GET(request: NextRequest) {
  const tree = request.nextUrl.searchParams.get("tree") === "true";

  const allCategories = await db
    .select()
    .from(categories)
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
