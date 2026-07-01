"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, LayoutList, ArrowUp, ArrowDown, Lock } from "lucide-react";

type SectionRow = { id: string; enabled: boolean };

const SECTION_META: Record<string, { label: string; description: string }> = {
  hero: { label: "Hero", description: "Top banner / headline & call-to-action" },
  trustBadges: {
    label: "Trust Badges",
    description: "Fast shipping · handcrafted · secure · guarantee row",
  },
  shopByType: { label: "Shop by Type", description: "Category grid" },
  shopByEvent: { label: "Shop by Event", description: "Event category pills" },
  trendingNow: { label: "Trending Now", description: "Trending products carousel" },
};

// Hero is pinned first and never reordered — only these are sortable.
const ORDERABLE = ["trustBadges", "shopByType", "shopByEvent", "trendingNow"];

export function HomeSectionsManager() {
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [rows, setRows] = useState<SectionRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.merged?.homePageSections ?? {};
        setHeroEnabled(cfg.hero?.enabled !== false);
        const ordered = ORDERABLE.map((id) => ({
          id,
          order: cfg[id]?.order ?? 99,
          enabled: cfg[id]?.enabled !== false,
        }))
          .sort((a, b) => a.order - b.order)
          .map(({ id, enabled }) => ({ id, enabled }));
        setRows(ordered);
      })
      .catch(() => toast.error("Failed to load home page layout"));
  }, []);

  if (!rows) {
    return (
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-sm text-brand-text-muted">Loading home page layout…</p>
      </section>
    );
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const toggle = (i: number, v: boolean) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, enabled: v } : r)));

  const save = async () => {
    // Order is derived from the current list position (1-based); hero is always
    // first, so it carries visibility only.
    const value: Record<string, { enabled: boolean; order?: number }> = {
      hero: { enabled: heroEnabled },
    };
    rows.forEach((r, i) => {
      value[r.id] = { enabled: r.enabled, order: i + 1 };
    });

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "homePageSections", value }),
      });
      if (!res.ok) {
        const dd = await res.json().catch(() => ({}));
        throw new Error(dd.error || "Save failed");
      }
      toast.success("Home page layout saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const rowClasses =
    "flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2.5";

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <LayoutList className="h-5 w-5 text-brand-primary" />
        <h2 className="font-heading font-semibold text-lg">Home Page Layout</h2>
      </div>
      <p className="text-xs text-brand-text-muted -mt-3">
        Toggle which sections appear on the storefront home page and use the
        arrows to reorder them. The Hero always appears first. The same order
        applies to both desktop and mobile.
      </p>

      {/* Hero — pinned first */}
      <div className={`${rowClasses} bg-brand-bg/60`}>
        <Lock className="h-4 w-4 text-brand-text-muted shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{SECTION_META.hero.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-brand-text-muted">
              Always first
            </span>
          </div>
          <p className="text-xs text-brand-text-muted">{SECTION_META.hero.description}</p>
        </div>
        <Switch checked={heroEnabled} onCheckedChange={setHeroEnabled} />
      </div>

      {/* Reorderable sections */}
      <div className="space-y-2">
        {rows.map((row, i) => {
          const meta = SECTION_META[row.id];
          return (
            <div key={row.id} className={rowClasses}>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${meta.label} up`}
                  className="text-brand-text-muted hover:text-brand-primary disabled:opacity-30 disabled:hover:text-brand-text-muted"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label={`Move ${meta.label} down`}
                  className="text-brand-text-muted hover:text-brand-primary disabled:opacity-30 disabled:hover:text-brand-text-muted"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-sm">{meta.label}</span>
                <p className="text-xs text-brand-text-muted">{meta.description}</p>
              </div>
              <Switch checked={row.enabled} onCheckedChange={(v) => toggle(i, v)} />
            </div>
          );
        })}
      </div>

      <div>
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save Home Page Layout"}
        </Button>
      </div>
    </section>
  );
}
