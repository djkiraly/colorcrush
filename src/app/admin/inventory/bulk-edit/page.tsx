"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockedAt: string | null;
}

export default function BulkEditInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const updateItem = useCallback(
    (productId: string, field: string, value: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, [field]: value } : i
        )
      );
      setDirty((prev) => new Set(prev).add(productId));
    },
    []
  );

  const handleSave = async () => {
    const changed = items.filter((i) => dirty.has(i.productId));
    if (changed.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: changed.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            lowStockThreshold: i.lowStockThreshold,
            reorderPoint: i.reorderPoint,
            reorderQuantity: i.reorderQuantity,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.updatedCount} item(s) updated`);
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
            onClick={() => router.push("/admin/inventory")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-secondary">
              Bulk Edit Inventory
            </h1>
            <p className="text-sm text-brand-text-muted">
              {items.length} items &middot;{" "}
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
                <th className="px-3 py-3 font-medium min-w-[200px]">Product</th>
                <th className="px-3 py-3 font-medium min-w-[100px]">SKU</th>
                <th className="px-3 py-3 font-medium min-w-[100px]">Quantity</th>
                <th className="px-3 py-3 font-medium min-w-[120px]">Low Threshold</th>
                <th className="px-3 py-3 font-medium min-w-[110px]">Reorder At</th>
                <th className="px-3 py-3 font-medium min-w-[110px]">Reorder Qty</th>
                <th className="px-3 py-3 font-medium min-w-[120px]">Last Restocked</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isDirty = dirty.has(item.productId);
                const isLow =
                  item.quantity <= item.lowStockThreshold;
                const isOut = item.quantity === 0;

                return (
                  <tr
                    key={item.productId}
                    className={cn(
                      "border-b hover:bg-gray-50/50",
                      isDirty && "bg-brand-primary/5",
                      !isDirty && isOut && "bg-red-50/50",
                      !isDirty && isLow && !isOut && "bg-yellow-50/50"
                    )}
                  >
                    <td className="px-3 py-2 font-medium">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={cn(
                          "h-8 text-sm w-24",
                          isOut && "border-red-300",
                          isLow && !isOut && "border-yellow-300"
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.lowStockThreshold}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "lowStockThreshold",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.reorderPoint}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "reorderPoint",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.reorderQuantity}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "reorderQuantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm w-24"
                      />
                    </td>
                    <td className="px-3 py-2 text-brand-text-muted text-xs">
                      {item.lastRestockedAt
                        ? new Date(item.lastRestockedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
