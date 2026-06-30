import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { products, productNutrition } from "@/lib/db/schema";
import { nutritionSchema } from "@/lib/validators/nutrition";

type RouteContext = { params: Promise<{ id: string }> };

// numeric() columns round-trip as strings in Drizzle; convert validated numbers.
const numStr = (n: number | null | undefined) =>
  n === null || n === undefined ? null : String(n);

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select()
    .from(productNutrition)
    .where(eq(productNutrition.productId, id))
    .limit(1);

  return NextResponse.json({ nutrition: row ?? null });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let data;
  try {
    data = nutritionSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

  // Shared column values for both insert and the on-conflict update.
  const columns = {
    servingSize: data.servingSize ?? null,
    servingsPerContainer: data.servingsPerContainer ?? null,
    calories: data.calories ?? null,
    totalFat: numStr(data.totalFat),
    saturatedFat: numStr(data.saturatedFat),
    transFat: numStr(data.transFat),
    cholesterol: numStr(data.cholesterol),
    sodium: numStr(data.sodium),
    totalCarbs: numStr(data.totalCarbs),
    dietaryFiber: numStr(data.dietaryFiber),
    totalSugars: numStr(data.totalSugars),
    addedSugars: numStr(data.addedSugars),
    protein: numStr(data.protein),
    ingredients: data.ingredients,
    majorAllergens: data.majorAllergens,
    crossContactNote: data.crossContactNote ?? null,
    noMajorAllergensReviewed: data.noMajorAllergensReviewed,
  };

  const [row] = await db
    .insert(productNutrition)
    .values({ productId: id, ...columns })
    .onConflictDoUpdate({
      target: productNutrition.productId,
      set: { ...columns, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ nutrition: row });
}
