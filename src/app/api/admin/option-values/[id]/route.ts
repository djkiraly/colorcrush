import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { productOptionValues, productVariantOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  value: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1)
    .max(8)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and digits only")
    .optional(),
  swatchHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6,8}$/)
    .nullable()
    .optional(),
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
    .update(productOptionValues)
    .set(parsed)
    .where(eq(productOptionValues.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Option value not found" }, { status: 404 });
  }

  return NextResponse.json({ value: updated });
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

  const inUse = await db
    .select({ variantId: productVariantOptions.variantId })
    .from(productVariantOptions)
    .where(eq(productVariantOptions.optionValueId, id))
    .limit(1);
  if (inUse.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete — value is assigned to a product variant. Deactivate instead." },
      { status: 409 }
    );
  }

  const result = await db
    .delete(productOptionValues)
    .where(eq(productOptionValues.id, id))
    .returning({ id: productOptionValues.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Option value not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
