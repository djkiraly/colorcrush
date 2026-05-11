import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { productOptionTypes, productOptionValues, productVariantOptions } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(productOptionTypes)
    .set(parsed)
    .where(eq(productOptionTypes.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Option type not found" }, { status: 404 });
  }

  return NextResponse.json({ type: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Refuse to delete if any value under this type is in use by a variant.
  const values = await db
    .select({ id: productOptionValues.id })
    .from(productOptionValues)
    .where(eq(productOptionValues.optionTypeId, id));

  if (values.length > 0) {
    const inUse = await db
      .select({ id: productVariantOptions.optionValueId })
      .from(productVariantOptions)
      .where(
        inArray(
          productVariantOptions.optionValueId,
          values.map((v) => v.id)
        )
      )
      .limit(1);
    if (inUse.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete — values under this type are used by product variants. Deactivate instead." },
        { status: 409 }
      );
    }
  }

  const result = await db
    .delete(productOptionTypes)
    .where(eq(productOptionTypes.id, id))
    .returning({ id: productOptionTypes.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Option type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
