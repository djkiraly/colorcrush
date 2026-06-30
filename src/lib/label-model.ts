import {
  formatContainsStatement,
  type AllergenDeclaration,
} from "@/lib/allergens";
import { absoluteUrl } from "@/lib/site-url";
import { siteConfig } from "../../site.config";
import type { ProductNutritionRecord } from "@/lib/queries/nutrition";

/**
 * Pure assembler that resolves a product + its nutrition record into a
 * fully-prepared model for the printable retail-bag label. No DB or React here.
 *
 * Allergen formatting is delegated to the FALCPA utility (formatContainsStatement)
 * — this module never re-implements allergen rendering. The cross-contact note
 * is kept separate from the Contains statement and is never merged into it.
 */

// The FDA panel component consumes the raw nutrition record, so the panel model
// is just that record (or null when the panel is disabled for the label).
export type NutritionPanelModel = ProductNutritionRecord;

export interface LabelModel {
  statementOfIdentity: string;
  netWeightLine: string | null;
  ingredientsText: string;
  containsStatement: string | null;
  crossContactNote: string | null;
  distributedBy: string;
  nutrition: NutritionPanelModel | null;
  qrUrl: string | null;
}

/** Resolve the "Distributed by" block: per-product override, else site default. */
export function resolveDistributedBy(override?: string | null): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  const b = siteConfig.business;
  return `Distributed by ${b.legalName} · ${b.city}, ${b.state} ${b.zip}`;
}

/**
 * Format the net-weight line as `NET WT {oz} OZ ({grams}g)`, deriving grams via
 * `round(oz * 28.3495)`. Returns null when no positive weight is set so the
 * renderer can omit the line entirely (never prints `NET WT OZ ()`).
 */
export function formatNetWeightLine(
  netWeightOz: string | number | null | undefined
): string | null {
  if (netWeightOz === null || netWeightOz === undefined || netWeightOz === "")
    return null;
  const oz =
    typeof netWeightOz === "number" ? netWeightOz : parseFloat(netWeightOz);
  if (!Number.isFinite(oz) || oz <= 0) return null;
  const grams = Math.round(oz * 28.3495);
  const ozDisplay = Number(oz.toFixed(2)).toString(); // 8.00 → "8", 3.50 → "3.5"
  return `NET WT ${ozDisplay} OZ (${grams}g)`;
}

export function buildLabelModel(
  product: { name: string; slug: string },
  nutrition: ProductNutritionRecord | null
): LabelModel {
  // With no record yet, fall back to the column defaults (QR on, panel off).
  const showQr = nutrition ? nutrition.showQrOnLabel : true;
  const showPanel = nutrition ? nutrition.showNutritionPanelOnLabel : false;

  const statementOfIdentity =
    nutrition?.labelStatementOfIdentity?.trim() || product.name;

  return {
    statementOfIdentity,
    netWeightLine: formatNetWeightLine(nutrition?.netWeightOz ?? null),
    ingredientsText: nutrition?.ingredients ?? "",
    containsStatement: nutrition
      ? formatContainsStatement(
          nutrition.majorAllergens as AllergenDeclaration[]
        )
      : null,
    crossContactNote: nutrition?.crossContactNote?.trim() || null,
    distributedBy: resolveDistributedBy(nutrition?.distributedByOverride),
    nutrition: showPanel ? nutrition : null,
    qrUrl: showQr ? absoluteUrl(`/products/${product.slug}/nutrition`) : null,
  };
}
