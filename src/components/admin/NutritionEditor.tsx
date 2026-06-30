"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  MAJOR_ALLERGENS,
  formatContainsStatement,
  validateAllergensAgainstIngredients,
  type AllergenDeclaration,
  type MajorAllergenKey,
} from "@/lib/allergens";
import {
  formatNetWeightLine,
  resolveDistributedBy,
} from "@/lib/label-model";
import type { ProductNutritionRecord } from "@/lib/queries/nutrition";

type ProductSummary = { id: string; name: string; slug: string };

type AllergenState = Record<
  string,
  { checked: boolean; specificType: string }
>;

// Numeric nutrient fields with their display label and unit hint.
const NUTRIENT_FIELDS: {
  key: keyof ProductNutritionRecord;
  label: string;
  unit: string;
  integer?: boolean;
}[] = [
  { key: "calories", label: "Calories", unit: "", integer: true },
  { key: "totalFat", label: "Total Fat", unit: "g" },
  { key: "saturatedFat", label: "Saturated Fat", unit: "g" },
  { key: "transFat", label: "Trans Fat", unit: "g" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "totalCarbs", label: "Total Carbohydrate", unit: "g" },
  { key: "dietaryFiber", label: "Dietary Fiber", unit: "g" },
  { key: "totalSugars", label: "Total Sugars", unit: "g" },
  { key: "addedSugars", label: "Added Sugars", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
];

function initAllergenState(
  declared: { allergen: string; specificType?: string }[] | null | undefined
): AllergenState {
  const byKey = new Map(
    (declared ?? []).map((d) => [d.allergen, d.specificType ?? ""])
  );
  const state: AllergenState = {};
  for (const a of MAJOR_ALLERGENS) {
    state[a.key] = {
      checked: byKey.has(a.key),
      specificType: byKey.get(a.key) ?? "",
    };
  }
  return state;
}

export function NutritionEditor({
  product,
  initialNutrition,
}: {
  product: ProductSummary;
  initialNutrition: ProductNutritionRecord | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [text, setText] = useState({
    servingSize: initialNutrition?.servingSize ?? "",
    servingsPerContainer: initialNutrition?.servingsPerContainer ?? "",
    ingredients: initialNutrition?.ingredients ?? "",
    crossContactNote: initialNutrition?.crossContactNote ?? "",
    labelStatementOfIdentity: initialNutrition?.labelStatementOfIdentity ?? "",
    distributedByOverride: initialNutrition?.distributedByOverride ?? "",
    netWeightOz:
      initialNutrition?.netWeightOz != null
        ? String(Number(initialNutrition.netWeightOz))
        : "",
  });
  const [showNutritionPanelOnLabel, setShowNutritionPanelOnLabel] = useState(
    initialNutrition?.showNutritionPanelOnLabel ?? false
  );
  const [showQrOnLabel, setShowQrOnLabel] = useState(
    initialNutrition?.showQrOnLabel ?? true
  );

  const [nutrients, setNutrients] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of NUTRIENT_FIELDS) {
      const v = initialNutrition?.[f.key];
      init[f.key as string] = v === null || v === undefined ? "" : String(v);
    }
    return init;
  });

  const [allergens, setAllergens] = useState<AllergenState>(() =>
    initAllergenState(initialNutrition?.majorAllergens)
  );
  const [noMajorAllergensReviewed, setNoMajorAllergensReviewed] = useState(
    initialNutrition?.noMajorAllergensReviewed ?? false
  );

  // Derived declarations for preview + validation.
  const declarations = useMemo<AllergenDeclaration[]>(() => {
    return MAJOR_ALLERGENS.filter((a) => allergens[a.key]?.checked).map((a) => {
      const specific = allergens[a.key].specificType.trim();
      return {
        allergen: a.key as MajorAllergenKey,
        ...(specific ? { specificType: specific } : {}),
      };
    });
  }, [allergens]);

  const containsStatement = useMemo(
    () => formatContainsStatement(declarations),
    [declarations]
  );

  const warnings = useMemo(
    () => validateAllergensAgainstIngredients(declarations, text.ingredients),
    [declarations, text.ingredients]
  );

  // Live label-field derivations (cheap — recompute each render).
  const netWeightPreview = formatNetWeightLine(text.netWeightOz);
  const defaultDistributedBy = resolveDistributedBy(null);
  const checklist = [
    {
      label: "Statement of identity",
      ok: Boolean(text.labelStatementOfIdentity.trim() || product.name),
    },
    { label: "Net weight", ok: netWeightPreview !== null },
    { label: "Ingredients", ok: text.ingredients.trim().length > 0 },
    {
      label: "Allergen review done",
      ok: declarations.length > 0 || noMajorAllergensReviewed,
    },
  ];

  function toggleAllergen(key: string, checked: boolean) {
    setAllergens((prev) => ({
      ...prev,
      [key]: { ...prev[key], checked },
    }));
  }

  function setSpecificType(key: string, value: string) {
    setAllergens((prev) => ({
      ...prev,
      [key]: { ...prev[key], specificType: value },
    }));
  }

  async function handleSave() {
    if (!text.ingredients.trim()) {
      toast.error("Ingredients are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        servingSize: text.servingSize,
        servingsPerContainer: text.servingsPerContainer,
        ingredients: text.ingredients,
        crossContactNote: text.crossContactNote,
        noMajorAllergensReviewed,
        majorAllergens: declarations,
        labelStatementOfIdentity: text.labelStatementOfIdentity,
        distributedByOverride: text.distributedByOverride,
        netWeightOz: text.netWeightOz,
        showNutritionPanelOnLabel,
        showQrOnLabel,
        ...Object.fromEntries(
          NUTRIENT_FIELDS.map((f) => [f.key, nutrients[f.key as string]])
        ),
      };
      const res = await fetch(
        `/api/admin/products/${product.id}/nutrition`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        toast.success("Nutrition information saved.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save nutrition information.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Nutrition & Allergens
        </h1>
        <p className="text-sm text-brand-text-secondary mt-1">
          {product.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* ── Editor column ── */}
        <div className="space-y-6">
          {/* Serving + nutrients */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-heading font-semibold text-brand-secondary">
              Nutrition Facts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serving Size</Label>
                <Input
                  value={text.servingSize}
                  placeholder="1 oz (28g)"
                  onChange={(e) =>
                    setText({ ...text, servingSize: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Servings Per Container</Label>
                <Input
                  value={text.servingsPerContainer}
                  placeholder="About 8"
                  onChange={(e) =>
                    setText({ ...text, servingsPerContainer: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {NUTRIENT_FIELDS.map((f) => (
                <div key={f.key as string} className="space-y-2">
                  <Label>
                    {f.label}
                    {f.unit ? (
                      <span className="text-brand-text-muted">
                        {" "}
                        ({f.unit})
                      </span>
                    ) : null}
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={f.integer ? "1" : "0.01"}
                    value={nutrients[f.key as string]}
                    onChange={(e) =>
                      setNutrients({
                        ...nutrients,
                        [f.key as string]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-2">
            <h2 className="font-heading font-semibold text-brand-secondary">
              Ingredients
            </h2>
            <p className="text-xs text-brand-text-muted">
              Paste the manufacturer&apos;s ingredient list verbatim, in
              descending order by weight.
            </p>
            <Textarea
              rows={4}
              value={text.ingredients}
              onChange={(e) =>
                setText({ ...text, ingredients: e.target.value })
              }
              placeholder="Sugar, corn syrup, modified corn starch, ..."
            />
          </div>

          {/* Major allergens */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-heading font-semibold text-brand-secondary">
                Major Allergens (FALCPA)
              </h2>
              <p className="text-xs text-brand-text-muted mt-1">
                Check each major allergen present. For tree nuts, fish, and
                Crustacean shellfish, name the specific type.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAJOR_ALLERGENS.map((a) => {
                const st = allergens[a.key];
                return (
                  <div key={a.key} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={st.checked}
                        onCheckedChange={(v) =>
                          toggleAllergen(a.key, v === true)
                        }
                      />
                      {a.label}
                    </label>
                    {st.checked ? (
                      <Input
                        className="h-8 text-sm"
                        value={st.specificType}
                        placeholder="Specific type (optional)"
                        onChange={(e) =>
                          setSpecificType(a.key, e.target.value)
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label>Reviewed — no major allergens present</Label>
                <p className="text-xs text-brand-text-muted">
                  Only enable if you have confirmed none of the nine are present.
                </p>
              </div>
              <Switch
                checked={noMajorAllergensReviewed}
                onCheckedChange={setNoMajorAllergensReviewed}
              />
            </div>

            {warnings.length > 0 ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                {warnings.map((w, i) => (
                  <p
                    key={i}
                    className="text-xs text-amber-800 flex items-start gap-2"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {/* Cross-contact advisory */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-2">
            <h2 className="font-heading font-semibold text-brand-secondary">
              Cross-Contact Advisory
            </h2>
            <p className="text-xs text-brand-text-muted">
              Optional &quot;may contain&quot; / shared-equipment warning. This is
              advisory only and is shown separately from the &quot;Contains&quot;
              statement — never merged into it.
            </p>
            <Textarea
              rows={2}
              value={text.crossContactNote}
              onChange={(e) =>
                setText({ ...text, crossContactNote: e.target.value })
              }
              placeholder="Manufactured on shared equipment that also processes peanuts and tree nuts."
            />
          </div>

          {/* Retail bag label */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-heading font-semibold text-brand-secondary">
                Retail Bag Label
              </h2>
              <p className="text-xs text-brand-text-muted mt-1">
                Fields for the printable retail-bag label. Print it from the
                &quot;Print Label&quot; button above.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Statement of Identity</Label>
              <Input
                value={text.labelStatementOfIdentity}
                placeholder={product.name}
                onChange={(e) =>
                  setText({ ...text, labelStatementOfIdentity: e.target.value })
                }
              />
              <p className="text-xs text-brand-text-muted">
                The product common name as printed. Defaults to{" "}
                <span className="font-medium">{product.name}</span> when blank.
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Net Weight{" "}
                <span className="text-brand-text-muted">(oz)</span>
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={text.netWeightOz}
                placeholder="8"
                onChange={(e) =>
                  setText({ ...text, netWeightOz: e.target.value })
                }
              />
              <p className="text-xs text-brand-text-muted">
                {netWeightPreview
                  ? `Prints as: ${netWeightPreview}`
                  : "Enter ounces to preview the printed NET WT line."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Distributed By (override)</Label>
              <Textarea
                rows={2}
                value={text.distributedByOverride}
                placeholder={defaultDistributedBy}
                onChange={(e) =>
                  setText({ ...text, distributedByOverride: e.target.value })
                }
              />
              <p className="text-xs text-brand-text-muted">
                Defaults to{" "}
                <span className="font-medium">{defaultDistributedBy}</span> when
                blank.
              </p>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Label>Show Nutrition Facts panel on label</Label>
              <Switch
                checked={showNutritionPanelOnLabel}
                onCheckedChange={setShowNutritionPanelOnLabel}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show QR code on label</Label>
              <Switch checked={showQrOnLabel} onCheckedChange={setShowQrOnLabel} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              {saving ? "Saving..." : "Save Nutrition Info"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
        </div>

        {/* ── Live preview column ── */}
        <div className="space-y-6">
          {/* Label compliance checklist (advisory, non-blocking) */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold text-brand-secondary mb-1">
              Label Compliance Checklist
            </h2>
            <p className="text-xs text-brand-text-muted mb-3">
              The four elements a retail-bag label always requires. Advisory
              only — printing isn&apos;t blocked.
            </p>
            <ul className="space-y-1.5">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                >
                  {item.ok ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={
                      item.ok ? "text-brand-text" : "text-brand-text-secondary"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold text-brand-secondary mb-3">
              Public Preview
            </h2>
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="font-semibold text-brand-text">Ingredients</p>
                <p className="text-sm text-brand-text-secondary whitespace-pre-line">
                  {text.ingredients.trim() || "—"}
                </p>
              </div>
              {containsStatement ? (
                <p className="font-bold text-brand-text">{containsStatement}</p>
              ) : noMajorAllergensReviewed ? (
                <p className="text-sm text-brand-text-secondary">
                  No major allergens declared.
                </p>
              ) : null}
              {text.crossContactNote.trim() ? (
                <p className="text-sm italic text-brand-text-secondary">
                  {text.crossContactNote.trim()}
                </p>
              ) : null}
            </div>
          </div>

          {/* ── QR sticker ── */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="font-heading font-semibold text-brand-secondary">
              QR Sticker
            </h2>
            <p className="text-xs text-brand-text-muted">
              Links to the public nutrition page{" "}
              <span className="font-mono">/products/{product.slug}/nutrition</span>.
              The QR encodes the page URL, so printed stickers stay valid even
              after you correct the nutrition text.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/products/${product.id}/qr?format=png&download=0`}
              alt={`Nutrition QR sticker for ${product.name}`}
              className="w-48 h-auto border rounded-lg"
            />
            <div className="flex gap-3">
              <a
                href={`/api/admin/products/${product.id}/qr?format=svg`}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-brand-bg"
              >
                Download SVG
              </a>
              <a
                href={`/api/admin/products/${product.id}/qr?format=png`}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-brand-bg"
              >
                Download PNG
              </a>
            </div>
            <Button
              type="button"
              onClick={() => router.push(`/admin/products/${product.id}/label`)}
              className="w-full bg-brand-secondary text-white hover:opacity-90"
            >
              Print Label
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
