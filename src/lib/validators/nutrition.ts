import { z } from "zod";
import { MAJOR_ALLERGENS } from "@/lib/allergens";

// Allergen keys as a non-empty tuple for z.enum.
const allergenKeys = MAJOR_ALLERGENS.map((a) => a.key) as [string, ...string[]];

// Empty string / undefined → null, so blank numeric inputs clear the value.
const blankToNull = (v: unknown) =>
  v === "" || v === null || v === undefined ? null : v;

const numField = z
  .preprocess(blankToNull, z.coerce.number().finite().nullable())
  .optional();

const intField = z
  .preprocess(blankToNull, z.coerce.number().int().finite().nullable())
  .optional();

const optionalText = z
  .preprocess(blankToNull, z.string().max(2000).nullable())
  .optional();

/**
 * Validation schema for the nutrition upsert payload. Numbers arrive from the
 * admin form as strings and are coerced here; blank fields become null. All
 * values are admin-supplied — this schema validates shape only, it does not
 * verify the data is nutritionally correct.
 */
export const nutritionSchema = z.object({
  servingSize: z
    .preprocess(blankToNull, z.string().max(255).nullable())
    .optional(),
  servingsPerContainer: z
    .preprocess(blankToNull, z.string().max(255).nullable())
    .optional(),
  calories: intField,
  totalFat: numField,
  saturatedFat: numField,
  transFat: numField,
  cholesterol: numField,
  sodium: numField,
  totalCarbs: numField,
  dietaryFiber: numField,
  totalSugars: numField,
  addedSugars: numField,
  protein: numField,
  ingredients: z.string().min(1, "Ingredients are required").max(10000),
  majorAllergens: z
    .array(
      z.object({
        allergen: z.enum(allergenKeys),
        specificType: z
          .preprocess(blankToNull, z.string().max(255).nullable())
          .optional()
          .transform((v) => v ?? undefined),
      })
    )
    .default([]),
  crossContactNote: optionalText,
  noMajorAllergensReviewed: z.boolean().default(false),
  // ── Printable retail-bag label fields ──
  labelStatementOfIdentity: z
    .preprocess(blankToNull, z.string().max(255).nullable())
    .optional(),
  netWeightOz: numField,
  distributedByOverride: optionalText,
  showNutritionPanelOnLabel: z.boolean().default(false),
  showQrOnLabel: z.boolean().default(true),
});

export type NutritionInput = z.infer<typeof nutritionSchema>;
