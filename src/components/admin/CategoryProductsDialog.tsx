"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Check } from "lucide-react";
import { toast } from "sonner";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
};

type Action = "add" | "remove" | "replace";

const REPLACE_CONFIRM =
  "Replace will drop all current product memberships for this category and set them to exactly the products you've checked. Continue?";

export function CategoryProductsDialog({
  category,
  open,
  onOpenChange,
  onSaved,
}: {
  category: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Action | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);

  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    setLoading(true);
    setFilter("");
    setShowOnlyMembers(false);
    fetch(`/api/categories/${category.id}/products`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products || []);
        const ids = new Set<string>(data.memberIds || []);
        setMemberIds(ids);
        // Pre-check current members so Replace works intuitively.
        setSelected(new Set(ids));
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, category]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return products.filter((p) => {
      if (showOnlyMembers && !memberIds.has(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, filter, showOnlyMembers, memberIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) next.add(p.id);
      return next;
    });
  };

  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) next.delete(p.id);
      return next;
    });
  };

  const performAction = async (action: Action) => {
    if (!category) return;
    if (action === "replace" && !window.confirm(REPLACE_CONFIRM)) return;

    setSaving(action);
    try {
      const res = await fetch(`/api/categories/${category.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          productIds: Array.from(selected),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }
      const data = await res.json();
      const count =
        action === "add"
          ? data.added
          : action === "remove"
          ? data.removed
          : data.replaced;
      toast.success(
        action === "add"
          ? `Added ${count} product(s) to ${category.name}`
          : action === "remove"
          ? `Removed ${count} product(s) from ${category.name}`
          : `${category.name} now has ${count} product(s)`
      );

      // Refresh memberships in place so the dialog stays usable
      const refreshed = await fetch(
        `/api/categories/${category.id}/products`
      ).then((r) => r.json());
      const ids = new Set<string>(refreshed.memberIds || []);
      setMemberIds(ids);
      setSelected(new Set(ids));
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const selectedCount = selected.size;
  const memberCount = memberIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Manage products — {category?.name ?? ""}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-brand-text-muted">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading products…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search by name or SKU"
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant={showOnlyMembers ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyMembers((v) => !v)}
              >
                In category ({memberCount})
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-text-muted">
              <span>
                {filtered.length} shown · {selectedCount} selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="hover:text-brand-primary underline-offset-2 hover:underline"
                >
                  Select all visible
                </button>
                <button
                  type="button"
                  onClick={clearVisible}
                  className="hover:text-brand-primary underline-offset-2 hover:underline"
                >
                  Clear visible
                </button>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto border rounded-lg divide-y">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-brand-text-muted">
                  No products match.
                </div>
              ) : (
                filtered.map((p) => {
                  const isMember = memberIds.has(p.id);
                  const isSelected = selected.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {p.name}
                          </span>
                          {isMember && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              <Check className="h-3 w-3 mr-0.5" />
                              In category
                            </Badge>
                          )}
                          {!p.isActive && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-brand-text-muted truncate">
                          {p.sku}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => performAction("remove")}
                disabled={saving !== null || selectedCount === 0}
              >
                {saving === "remove" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Remove selected
              </Button>
              <Button
                variant="outline"
                onClick={() => performAction("replace")}
                disabled={saving !== null}
              >
                {saving === "replace" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Replace with selection
              </Button>
              <Button
                onClick={() => performAction("add")}
                disabled={saving !== null || selectedCount === 0}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                {saving === "add" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Add selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
