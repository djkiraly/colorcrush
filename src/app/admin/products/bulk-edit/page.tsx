"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  manufacturer: string | null;
  weight: string | null;
  categoryId: string | null;
  shortDescription: string | null;
  description: string | null;
  tags: string[] | null;
  allergens: string[] | null;
  ingredients: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isGiftEligible: boolean;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

export default function BulkEditPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/products/bulk");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setCategories(data.categories);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const updateProduct = useCallback(
    (id: string, field: string, value: unknown) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
      setDirty((prev) => new Set(prev).add(id));
    },
    []
  );

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    const changed = products.filter((p) => dirty.has(p.id));
    if (changed.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const payload = changed.map((p) => ({
        ...p,
        price: parseFloat(p.price),
        compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
        costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
        weight: p.weight ? parseFloat(p.weight) : null,
        stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0,
      }));

      const res = await fetch("/api/products/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.updatedCount} product(s) updated`);
        setDirty(new Set());
      } else {
        toast.error("Failed to save changes");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-secondary">
              Bulk Edit Products
            </h1>
            <p className="text-sm text-brand-text-muted">
              {products.length} products &middot;{" "}
              {dirty.size > 0 ? (
                <span className="text-brand-primary font-medium">
                  {dirty.size} unsaved change(s)
                </span>
              ) : (
                "No changes"
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || dirty.size === 0}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : `Save Changes (${dirty.size})`}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-2 py-3 w-8"></th>
                <th className="px-3 py-3 font-medium min-w-[180px]">Name</th>
                <th className="px-3 py-3 font-medium min-w-[100px]">SKU</th>
                <th className="px-3 py-3 font-medium min-w-[90px]">Price</th>
                <th className="px-3 py-3 font-medium min-w-[90px]">Compare</th>
                <th className="px-3 py-3 font-medium min-w-[90px]">Cost</th>
                <th className="px-3 py-3 font-medium min-w-[140px]">Manufacturer</th>
                <th className="px-3 py-3 font-medium min-w-[80px]">Weight</th>
                <th className="px-3 py-3 font-medium min-w-[80px]">Stock</th>
                <th className="px-3 py-3 font-medium min-w-[140px]">Category</th>
                <th className="px-3 py-3 font-medium w-14 text-center">Active</th>
                <th className="px-3 py-3 font-medium w-14 text-center">Feat.</th>
                <th className="px-3 py-3 font-medium w-14 text-center">Gift</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  categories={categories}
                  expanded={expandedRows.has(p.id)}
                  isDirty={dirty.has(p.id)}
                  onToggleExpand={() => toggleExpanded(p.id)}
                  onChange={updateProduct}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  categories,
  expanded,
  isDirty,
  onToggleExpand,
  onChange,
}: {
  product: Product;
  categories: Category[];
  expanded: boolean;
  isDirty: boolean;
  onToggleExpand: () => void;
  onChange: (id: string, field: string, value: unknown) => void;
}) {
  const p = product;
  const id = p.id;

  return (
    <>
      <tr
        className={`border-b hover:bg-gray-50/50 ${isDirty ? "bg-brand-primary/5" : ""}`}
      >
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-gray-200"
            title="Show content fields"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-brand-text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-brand-text-muted" />
            )}
          </button>
        </td>
        <td className="px-3 py-2">
          <Input
            value={p.name}
            onChange={(e) => onChange(id, "name", e.target.value)}
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            value={p.sku}
            onChange={(e) => onChange(id, "sku", e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            step="0.01"
            value={p.price}
            onChange={(e) => onChange(id, "price", e.target.value)}
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            step="0.01"
            value={p.compareAtPrice || ""}
            onChange={(e) =>
              onChange(id, "compareAtPrice", e.target.value || null)
            }
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            step="0.01"
            value={p.costPrice || ""}
            onChange={(e) =>
              onChange(id, "costPrice", e.target.value || null)
            }
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            value={p.manufacturer || ""}
            onChange={(e) =>
              onChange(id, "manufacturer", e.target.value || null)
            }
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            step="0.01"
            value={p.weight || ""}
            onChange={(e) =>
              onChange(id, "weight", e.target.value || null)
            }
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            step="1"
            min="0"
            value={p.stock ?? 0}
            onChange={(e) =>
              onChange(id, "stock", e.target.value === "" ? 0 : parseInt(e.target.value, 10))
            }
            className="h-8 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={p.categoryId || ""}
            onChange={(e) =>
              onChange(id, "categoryId", e.target.value || null)
            }
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 text-center">
          <Switch
            checked={p.isActive}
            onCheckedChange={(v) => onChange(id, "isActive", v)}
          />
        </td>
        <td className="px-3 py-2 text-center">
          <Switch
            checked={p.isFeatured}
            onCheckedChange={(v) => onChange(id, "isFeatured", v)}
          />
        </td>
        <td className="px-3 py-2 text-center">
          <Switch
            checked={p.isGiftEligible}
            onCheckedChange={(v) => onChange(id, "isGiftEligible", v)}
          />
        </td>
      </tr>
      {expanded && (
        <tr className={`border-b ${isDirty ? "bg-brand-primary/5" : "bg-gray-50/50"}`}>
          <td></td>
          <td colSpan={11} className="px-3 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-muted">
                  Short Description
                </label>
                <Input
                  value={p.shortDescription || ""}
                  onChange={(e) =>
                    onChange(id, "shortDescription", e.target.value || null)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-muted">
                  Tags (comma separated)
                </label>
                <Input
                  value={(p.tags || []).join(", ")}
                  onChange={(e) =>
                    onChange(
                      id,
                      "tags",
                      e.target.value
                        ? e.target.value.split(",").map((t) => t.trim())
                        : []
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-muted">
                  Allergens (comma separated)
                </label>
                <Input
                  value={(p.allergens || []).join(", ")}
                  onChange={(e) =>
                    onChange(
                      id,
                      "allergens",
                      e.target.value
                        ? e.target.value.split(",").map((a) => a.trim())
                        : []
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-muted">
                  Ingredients
                </label>
                <Input
                  value={p.ingredients || ""}
                  onChange={(e) =>
                    onChange(id, "ingredients", e.target.value || null)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-brand-text-muted">
                  Description
                </label>
                <textarea
                  value={p.description || ""}
                  onChange={(e) =>
                    onChange(id, "description", e.target.value || null)
                  }
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
