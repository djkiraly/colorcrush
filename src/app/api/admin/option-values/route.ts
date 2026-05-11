import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { productOptionValues } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { optionValueSchema } from "@/lib/validators/product";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const optionTypeId = request.nextUrl.searchParams.get("optionTypeId");

  const where = optionTypeId
    ? eq(productOptionValues.optionTypeId, optionTypeId)
    : undefined;

  const rows = await db
    .select()
    .from(productOptionValues)
    .where(where)
    .orderBy(asc(productOptionValues.sortOrder), asc(productOptionValues.value));

  return NextResponse.json({ values: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = optionValueSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const slug = parsed.slug || slugify(parsed.value);
  const dup = await db
    .select({ id: productOptionValues.id })
    .from(productOptionValues)
    .where(
      and(
        eq(productOptionValues.optionTypeId, parsed.optionTypeId),
        eq(productOptionValues.slug, slug)
      )
    )
    .limit(1);
  if (dup.length > 0) {
    return NextResponse.json(
      { error: `Slug "${slug}" already exists under this option type` },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(productOptionValues)
    .values({
      optionTypeId: parsed.optionTypeId,
      value: parsed.value,
      slug,
      code: parsed.code.toUpperCase(),
      swatchHex: parsed.swatchHex ?? null,
      sortOrder: parsed.sortOrder,
      isActive: parsed.isActive,
    })
    .returning();

  return NextResponse.json({ value: created });
}
