import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAJOR_ALLERGENS,
  formatContainsStatement,
  validateAllergensAgainstIngredients,
} from "./allergens";

// ── MAJOR_ALLERGENS canonical list ──────────────────────────────────────────

test("MAJOR_ALLERGENS contains exactly the nine FALCPA major allergens", () => {
  assert.equal(MAJOR_ALLERGENS.length, 9);
  const keys = MAJOR_ALLERGENS.map((a) => a.key);
  assert.deepEqual(keys, [
    "milk",
    "eggs",
    "fish",
    "crustacean_shellfish",
    "tree_nuts",
    "peanuts",
    "wheat",
    "soybeans",
    "sesame",
  ]);
});

// ── formatContainsStatement ──────────────────────────────────────────────────

test("single allergen renders with leading word, colon, and trailing period", () => {
  assert.equal(
    formatContainsStatement([{ allergen: "milk" }]),
    "Contains: Milk."
  );
});

test("multiple allergens are comma-separated in supplied order (matches FALCPA example)", () => {
  assert.equal(
    formatContainsStatement([
      { allergen: "milk" },
      { allergen: "soybeans" },
      { allergen: "wheat" },
    ]),
    "Contains: Milk, Soy, Wheat."
  );
});

test("specific type is rendered in parentheses after the allergen name", () => {
  assert.equal(
    formatContainsStatement([
      { allergen: "tree_nuts", specificType: "Almonds" },
      { allergen: "fish", specificType: "Cod" },
    ]),
    "Contains: Tree Nuts (Almonds), Fish (Cod)."
  );
});

test("blank/whitespace specific type is ignored (no empty parentheses)", () => {
  assert.equal(
    formatContainsStatement([{ allergen: "fish", specificType: "   " }]),
    "Contains: Fish."
  );
});

test("empty list returns null (render nothing)", () => {
  assert.equal(formatContainsStatement([]), null);
});

test("null/undefined input returns null", () => {
  assert.equal(formatContainsStatement(null), null);
  assert.equal(formatContainsStatement(undefined), null);
});

test("unknown allergen keys are filtered out", () => {
  assert.equal(
    formatContainsStatement([
      // @ts-expect-error — intentionally invalid key
      { allergen: "gluten" },
      { allergen: "milk" },
    ]),
    "Contains: Milk."
  );
  assert.equal(
    // @ts-expect-error — intentionally invalid key only
    formatContainsStatement([{ allergen: "gluten" }]),
    null
  );
});

test("capitalization uses the canonical food-source label", () => {
  assert.equal(
    formatContainsStatement([
      { allergen: "soybeans" },
      { allergen: "crustacean_shellfish" },
    ]),
    "Contains: Soy, Crustacean Shellfish."
  );
});

// ── validateAllergensAgainstIngredients ──────────────────────────────────────

test("no warnings when every declared allergen appears in ingredients", () => {
  const warnings = validateAllergensAgainstIngredients(
    [{ allergen: "milk" }, { allergen: "soybeans" }],
    "Sugar, milk powder, soy lecithin, natural flavors"
  );
  assert.deepEqual(warnings, []);
});

test("warns when a declared allergen is missing from ingredients", () => {
  const warnings = validateAllergensAgainstIngredients(
    [{ allergen: "peanuts" }],
    "Sugar, corn syrup, citric acid"
  );
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"Peanuts"/);
  assert.match(warnings[0], /FALCPA/);
});

test("matching is case-insensitive and uses synonyms", () => {
  const warnings = validateAllergensAgainstIngredients(
    [{ allergen: "milk" }, { allergen: "wheat" }],
    "WHEAT FLOUR, WHEY (MILK), SUGAR"
  );
  assert.deepEqual(warnings, []);
});

test("specific type counts as a match against ingredients", () => {
  const warnings = validateAllergensAgainstIngredients(
    [{ allergen: "tree_nuts", specificType: "pistachio" }],
    "Sugar, roasted pistachio, sea salt"
  );
  assert.deepEqual(warnings, []);
});

test("empty allergen list yields no warnings", () => {
  assert.deepEqual(validateAllergensAgainstIngredients([], "anything"), []);
});

test("empty ingredients text warns for each declared allergen", () => {
  const warnings = validateAllergensAgainstIngredients(
    [{ allergen: "milk" }, { allergen: "eggs" }],
    ""
  );
  assert.equal(warnings.length, 2);
});
