import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

type BulkUpdate = {
  id: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: BulkUpdate[] = Array.isArray(body?.updates) ? body.updates : [];

  if (updates.length === 0) {
    return NextResponse.json({ error: "No updates supplied" }, { status: 400 });
  }

  let updatedCount = 0;
  const errors: { id: string; error: string }[] = [];

  for (const item of updates) {
    if (!item?.id) continue;

    const patch: Record<string, unknown> = {};
    if (typeof item.name === "string") {
      const name = item.name.trim();
      if (!name) {
        errors.push({ id: item.id, error: "Name cannot be empty" });
        continue;
      }
      patch.name = name;
    }
    if (typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)) {
      patch.sortOrder = Math.trunc(item.sortOrder);
    }
    if (typeof item.isActive === "boolean") {
      patch.isActive = item.isActive;
    }

    if (Object.keys(patch).length === 0) continue;

    try {
      await db.update(categories).set(patch).where(eq(categories.id, item.id));
      updatedCount++;
    } catch (err) {
      // Most likely a unique-name conflict. Surface per-row so the rest still apply.
      const message = err instanceof Error ? err.message : "Update failed";
      errors.push({ id: item.id, error: message });
    }
  }

  return NextResponse.json({ success: true, updatedCount, errors });
}
