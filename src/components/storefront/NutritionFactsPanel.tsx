import type { ProductNutritionRecord } from "@/lib/queries/nutrition";

/** Format a stored numeric value (string|number|null) for display, or null. */
function fmt(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return String(Number(n.toFixed(2)));
}

function Row({
  label,
  value,
  unit,
  indent = 0,
  bold = false,
}: {
  label: string;
  value: string | null;
  unit: string;
  indent?: number;
  bold?: boolean;
}) {
  if (value === null) return null;
  return (
    <div
      className="flex justify-between border-t border-black py-0.5 text-base"
      style={indent ? { paddingLeft: `${indent * 1}rem` } : undefined}
    >
      <span className={bold ? "font-bold" : undefined}>{label}</span>
      <span className={bold ? "font-bold" : undefined}>
        {value}
        {unit}
      </span>
    </div>
  );
}

/**
 * FDA-conventional Nutrition Facts panel. Black border and rules, bold title,
 * legible layout. Renders only the rows the admin supplied — no %DV column,
 * since daily values are not collected. Brand fonts are used for headings via
 * inherited Tailwind config, but the panel itself stays FDA-standard.
 */
export function NutritionFactsPanel({
  nutrition,
}: {
  nutrition: ProductNutritionRecord;
}) {
  const calories = fmt(nutrition.calories);

  return (
    <div className="mx-auto w-full max-w-sm border-2 border-black bg-white p-3 text-black">
      <h2 className="font-heading text-3xl font-extrabold leading-none">
        Nutrition Facts
      </h2>

      {nutrition.servingsPerContainer ? (
        <p className="mt-1 text-sm">
          {nutrition.servingsPerContainer} servings per container
        </p>
      ) : null}

      {nutrition.servingSize ? (
        <div className="flex justify-between border-b-8 border-black pb-1 text-base font-bold">
          <span>Serving size</span>
          <span>{nutrition.servingSize}</span>
        </div>
      ) : (
        <div className="border-b-8 border-black" />
      )}

      {calories ? (
        <div className="flex items-end justify-between border-b-4 border-black py-1">
          <div>
            <p className="text-xs font-bold">Amount per serving</p>
            <p className="font-heading text-2xl font-extrabold">Calories</p>
          </div>
          <p className="font-heading text-4xl font-extrabold leading-none">
            {calories}
          </p>
        </div>
      ) : null}

      <div className="mt-1">
        <Row label="Total Fat" value={fmt(nutrition.totalFat)} unit="g" bold />
        <Row
          label="Saturated Fat"
          value={fmt(nutrition.saturatedFat)}
          unit="g"
          indent={1}
        />
        <Row
          label="Trans Fat"
          value={fmt(nutrition.transFat)}
          unit="g"
          indent={1}
        />
        <Row
          label="Cholesterol"
          value={fmt(nutrition.cholesterol)}
          unit="mg"
          bold
        />
        <Row label="Sodium" value={fmt(nutrition.sodium)} unit="mg" bold />
        <Row
          label="Total Carbohydrate"
          value={fmt(nutrition.totalCarbs)}
          unit="g"
          bold
        />
        <Row
          label="Dietary Fiber"
          value={fmt(nutrition.dietaryFiber)}
          unit="g"
          indent={1}
        />
        <Row
          label="Total Sugars"
          value={fmt(nutrition.totalSugars)}
          unit="g"
          indent={1}
        />
        <Row
          label="Includes Added Sugars"
          value={fmt(nutrition.addedSugars)}
          unit="g"
          indent={2}
        />
        <Row label="Protein" value={fmt(nutrition.protein)} unit="g" bold />
      </div>
    </div>
  );
}
