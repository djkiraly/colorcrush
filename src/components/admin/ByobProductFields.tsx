"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type TaxItem = { slug: string; label: string; hex?: string };

interface ByobConfig {
  tastes: TaxItem[];
  colors: TaxItem[];
  flavors: TaxItem[];
}

export interface ByobProductValues {
  byobEligible: boolean;
  byobTaste: string;
  byobColor: string;
  byobFlavor: string;
}

interface Props {
  value: ByobProductValues;
  onChange: (patch: Partial<ByobProductValues>) => void;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

export function ByobProductFields({ value, onChange }: Props) {
  const [config, setConfig] = useState<ByobConfig | null>(null);

  useEffect(() => {
    fetch("/api/byob/config")
      .then((r) => r.json())
      .then((d) => setConfig(d.byob ?? null))
      .catch(() => {});
  }, []);

  const tastes = config?.tastes ?? [];
  const colors = config?.colors ?? [];
  const flavors = config?.flavors ?? [];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold">Build Your Box</h2>
          <p className="text-xs text-brand-text-muted mt-1">
            Make this product selectable as a candy in the Build Your Box grid,
            and tag it so customers can filter by taste, color, and flavor.
          </p>
        </div>
        <Switch
          checked={value.byobEligible}
          onCheckedChange={(v) => onChange({ byobEligible: v })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="byobTaste">Candy Category</Label>
          <select
            id="byobTaste"
            className={selectClass}
            value={value.byobTaste}
            disabled={!value.byobEligible}
            onChange={(e) => onChange({ byobTaste: e.target.value })}
          >
            <option value="">—</option>
            {tastes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="byobColor">Color</Label>
          <select
            id="byobColor"
            className={selectClass}
            value={value.byobColor}
            disabled={!value.byobEligible}
            onChange={(e) => onChange({ byobColor: e.target.value })}
          >
            <option value="">—</option>
            {colors.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="byobFlavor">Flavor</Label>
          <select
            id="byobFlavor"
            className={selectClass}
            value={value.byobFlavor}
            disabled={!value.byobEligible}
            onChange={(e) => onChange({ byobFlavor: e.target.value })}
          >
            <option value="">—</option>
            {flavors.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {value.byobEligible && tastes.length === 0 && (
        <p className="text-xs text-amber-700">
          No Build Your Box taxonomy configured yet. Add tastes/colors/flavors in
          Admin → Settings → Build Your Box.
        </p>
      )}
    </div>
  );
}
