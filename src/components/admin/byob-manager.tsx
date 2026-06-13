"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, Package } from "lucide-react";

type BoxSize = {
  id: string;
  label: string;
  pieces: number;
  price: number;
  cols: number;
  rows: number;
  sortOrder: number;
};
type TaxItem = { slug: string; label: string; hex?: string };

type ByobConfig = {
  enabled: boolean;
  boxes: BoxSize[];
  tastes: TaxItem[];
  colors: TaxItem[];
  flavors: TaxItem[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `box-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `box-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

const inputSm =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-sm";

export function ByobManager() {
  const [config, setConfig] = useState<ByobConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/byob/config")
      .then((r) => r.json())
      .then((d) => {
        const b = d.byob ?? {};
        setConfig({
          enabled: b.enabled ?? true,
          boxes: (b.boxes ?? []).map((x: BoxSize) => ({ ...x })),
          tastes: (b.tastes ?? []).map((x: TaxItem) => ({ ...x })),
          colors: (b.colors ?? []).map((x: TaxItem) => ({ ...x })),
          flavors: (b.flavors ?? []).map((x: TaxItem) => ({ ...x })),
        });
      })
      .catch(() => toast.error("Failed to load Build Your Box config"));
  }, []);

  if (!config) {
    return (
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-sm text-brand-text-muted">Loading Build Your Box…</p>
      </section>
    );
  }

  const update = (patch: Partial<ByobConfig>) =>
    setConfig((c) => (c ? { ...c, ...patch } : c));

  // ── Box sizes ──
  const updateBox = (i: number, patch: Partial<BoxSize>) =>
    update({ boxes: config.boxes.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  const addBox = () =>
    update({
      boxes: [
        ...config.boxes,
        { id: newId(), label: "New Box", pieces: 4, price: 0, cols: 2, rows: 2, sortOrder: config.boxes.length },
      ],
    });
  const removeBox = (i: number) => update({ boxes: config.boxes.filter((_, idx) => idx !== i) });

  // ── Taxonomy (tastes / colors / flavors) ──
  const updateTax = (
    key: "tastes" | "colors" | "flavors",
    i: number,
    patch: Partial<TaxItem>
  ) => update({ [key]: config[key].map((t, idx) => (idx === i ? { ...t, ...patch } : t)) } as Partial<ByobConfig>);
  const addTax = (key: "tastes" | "colors" | "flavors") =>
    update({ [key]: [...config[key], { slug: "", label: "", hex: "" }] } as Partial<ByobConfig>);
  const removeTax = (key: "tastes" | "colors" | "flavors", i: number) =>
    update({ [key]: config[key].filter((_, idx) => idx !== i) } as Partial<ByobConfig>);

  const save = async () => {
    // Normalize: sortOrder from index; ensure each taxonomy item has a slug.
    const payload: ByobConfig = {
      enabled: config.enabled,
      boxes: config.boxes.map((b, i) => ({
        ...b,
        id: b.id || newId(),
        sortOrder: i,
        pieces: Number(b.pieces) || 0,
        price: Number(b.price) || 0,
        cols: Number(b.cols) || 1,
        rows: Number(b.rows) || 1,
      })),
      tastes: config.tastes
        .filter((t) => t.label.trim())
        .map((t) => ({ ...t, slug: t.slug?.trim() || slugify(t.label) })),
      colors: config.colors
        .filter((t) => t.label.trim())
        .map((t) => ({ ...t, slug: t.slug?.trim() || slugify(t.label) })),
      flavors: config.flavors
        .filter((t) => t.label.trim())
        .map((t) => ({ ...t, slug: t.slug?.trim() || slugify(t.label) })),
    };
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "byob", value: payload }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      setConfig(payload);
      toast.success("Build Your Box settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const renderTax = (key: "tastes" | "colors" | "flavors", title: string, withHex: boolean) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => addTax(key)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {config[key].length === 0 && (
          <p className="text-xs text-brand-text-muted">None yet.</p>
        )}
        {config[key].map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            {withHex && (
              <input
                type="color"
                className="h-8 w-9 rounded border border-input bg-background p-0.5"
                value={t.hex || "#000000"}
                onChange={(e) => updateTax(key, i, { hex: e.target.value })}
                title="Swatch color"
              />
            )}
            <input
              className={inputSm}
              placeholder="Label (e.g. Sweet)"
              value={t.label}
              onChange={(e) => updateTax(key, i, { label: e.target.value })}
            />
            <input
              className={`${inputSm} max-w-[140px]`}
              placeholder="slug"
              value={t.slug}
              onChange={(e) => updateTax(key, i, { slug: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim() && t.label.trim()) {
                  updateTax(key, i, { slug: slugify(t.label) });
                }
              }}
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeTax(key, i)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-primary" />
          <h2 className="font-heading font-semibold text-lg">Build Your Box</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Enabled</Label>
          <Switch checked={config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
        </div>
      </div>
      <p className="text-xs text-brand-text-muted -mt-3">
        Configure the box sizes/prices and the taste, color, and flavor filters
        shown on the public Build Your Box page. Tag individual products as
        BYOB-eligible (with a taste/color/flavor) from each product&apos;s edit page.
      </p>

      {/* Box sizes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Box Sizes &amp; Prices</Label>
          <Button type="button" size="sm" variant="outline" onClick={addBox}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Box
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_70px_80px_60px_60px_40px] gap-2 text-xs text-brand-text-muted px-1">
          <span>Label</span><span>Pieces</span><span>Price $</span><span>Cols</span><span>Rows</span><span></span>
        </div>
        {config.boxes.map((b, i) => (
          <div key={b.id} className="grid grid-cols-[1fr_70px_80px_60px_60px_40px] gap-2 items-center">
            <input className={inputSm} value={b.label} onChange={(e) => updateBox(i, { label: e.target.value })} />
            <input className={inputSm} type="number" min={1} value={b.pieces} onChange={(e) => updateBox(i, { pieces: Number(e.target.value) })} />
            <input className={inputSm} type="number" min={0} step="0.01" value={b.price} onChange={(e) => updateBox(i, { price: Number(e.target.value) })} />
            <input className={inputSm} type="number" min={1} value={b.cols} onChange={(e) => updateBox(i, { cols: Number(e.target.value) })} />
            <input className={inputSm} type="number" min={1} value={b.rows} onChange={(e) => updateBox(i, { rows: Number(e.target.value) })} />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeBox(i)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {config.boxes.length === 0 && (
          <p className="text-xs text-brand-text-muted">No box sizes — add at least one.</p>
        )}
      </div>

      {/* Taxonomy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderTax("tastes", "Candy Categories (Sweet/Sour/Spicy)", true)}
        {renderTax("colors", "Colors", true)}
        {renderTax("flavors", "Flavors", false)}
      </div>

      <div>
        <Button type="button" onClick={save} disabled={saving} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save Build Your Box"}
        </Button>
      </div>
    </section>
  );
}
