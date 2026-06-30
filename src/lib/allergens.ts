/**
 * FALCPA allergen DISPLAY-FORMATTING helpers.
 *
 * These functions format admin-supplied allergen data for public display in the
 * style the Food Allergen Labeling and Consumer Protection Act (FALCPA)
 * prescribes for the "Contains" statement. They are presentation helpers only:
 * they DO NOT verify regulatory compliance, validate or correct manufacturer
 * data, or constitute legal/regulatory advice. All inputs are admin-entered and
 * are rendered verbatim aside from the formatting rules applied here.
 */

/**
 * The nine major allergens whose declaration FALCPA mandates. This is the
 * canonical, closed set the admin selects from via checkboxes — the major
 * allergen set is never free-typed, so declarations stay consistent.
 *
 * `key` is the stable value persisted in the database; `label` is the
 * capitalized food-source name rendered in the public "Contains" statement.
 * Soybeans render as "Soy" to match the FALCPA worked example
 * (`Contains: Milk, Soy, Wheat.`); both forms are acceptable food-source names.
 */
export const MAJOR_ALLERGENS = [
  { key: "milk", label: "Milk" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "crustacean_shellfish", label: "Crustacean Shellfish" },
  { key: "tree_nuts", label: "Tree Nuts" },
  { key: "peanuts", label: "Peanuts" },
  { key: "wheat", label: "Wheat" },
  { key: "soybeans", label: "Soy" },
  { key: "sesame", label: "Sesame" },
] as const;

export type MajorAllergenKey = (typeof MAJOR_ALLERGENS)[number]["key"];

/** A single declared allergen, optionally naming the specific species/type. */
export interface AllergenDeclaration {
  allergen: MajorAllergenKey;
  /**
   * Optional specific species/type. FALCPA wants the specific type named for
   * tree nuts, fish, and Crustacean shellfish (e.g. "Almonds", "Cod"); rendered
   * in parentheses after the allergen label.
   */
  specificType?: string;
}

/** Set of valid allergen keys for quick membership checks. */
const ALLERGEN_KEYS = new Set<string>(MAJOR_ALLERGENS.map((a) => a.key));

/** key → capitalized display label. */
const ALLERGEN_LABELS: Record<string, string> = Object.fromEntries(
  MAJOR_ALLERGENS.map((a) => [a.key, a.label])
);

/**
 * Lowercased substrings searched for inside the ingredients text when checking
 * whether a declared allergen is reflected there (soft validation only). Each
 * list is intentionally permissive — a match on any term clears the warning.
 */
const ALLERGEN_INGREDIENT_TERMS: Record<MajorAllergenKey, string[]> = {
  milk: ["milk", "dairy", "lactose", "whey", "casein", "butter", "cream", "cheese"],
  eggs: ["egg"],
  fish: ["fish", "cod", "tuna", "salmon", "anchovy", "pollock"],
  crustacean_shellfish: [
    "shellfish",
    "crustacean",
    "shrimp",
    "crab",
    "lobster",
    "prawn",
    "crayfish",
  ],
  tree_nuts: [
    "nut",
    "almond",
    "walnut",
    "pecan",
    "cashew",
    "pistachio",
    "hazelnut",
    "macadamia",
    "brazil",
    "pine nut",
  ],
  peanuts: ["peanut"],
  wheat: ["wheat", "flour", "gluten", "semolina", "spelt", "farina"],
  soybeans: ["soy", "soya", "edamame"],
  sesame: ["sesame", "tahini"],
};

/** Render a single declaration as e.g. "Tree Nuts (Almonds)" or "Milk". */
function renderAllergen(declaration: AllergenDeclaration): string {
  const label = ALLERGEN_LABELS[declaration.allergen];
  const specific = declaration.specificType?.trim();
  return specific ? `${label} (${specific})` : label;
}

/**
 * Build the FALCPA "Contains" statement from a list of declared allergens.
 *
 * Returns a single statement of the form `Contains: Milk, Soy, Wheat.` —
 * leading word "Contains", a colon, the comma-separated allergen names in the
 * order supplied, and a trailing period. Each name uses the capitalized
 * food-source label, with any specific type in parentheses.
 *
 * Returns `null` when no valid major allergens are present (render nothing).
 * Advisory / "may contain" cross-contact warnings are NOT part of this
 * statement and must be rendered separately.
 */
export function formatContainsStatement(
  allergens: AllergenDeclaration[] | null | undefined
): string | null {
  if (!allergens || allergens.length === 0) return null;

  const valid = allergens.filter((a) => ALLERGEN_KEYS.has(a.allergen));
  if (valid.length === 0) return null;

  const names = valid.map(renderAllergen);
  return `Contains: ${names.join(", ")}.`;
}

/**
 * Soft, NON-BLOCKING validation for the admin UI: returns a warning for each
 * declared allergen whose food-source name does not appear anywhere in the
 * ingredients text. FALCPA requires declared allergens to be reflected in the
 * ingredients, but because the admin pastes manufacturer data verbatim we only
 * surface a hint — we never block or rewrite the input.
 *
 * Returns an empty array when there is nothing to warn about.
 */
export function validateAllergensAgainstIngredients(
  allergens: AllergenDeclaration[] | null | undefined,
  ingredientsText: string | null | undefined
): string[] {
  if (!allergens || allergens.length === 0) return [];

  const haystack = (ingredientsText ?? "").toLowerCase();
  const warnings: string[] = [];

  for (const declaration of allergens) {
    if (!ALLERGEN_KEYS.has(declaration.allergen)) continue;

    const terms = ALLERGEN_INGREDIENT_TERMS[declaration.allergen] ?? [];
    const specific = declaration.specificType?.trim().toLowerCase();
    const searchTerms = specific ? [...terms, specific] : terms;

    const found =
      haystack.length > 0 && searchTerms.some((t) => haystack.includes(t));

    if (!found) {
      const label = ALLERGEN_LABELS[declaration.allergen];
      warnings.push(
        `"${label}" is declared as an allergen but does not appear in the ingredients list. FALCPA requires declared allergens to be reflected in the ingredients — double-check the ingredients text.`
      );
    }
  }

  return warnings;
}
