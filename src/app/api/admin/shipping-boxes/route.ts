import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { shippingBoxes } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

const boxBodySchema = z.object({
  name: z.string().min(1, "Name required"),
  lengthIn: z.number().positive("Length must be positive"),
  widthIn: z.number().positive("Width must be positive"),
  heightIn: z.number().positive("Height must be positive"),
  maxWeightOz: z.number().int().positive("Max weight must be a positive integer"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(shippingBoxes)
    .orderBy(asc(shippingBoxes.sortOrder), asc(shippingBoxes.maxWeightOz));
  return NextResponse.json({ boxes: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = boxBodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(shippingBoxes)
    .values({
      name: parsed.name,
      lengthIn: parsed.lengthIn.toFixed(2),
      widthIn: parsed.widthIn.toFixed(2),
      heightIn: parsed.heightIn.toFixed(2),
      maxWeightOz: parsed.maxWeightOz,
      isActive: parsed.isActive,
      sortOrder: parsed.sortOrder,
    })
    .returning();

  return NextResponse.json({ box: created });
}
