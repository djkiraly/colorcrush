import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  inventory,
  productOptionTypes,
  productOptionValues,
  productVariantOptions,
  productVariants,
  products,
} from "@/lib/db/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { variantMatrixRequestSchema } from "@/lib/validators/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;

  const [variants, optionRows] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.sku)),
    db
      .select({
        variantId: productVariantOptions.variantId,
        optionValueId: productOptionValues.id,
        value: productOptionValues.value,
        code: productOptionValues.code,
        swatchHex: productOptionValues.swatchHex,
        optionTypeId: productOptionTypes.id,
        optionTypeName: productOptionTypes.name,
        optionTypeSlug: productOptionTypes.slug,
        optionTypeSortOrder: productOptionTypes.sortOrder,
      })
      .from(productVariantOptions)
      .innerJoin(
        productOptionValues,
        eq(productVariantOptions.optionValueId, productOptionValues.id)
      )
      .innerJoin(
        productOptionTypes,
        eq(productOptionValues.optionTypeId, productOptionTypes.id)
      )
      .where(
        inArray(
          productVariantOptions.variantId,
          db
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(eq(productVariants.productId, productId))
        )
      ),
  ]);

  if (variants.length === 0) {
    return NextResponse.json({ variants: [] });
  }

  const inventories = await db
    .select()
    .from(inventory)
    .where(
      inArray(
        inventory.variantId,
        variants.map((v) => v.id)
      )
    );

  const optsByVariant = new Map<string, typeof optionRows>();
  for (const row of optionRows) {
    const arr = optsByVariant.get(row.variantId) ?? [];
    arr.push(row);
    optsByVariant.set(row.variantId, arr);
  }

  const invByVariant = new Map(inventories.map((i) => [i.variantId!, i]));

  const result = variants.map((v) => ({
    ...v,
    options: (optsByVariant.get(v.id) ?? []).sort(
      (a, b) =>
        a.optionTypeSortOrder - b.optionTypeSortOrder ||
        a.optionTypeName.localeCompare(b.optionTypeName)
    ),
    inventory: invByVariant.get(v.id) ?? null,
  }));

  return NextResponse.json({ variants: result });
}

// Generate full Cartesian matrix of variants from selected option values.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;

  let parsed;
  try {
    parsed = variantMatrixRequestSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }

  // Load parent product (need SKU for variant SKU generation)
  const [product] = await db
    .select({ id: products.id, sku: products.sku })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Collect option types in their global sort order so SKU codes are joined consistently.
  const typeIds = Object.keys(parsed.optionValueIdsByType);
  if (typeIds.length === 0) {
    return NextResponse.json({ error: "Pick at least one option type" }, { status: 400 });
  }
  const types = await db
    .select()
    .from(productOptionTypes)
    .where(inArray(productOptionTypes.id, typeIds))
    .orderBy(asc(productOptionTypes.sortOrder), asc(productOptionTypes.name));

  const allValueIds = Object.values(parsed.optionValueIdsByType).flat();
  if (allValueIds.length === 0) {
    return NextResponse.json({ error: "Pick at least one option value" }, { status: 400 });
  }
  const valueRows = await db
    .select()
    .from(productOptionValues)
    .where(inArray(productOptionValues.id, allValueIds));
  const valueById = new Map(valueRows.map((v) => [v.id, v]));

  // Identify existing variants for this product so we don't double-insert combinations.
  const existing = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
  const existingOpts =
    existing.length > 0
      ? await db
          .select()
          .from(productVariantOptions)
          .where(
            inArray(
              productVariantOptions.variantId,
              existing.map((e) => e.id)
            )
          )
      : [];
  const existingComboKeys = new Set<string>();
  const existingByVariant = new Map<string, string[]>();
  for (const opt of existingOpts) {
    const arr = existingByVariant.get(opt.variantId) ?? [];
    arr.push(opt.optionValueId);
    existingByVariant.set(opt.variantId, arr);
  }
  for (const ids of existingByVariant.values()) {
    existingComboKeys.add([...ids].sort().join("|"));
  }

  // Cartesian product across the selected types (in type sort order).
  const orderedValueGroups = types.map((t) => parsed.optionValueIdsByType[t.id] || []);
  if (orderedValueGroups.some((g) => g.length === 0)) {
    return NextResponse.json(
      { error: "Each selected option type must have at least one value" },
      { status: 400 }
    );
  }

  const combos: string[][] = [[]];
  for (const group of orderedValueGroups) {
    const next: string[][] = [];
    for (const prefix of combos) {
      for (const valueId of group) {
        next.push([...prefix, valueId]);
      }
    }
    combos.length = 0;
    combos.push(...next);
  }

  const createdVariants: { id: string; sku: string }[] = [];
  for (const combo of combos) {
    const comboKey = [...combo].sort().join("|");
    if (existingComboKeys.has(comboKey)) continue;

    const codes = combo
      .map((id) => valueById.get(id)?.code)
      .filter((c): c is string => !!c);
    const sku = await generateVariantSku(product.sku, codes);

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku,
      })
      .returning();

    await db.insert(productVariantOptions).values(
      combo.map((optionValueId) => ({
        variantId: variant.id,
        optionValueId,
      }))
    );

    await db.insert(inventory).values({
      productId,
      variantId: variant.id,
      quantity: 0,
    });

    createdVariants.push({ id: variant.id, sku: variant.sku });
  }

  // Flip the product's hasVariants flag if it isn't already on.
  if (createdVariants.length > 0) {
    await db
      .update(products)
      .set({ hasVariants: true, updatedAt: new Date() })
      .where(eq(products.id, productId));
  }

  return NextResponse.json({ created: createdVariants });
}

async function generateVariantSku(parentSku: string, codes: string[]): Promise<string> {
  if (codes.length === 0) return `${parentSku}-V01`;
  const base = `${parentSku}-${codes.join("-")}`;
  // If base is unique, use as-is. Otherwise append -2, -3, ...
  const existing = await db
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(sql`${productVariants.sku} like ${base + "%"}`);
  const used = new Set(existing.map((r) => r.sku));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
