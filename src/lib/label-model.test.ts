import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLabelModel, formatNetWeightLine } from "./label-model";
import { formatContainsStatement } from "./allergens";
import type { ProductNutritionRecord } from "./queries/nutrition";

const PRODUCT = { name: "Bulldog Crush Mix", slug: "bulldog-crush-mix" };

// Minimal valid nutrition record; override per test.
function mkNutrition(
  overrides: Partial<ProductNutritionRecord> = {}
): ProductNutritionRecord {
  return {
    id: "n1",
    productId: "p1",
    servingSize: null,
    servingsPerContainer: null,
    calories: null,
    totalFat: null,
    saturatedFat: null,
    transFat: null,
    cholesterol: null,
    sodium: null,
    totalCarbs: null,
    dietaryFiber: null,
    totalSugars: null,
    addedSugars: null,
    protein: null,
    ingredients: "Sugar, corn syrup, gelatin.",
    majorAllergens: [],
    crossContactNote: null,
    noMajorAllergensReviewed: false,
    labelStatementOfIdentity: null,
    netWeightOz: null,
    distributedByOverride: null,
    showNutritionPanelOnLabel: false,
    showQrOnLabel: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  } as ProductNutritionRecord;
}

// ── Statement of identity ──

test("statement of identity uses the label override when present", () => {
  const m = buildLabelModel(
    PRODUCT,
    mkNutrition({ labelStatementOfIdentity: "Gummy Bears" })
  );
  assert.equal(m.statementOfIdentity, "Gummy Bears");
});

test("statement of identity falls back to product name when override blank", () => {
  const m = buildLabelModel(
    PRODUCT,
    mkNutrition({ labelStatementOfIdentity: "   " })
  );
  assert.equal(m.statementOfIdentity, "Bulldog Crush Mix");
});

// ── Net weight ──

test("net weight renders US + metric for whole oz", () => {
  assert.equal(formatNetWeightLine("8"), "NET WT 8 OZ (227g)");
  assert.equal(formatNetWeightLine(12), "NET WT 12 OZ (340g)");
});

test("net weight supports fractional oz", () => {
  assert.equal(formatNetWeightLine("3.5"), "NET WT 3.5 OZ (99g)");
});

test("net weight is null when unset or non-positive (line omitted)", () => {
  assert.equal(formatNetWeightLine(null), null);
  assert.equal(formatNetWeightLine(""), null);
  assert.equal(formatNetWeightLine("0"), null);
  assert.equal(buildLabelModel(PRODUCT, mkNutrition()).netWeightLine, null);
});

// ── Nutrition panel on/off ──

test("nutrition panel is included only when the toggle is on", () => {
  const off = buildLabelModel(PRODUCT, mkNutrition({ showNutritionPanelOnLabel: false }));
  assert.equal(off.nutrition, null);

  const rec = mkNutrition({ showNutritionPanelOnLabel: true });
  const on = buildLabelModel(PRODUCT, rec);
  assert.equal(on.nutrition, rec);
});

// ── QR on/off ──

test("qrUrl is the nutrition page URL when enabled, null when disabled", () => {
  const on = buildLabelModel(PRODUCT, mkNutrition({ showQrOnLabel: true }));
  assert.ok(on.qrUrl);
  assert.ok(on.qrUrl!.endsWith("/products/bulldog-crush-mix/nutrition"));

  const off = buildLabelModel(PRODUCT, mkNutrition({ showQrOnLabel: false }));
  assert.equal(off.qrUrl, null);
});

// ── Delegation to the FALCPA util ──

test("contains statement is delegated to formatContainsStatement", () => {
  const allergens = [
    { allergen: "milk" as const },
    { allergen: "tree_nuts" as const, specificType: "Almonds" },
  ];
  const m = buildLabelModel(PRODUCT, mkNutrition({ majorAllergens: allergens }));
  // The assembler must produce exactly what the shared util produces — proving
  // it delegates rather than re-implementing allergen formatting.
  assert.equal(m.containsStatement, formatContainsStatement(allergens));
  assert.equal(m.containsStatement, "Contains: Milk, Tree Nuts (Almonds).");
});

test("cross-contact note stays separate and is never merged into Contains", () => {
  const m = buildLabelModel(
    PRODUCT,
    mkNutrition({
      majorAllergens: [{ allergen: "milk" as const }],
      crossContactNote: "May contain peanuts.",
    })
  );
  assert.equal(m.containsStatement, "Contains: Milk.");
  assert.equal(m.crossContactNote, "May contain peanuts.");
  assert.ok(!m.containsStatement!.includes("peanut"));
});

// ── Null record (no nutrition entered yet) ──

test("null nutrition record yields defaults (qr on, panel off, blank ingredients)", () => {
  const m = buildLabelModel(PRODUCT, null);
  assert.equal(m.ingredientsText, "");
  assert.equal(m.containsStatement, null);
  assert.equal(m.nutrition, null);
  assert.ok(m.qrUrl);
  assert.ok(m.distributedBy.startsWith("Distributed by"));
});
