"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, PanelTop } from "lucide-react";

type MenuRow = { key: string; label: string; description: string; enabled: boolean };

// Fixed set of top-level header nav items. Category dropdowns are keyed by their
// category slug (matching `rootOrder` in Header.tsx); the static links use named
// keys. Order here is display order in the admin list only.
const MENU_ITEMS: { key: string; label: string; description: string }[] = [
  { key: "shopAll", label: "Shop All", description: "Link to all products" },
  { key: "shop-by-type", label: "Shop by Type", description: "Category dropdown" },
  { key: "shop-by-color", label: "Shop by Color", description: "Category dropdown" },
  { key: "shop-by-event", label: "Shop by Event", description: "Category dropdown" },
  { key: "gift-boxes", label: "Gift Boxes", description: "Category dropdown" },
  { key: "buildYourBox", label: "Build Your Box", description: "Link to the box builder" },
];

export function HeaderMenuManager() {
  const [rows, setRows] = useState<MenuRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.merged?.headerMenu ?? {};
        setRows(
          MENU_ITEMS.map((item) => ({
            ...item,
            enabled: cfg[item.key]?.enabled !== false,
          }))
        );
      })
      .catch(() => toast.error("Failed to load header menu"));
  }, []);

  if (!rows) {
    return (
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-sm text-brand-text-muted">Loading header menu…</p>
      </section>
    );
  }

  const toggle = (i: number, v: boolean) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, enabled: v } : r)));

  const save = async () => {
    const value: Record<string, { enabled: boolean }> = {};
    rows.forEach((r) => {
      value[r.key] = { enabled: r.enabled };
    });

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "headerMenu", value }),
      });
      if (!res.ok) {
        const dd = await res.json().catch(() => ({}));
        throw new Error(dd.error || "Save failed");
      }
      toast.success("Header menu saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <PanelTop className="h-5 w-5 text-brand-primary" />
        <h2 className="font-heading font-semibold text-lg">Header Menu</h2>
      </div>
      <p className="text-xs text-brand-text-muted -mt-3">
        Toggle which items appear in the storefront header navigation. Applies to
        both the desktop menu and the mobile menu.
      </p>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm">{row.label}</span>
              <p className="text-xs text-brand-text-muted">{row.description}</p>
            </div>
            <Switch checked={row.enabled} onCheckedChange={(v) => toggle(i, v)} />
          </div>
        ))}
      </div>

      <div>
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save Header Menu"}
        </Button>
      </div>
    </section>
  );
}
