import "server-only";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type CategoryWithAncestors = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  ancestors: { name: string; slug: string }[];
};

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithAncestors | null> {
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!cat || !cat.isActive) return null;

  const all = await db.select().from(categories);
  const byId = new Map(all.map((c) => [c.id, c]));
  const chain: { name: string; slug: string }[] = [];
  let cursor = cat.parentId ?? null;
  while (cursor) {
    const parent = byId.get(cursor);
    if (!parent) break;
    chain.unshift({ name: parent.name, slug: parent.slug });
    cursor = parent.parentId ?? null;
  }

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    parentId: cat.parentId,
    ancestors: chain,
  };
}
