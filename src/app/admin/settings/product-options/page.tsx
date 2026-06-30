"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
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

export default function ProductOptionsAdminPage() {
  const [types, setTypes] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const [newValue, setNewValue] = useState({
    value: "",
    code: "",
    swatchHex: "",
  });
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    return fetch("/api/admin/option-types")
      .then((res) => res.json())
      .then((data) => {
        setTypes(data.types || []);
        if (!selectedTypeId && data.types?.[0]) setSelectedTypeId(data.types[0].id);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const selected = types.find((t) => t.id === selectedTypeId) ?? null;

  const addType = async () => {
    if (!newType.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/option-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newType.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to add type");
      return;
    }
    const data = await res.json();
    setNewType("");
    await load();
    setSelectedTypeId(data.type.id);
    toast.success("Option type added");
  };

  const patchType = async (id: string, patch: Partial<OptionType>) => {
    const res = await fetch(`/api/admin/option-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to update");
      return;
    }
    await load();
  };

  const deleteType = async (id: string) => {
    if (!confirm("Delete this option type? All its values will be removed.")) return;
    const res = await fetch(`/api/admin/option-types/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to delete");
      return;
    }
    if (selectedTypeId === id) setSelectedTypeId(null);
    await load();
    toast.success("Option type removed");
  };

  const addValue = async () => {
    if (!selectedTypeId || !newValue.value.trim() || !newValue.code.trim()) {
      toast.error("Value and short code are required");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/option-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionTypeId: selectedTypeId,
        value: newValue.value.trim(),
        code: newValue.code.trim().toUpperCase(),
        swatchHex: newValue.swatchHex.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to add value");
      return;
    }
    setNewValue({ value: "", code: "", swatchHex: "" });
    await load();
    toast.success("Value added");
  };

  const patchValue = async (id: string, patch: Partial<OptionValue>) => {
    const res = await fetch(`/api/admin/option-values/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to update");
      return;
    }
    await load();
  };

  const deleteValue = async (id: string) => {
    if (!confirm("Delete this option value?")) return;
    const res = await fetch(`/api/admin/option-values/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to delete");
      return;
    }
    await load();
    toast.success("Value removed");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-brand-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Product Options
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Define option types (e.g. Type, Color, Size) and their selectable values.
          Each product can pick which option types it uses and which values it offers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Types pane */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Option Types</h2>
          <div className="space-y-2 mb-4">
            {types.length === 0 && (
              <p className="text-sm text-brand-text-muted">No option types yet.</p>
            )}
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeId(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTypeId === t.id
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  {!t.isActive && (
                    <span className="text-xs text-brand-text-muted">(inactive)</span>
                  )}
                  <span className="text-xs text-brand-text-muted">
                    {t.values.length} value{t.values.length === 1 ? "" : "s"}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. Size"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addType();
                }
              }}
            />
            <Button
              type="button"
              onClick={addType}
              disabled={busy || !newType.trim()}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* Values pane */}
        <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-brand-text-muted">
              Pick or create an option type to manage its values.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading font-semibold">{selected.name}</h2>
                  <p className="text-xs text-brand-text-muted">
                    Slug: <code>{selected.slug}</code>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={selected.isActive}
                      onCheckedChange={(v) =>
                        patchType(selected.id, { isActive: v })
                      }
                    />
                    Active
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteType(selected.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete type
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {selected.values.length === 0 && (
                  <p className="text-sm text-brand-text-muted">
                    No values yet — add one below.
                  </p>
                )}
                {selected.values.map((v) => (
                  <ValueRow
                    key={v.id}
                    value={v}
                    onPatch={(patch) => patchValue(v.id, patch)}
                    onDelete={() => deleteValue(v.id)}
                  />
                ))}
              </div>

              <div className="pt-4 border-t space-y-3">
                <h3 className="text-sm font-semibold">Add value</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={newValue.value}
                      onChange={(e) =>
                        setNewValue((v) => ({ ...v, value: e.target.value }))
                      }
                      placeholder="e.g. Blue & Gold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Short code (SKU)</Label>
                    <Input
                      value={newValue.code}
                      onChange={(e) =>
                        setNewValue((v) => ({
                          ...v,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                        }))
                      }
                      placeholder="e.g. BG"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Swatch hex (optional)</Label>
                    <Input
                      value={newValue.swatchHex}
                      onChange={(e) =>
                        setNewValue((v) => ({ ...v, swatchHex: e.target.value }))
                      }
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addValue}
                  disabled={busy}
                  className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add value
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ValueRow({
  value,
  onPatch,
  onDelete,
}: {
  value: OptionValue;
  onPatch: (patch: Partial<OptionValue>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    value: value.value,
    code: value.code,
    swatchHex: value.swatchHex ?? "",
    sortOrder: value.sortOrder,
  });
  const dirty =
    draft.value !== value.value ||
    draft.code !== value.code ||
    draft.swatchHex !== (value.swatchHex ?? "") ||
    draft.sortOrder !== value.sortOrder;

  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
      <div className="col-span-4">
        <Input
          value={draft.value}
          onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
        />
      </div>
      <div className="col-span-2">
        <Input
          value={draft.code}
          maxLength={8}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
            }))
          }
        />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Input
          value={draft.swatchHex}
          placeholder="#hex"
          onChange={(e) => setDraft((d) => ({ ...d, swatchHex: e.target.value }))}
        />
        {draft.swatchHex && (
          <span
            className="h-6 w-6 rounded-full border border-gray-300 flex-shrink-0"
            style={{ background: draft.swatchHex }}
          />
        )}
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          value={draft.sortOrder}
          onChange={(e) =>
            setDraft((d) => ({ ...d, sortOrder: parseInt(e.target.value || "0", 10) }))
          }
        />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <Switch
          checked={value.isActive}
          onCheckedChange={(v) => onPatch({ isActive: v })}
        />
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1">
        {dirty && (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onPatch({
                value: draft.value,
                code: draft.code,
                swatchHex: draft.swatchHex || null,
                sortOrder: draft.sortOrder,
              })
            }
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            <Save className="h-3 w-3" />
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
