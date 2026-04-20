import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.parentId) {
    if (body.parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
    }
    // Walk up from the candidate parent; if we hit `id`, it's a cycle.
    let cursor: string | null = body.parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === id) {
        return NextResponse.json({ error: "Parent assignment would create a cycle" }, { status: 400 });
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const [row] = await db
        .select({ parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, cursor))
        .limit(1);
      cursor = row?.parentId ?? null;
    }
  }

  const [updated] = await db
    .update(categories)
    .set(body)
    .where(eq(categories.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
