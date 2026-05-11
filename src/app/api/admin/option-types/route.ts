import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { productOptionTypes, productOptionValues } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { optionTypeSchema } from "@/lib/validators/product";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [types, values] = await Promise.all([
    db
      .select()
      .from(productOptionTypes)
      .orderBy(asc(productOptionTypes.sortOrder), asc(productOptionTypes.name)),
    db
      .select()
      .from(productOptionValues)
      .orderBy(
        asc(productOptionValues.sortOrder),
        asc(productOptionValues.value)
      ),
  ]);

  const valuesByType = new Map<string, typeof values>();
  for (const v of values) {
    const arr = valuesByType.get(v.optionTypeId) ?? [];
    arr.push(v);
    valuesByType.set(v.optionTypeId, arr);
  }

  return NextResponse.json({
    types: types.map((t) => ({ ...t, values: valuesByType.get(t.id) ?? [] })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = optionTypeSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const slug = parsed.slug || slugify(parsed.name);
  const existing = await db
    .select({ id: productOptionTypes.id })
    .from(productOptionTypes)
    .where(eq(productOptionTypes.slug, slug))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: `Slug "${slug}" already in use` },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(productOptionTypes)
    .values({
      name: parsed.name,
      slug,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
    })
    .returning();

  return NextResponse.json({ type: created });
}
