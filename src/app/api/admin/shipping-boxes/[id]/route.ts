import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { shippingBoxes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  lengthIn: z.number().positive().optional(),
  widthIn: z.number().positive().optional(),
  heightIn: z.number().positive().optional(),
  maxWeightOz: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.name !== undefined) updateValues.name = parsed.name;
  if (parsed.lengthIn !== undefined) updateValues.lengthIn = parsed.lengthIn.toFixed(2);
  if (parsed.widthIn !== undefined) updateValues.widthIn = parsed.widthIn.toFixed(2);
  if (parsed.heightIn !== undefined) updateValues.heightIn = parsed.heightIn.toFixed(2);
  if (parsed.maxWeightOz !== undefined) updateValues.maxWeightOz = parsed.maxWeightOz;
  if (parsed.isActive !== undefined) updateValues.isActive = parsed.isActive;
  if (parsed.sortOrder !== undefined) updateValues.sortOrder = parsed.sortOrder;

  const [updated] = await db
    .update(shippingBoxes)
    .set(updateValues)
    .where(eq(shippingBoxes.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Box not found" }, { status: 404 });
  }

  return NextResponse.json({ box: updated });
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

  const result = await db
    .delete(shippingBoxes)
    .where(eq(shippingBoxes.id, id))
    .returning({ id: shippingBoxes.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Box not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
