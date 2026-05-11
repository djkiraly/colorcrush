"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";

type OptionValue = {
  id: string;
  optionTypeId: string;
  value: string;
  slug: string;
  code: string;
  swatchHex: string | null;
  sortOrder: number;
  isActive: boolean;
};

type OptionType = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  values: OptionValue[];
};

type ProductImage = { id: string; url: string; altText: string | null; isPrimary: boolean };

type Variant = {
  id: string;
  productId: string;
  sku: string;
  priceOverride: string | null;
  compareAtPriceOverride: string | null;
  weightOzOverride: number | null;
  weight: string | null;
  imageOverrideId: string | null;
  isActive: boolean;
  sortOrder: number;
  options: {
    optionValueId: string;
    value: string;
    code: string;
    swatchHex: string | null;
    optionTypeId: string;
    optionTypeName: string;
  }[];
  inventory: { quantity: number } | null;
};

interface Props {
  productId: string;
  productImages: ProductImage[];
  hasVariants: boolean;
  onHasVariantsChange: (v: boolean) => void;
}

export function AdminProductVariantsEditor({
  productId,
  productImages,
  hasVariants,
  onHasVariantsChange,
}: Props) {
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [selectedValueIds, setSelectedValueIds] = useState<Record<string, string[]>>({});

  const loadAll = async () => {
    setLoading(true);
    const [typesRes, variantsRes] = await Promise.all([
      fetch("/api/admin/option-types"),
      fetch(`/api/products/${productId}/variants`),
    ]);
    const typesData = await typesRes.json();
    const variantsData = await variantsRes.json();
    const allTypes: OptionType[] = (typesData.types || []).filter(
      (t: OptionType) => t.isActive
    );
    setOptionTypes(allTypes);
    setVariants(variantsData.variants || []);

    // Pre-select option types/values already used by existing variants.
    if ((variantsData.variants || []).length > 0) {
      const usedTypes = new Set<string>();
      const usedValuesByType: Record<string, Set<string>> = {};
      for (const v of variantsData.variants as Variant[]) {
        for (const opt of v.options) {
          usedTypes.add(opt.optionTypeId);
          (usedValuesByType[opt.optionTypeId] ||= new Set()).add(opt.optionValueId);
        }
      }
      setSelectedTypeIds(Array.from(usedTypes));
      const valueMap: Record<string, string[]> = {};
      for (const tid of Object.keys(usedValuesByType)) {
        valueMap[tid] = Array.from(usedValuesByType[tid]);
      }
      setSelectedValueIds(valueMap);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const toggleType = (typeId: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
    setSelectedValueIds((prev) => {
      const next = { ...prev };
      if (next[typeId]) delete next[typeId];
      return next;
    });
  };

  const toggleValue = (typeId: string, valueId: string) => {
    setSelectedValueIds((prev) => {
      const existing = prev[typeId] || [];
      return {
        ...prev,
        [typeId]: existing.includes(valueId)
          ? existing.filter((v) => v !== valueId)
          : [...existing, valueId],
      };
    });
  };

  const matrixSize = useMemo(() => {
    if (selectedTypeIds.length === 0) return 0;
    return selectedTypeIds.reduce((acc, tid) => {
      const count = (selectedValueIds[tid] || []).length;
      return acc * (count || 0);
    }, 1);
  }, [selectedTypeIds, selectedValueIds]);

  const generateVariants = async () => {
    if (selectedTypeIds.length === 0) {
      toast.error("Pick at least one option type");
      return;
    }
    const payload: Record<string, string[]> = {};
    for (const tid of selectedTypeIds) {
      const vs = selectedValueIds[tid] || [];
      if (vs.length === 0) {
        toast.error("Each selected option type needs at least one value");
        return;
      }
      payload[tid] = vs;
    }
    setGenerating(true);
    const res = await fetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionValueIdsByType: payload }),
    });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to generate variants");
      return;
    }
    const data = await res.json();
    if (data.created.length === 0) {
      toast.info("No new combinations — variants already exist for the selected set.");
    } else {
      toast.success(`Generated ${data.created.length} variant${data.created.length === 1 ? "" : "s"}`);
      onHasVariantsChange(true);
    }
    await loadAll();
  };

  const patchVariant = async (variantId: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to update variant");
      return;
    }
    await loadAll();
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Delete this variant? Its inventory row will also be removed.")) return;
    const res = await fetch(`/api/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to delete variant");
      return;
    }
    toast.success("Variant removed");
    await loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-brand-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading variants…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold">Variations</h2>
          <p className="text-xs text-brand-text-muted">
            Sell this product as multiple SKUs by combining option values. Inactive products
            stay hidden from the storefront variant picker.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span>Has variants</span>
          <Switch checked={hasVariants} onCheckedChange={onHasVariantsChange} />
        </label>
      </div>

      {hasVariants && (
        <>
          {optionTypes.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-900">
              No option types defined yet.{" "}
              <a className="underline" href="/admin/settings/product-options" target="_blank">
                Configure them first
              </a>
              , then return here.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Option types to use</Label>
                <div className="flex flex-wrap gap-2">
                  {optionTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedTypeIds.includes(t.id)
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white border-gray-300 hover:border-brand-primary"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTypeIds.map((tid) => {
                const t = optionTypes.find((x) => x.id === tid);
                if (!t) return null;
                return (
                  <div key={tid} className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs uppercase tracking-wide text-brand-text-muted">
                      {t.name} values
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {t.values
                        .filter((v) => v.isActive)
                        .map((v) => {
                          const checked = (selectedValueIds[tid] || []).includes(v.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => toggleValue(tid, v.id)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                                checked
                                  ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                  : "bg-white border-gray-300 hover:border-brand-primary"
                              }`}
                            >
                              {v.swatchHex && (
                                <span
                                  className="h-3 w-3 rounded-full border border-gray-300"
                                  style={{ background: v.swatchHex }}
                                />
                              )}
                              {v.value}
                              <span className="text-xs text-brand-text-muted">({v.code})</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="button"
                  onClick={generateVariants}
                  disabled={generating || matrixSize === 0}
                  className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  {generating
                    ? "Generating…"
                    : `Generate ${matrixSize || ""} variant${matrixSize === 1 ? "" : "s"}`}
                </Button>
                <p className="text-xs text-brand-text-muted">
                  Existing combinations are skipped — disable rows you don&apos;t need below.
                </p>
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Generated variants ({variants.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-brand-text-muted">
                    <tr>
                      <th className="text-left py-2 px-2">Options</th>
                      <th className="text-left py-2 px-2">SKU</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Compare</th>
                      <th className="text-left py-2 px-2">Wt oz</th>
                      <th className="text-left py-2 px-2">Stock</th>
                      <th className="text-left py-2 px-2">Image</th>
                      <th className="text-left py-2 px-2">Active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <VariantRow
                        key={v.id}
                        variant={v}
                        productImages={productImages}
                        onPatch={(patch) => patchVariant(v.id, patch)}
                        onDelete={() => deleteVariant(v.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VariantRow({
  variant,
  productImages,
  onPatch,
  onDelete,
}: {
  variant: Variant;
  productImages: ProductImage[];
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    sku: variant.sku,
    priceOverride: variant.priceOverride ?? "",
    compareAtPriceOverride: variant.compareAtPriceOverride ?? "",
    weightOzOverride:
      variant.weightOzOverride !== null ? String(variant.weightOzOverride) : "",
    stock: variant.inventory?.quantity ?? 0,
    imageOverrideId: variant.imageOverrideId ?? "",
  });

  const dirty =
    draft.sku !== variant.sku ||
    draft.priceOverride !== (variant.priceOverride ?? "") ||
    draft.compareAtPriceOverride !== (variant.compareAtPriceOverride ?? "") ||
    draft.weightOzOverride !==
      (variant.weightOzOverride !== null ? String(variant.weightOzOverride) : "") ||
    Number(draft.stock) !== (variant.inventory?.quantity ?? 0) ||
    draft.imageOverrideId !== (variant.imageOverrideId ?? "");

  return (
    <tr className="border-t">
      <td className="py-2 px-2">
        <div className="flex flex-wrap gap-1">
          {variant.options.map((o) => (
            <Badge key={o.optionValueId} variant="secondary" className="text-xs">
              {o.swatchHex && (
                <span
                  className="h-2 w-2 rounded-full inline-block mr-1"
                  style={{ background: o.swatchHex }}
                />
              )}
              {o.value}
            </Badge>
          ))}
        </div>
      </td>
      <td className="py-2 px-2">
        <Input
          value={draft.sku}
          onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
          className="h-8 text-xs font-mono"
        />
      </td>
      <td className="py-2 px-2 w-28">
        <Input
          type="number"
          step="0.01"
          value={draft.priceOverride}
          onChange={(e) => setDraft((d) => ({ ...d, priceOverride: e.target.value }))}
          placeholder="—"
          className="h-8"
        />
      </td>
      <td className="py-2 px-2 w-28">
        <Input
          type="number"
          step="0.01"
          value={draft.compareAtPriceOverride}
          onChange={(e) =>
            setDraft((d) => ({ ...d, compareAtPriceOverride: e.target.value }))
          }
          placeholder="—"
          className="h-8"
        />
      </td>
      <td className="py-2 px-2 w-20">
        <Input
          type="number"
          value={draft.weightOzOverride}
          onChange={(e) => setDraft((d) => ({ ...d, weightOzOverride: e.target.value }))}
          placeholder="—"
          className="h-8"
        />
      </td>
      <td className="py-2 px-2 w-20">
        <Input
          type="number"
          value={draft.stock}
          onChange={(e) =>
            setDraft((d) => ({ ...d, stock: parseInt(e.target.value || "0", 10) }))
          }
          className="h-8"
        />
      </td>
      <td className="py-2 px-2 w-40">
        <select
          value={draft.imageOverrideId}
          onChange={(e) => setDraft((d) => ({ ...d, imageOverrideId: e.target.value }))}
          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="">— (use product image)</option>
          {productImages.map((img) => (
            <option key={img.id} value={img.id}>
              {img.altText || img.url.split("/").pop()?.slice(0, 24) || "image"}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2">
        <Switch
          checked={variant.isActive}
          onCheckedChange={(v) => onPatch({ isActive: v })}
        />
      </td>
      <td className="py-2 px-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {dirty && (
            <Button
              type="button"
              size="sm"
              onClick={() =>
                onPatch({
                  sku: draft.sku,
                  priceOverride: draft.priceOverride === "" ? null : Number(draft.priceOverride),
                  compareAtPriceOverride:
                    draft.compareAtPriceOverride === ""
                      ? null
                      : Number(draft.compareAtPriceOverride),
                  weightOzOverride:
                    draft.weightOzOverride === ""
                      ? null
                      : parseInt(draft.weightOzOverride, 10),
                  imageOverrideId: draft.imageOverrideId || null,
                  stock: draft.stock,
                })
              }
              className="bg-brand-primary hover:bg-brand-primary-hover text-white h-8 px-2"
            >
              <Save className="h-3 w-3" />
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={onDelete} className="h-8 px-2">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
