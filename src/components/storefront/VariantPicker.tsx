"use client";

export type PickerOptionValue = {
  id: string;
  value: string;
  slug: string;
  code: string;
  swatchHex: string | null;
  sortOrder: number;
};

export type PickerOptionType = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  values: PickerOptionValue[];
};

export type PickerVariant = {
  id: string;
  sku: string;
  priceOverride: string | null;
  compareAtPriceOverride: string | null;
  imageOverrideId: string | null;
  weightOzOverride: number | null;
  isActive: boolean;
  options: { optionValueId: string; optionTypeId: string }[];
  inventory: { quantity: number } | null;
};

interface Props {
  optionTypes: PickerOptionType[];
  variants: PickerVariant[];
  selected: Record<string, string>; // optionTypeId -> optionValueId
  onChange: (next: Record<string, string>) => void;
}

// Builds a map of optionTypeId|optionValueId -> set of variantIds that include that pairing,
// so we can grey out values that have no compatible in-stock variant given the current partial selection.
export function VariantPicker({ optionTypes, variants, selected, onChange }: Props) {
  // For a candidate (typeId, valueId), is there at least one *active, in-stock* variant
  // compatible with the rest of the current selection?
  const isValueAvailable = (typeId: string, valueId: string) => {
    const candidateSelection: Record<string, string> = {
      ...selected,
      [typeId]: valueId,
    };
    return variants.some((v) => {
      if (!v.isActive) return false;
      if ((v.inventory?.quantity ?? 0) <= 0) return false;
      // Variant must include each (typeId -> valueId) currently selected.
      for (const [tid, vid] of Object.entries(candidateSelection)) {
        const matches = v.options.some(
          (o) => o.optionTypeId === tid && o.optionValueId === vid
        );
        if (!matches) return false;
      }
      return true;
    });
  };

  return (
    <div className="space-y-4">
      {optionTypes.map((type) => (
        <div key={type.id} className="space-y-2">
          <div className="text-sm font-medium text-brand-text">
            {type.name}
            {selected[type.id] && (
              <span className="ml-2 text-brand-text-muted font-normal">
                : {type.values.find((v) => v.id === selected[type.id])?.value}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {type.values.map((v) => {
              const isSelected = selected[type.id] === v.id;
              const available = isValueAvailable(type.id, v.id);
              const baseClasses =
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors";
              const stateClasses = isSelected
                ? "bg-brand-primary text-white border-brand-primary"
                : available
                ? "bg-white border-gray-300 hover:border-brand-primary text-brand-text"
                : "bg-gray-50 border-gray-200 text-brand-text-muted line-through cursor-not-allowed";

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!available && !isSelected}
                  onClick={() => {
                    if (isSelected) {
                      const next = { ...selected };
                      delete next[type.id];
                      onChange(next);
                    } else {
                      onChange({ ...selected, [type.id]: v.id });
                    }
                  }}
                  className={`${baseClasses} ${stateClasses}`}
                >
                  {v.swatchHex && (
                    <span
                      className="h-4 w-4 rounded-full border border-gray-300"
                      style={{ background: v.swatchHex }}
                    />
                  )}
                  <span>{v.value}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper: find the variant exactly matching a full selection map.
export function findMatchingVariant(
  variants: PickerVariant[],
  selected: Record<string, string>
): PickerVariant | null {
  const wantedKeys = Object.entries(selected).map(
    ([typeId, valueId]) => `${typeId}:${valueId}`
  );
  if (wantedKeys.length === 0) return null;
  return (
    variants.find((v) => {
      const variantKeys = v.options.map(
        (o) => `${o.optionTypeId}:${o.optionValueId}`
      );
      if (variantKeys.length !== wantedKeys.length) return false;
      return wantedKeys.every((k) => variantKeys.includes(k));
    }) ?? null
  );
}
