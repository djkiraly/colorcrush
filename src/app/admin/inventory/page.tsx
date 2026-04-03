"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Table2 } from "lucide-react";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("restock");
  const [adjustNotes, setAdjustNotes] = useState("");

  const fetchInventory = async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAdjust = async () => {
    if (!selectedItem || !adjustQty) return;
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedItem.productId,
        newQuantity: parseInt(adjustQty),
        reason: adjustReason,
        notes: adjustNotes,
      }),
    });
    if (res.ok) {
      toast.success("Inventory updated!");
      setAdjustDialog(false);
      fetchInventory();
    } else {
      toast.error("Failed to update");
    }
  };

  const getStockColor = (item: any) => {
    if (item.quantity === 0) return "bg-red-50";
    if (item.quantity <= item.lowStockThreshold) return "bg-yellow-50";
    return "";
  };

  const columns = [
    { key: "productName", header: "Product" },
    { key: "sku", header: "SKU", render: (i: any) => <span className="text-xs font-mono">{i.sku}</span> },
    {
      key: "quantity",
      header: "Quantity",
      render: (i: any) => (
        <span className={cn("font-bold", i.quantity === 0 ? "text-brand-error" : i.quantity <= i.lowStockThreshold ? "text-brand-warning" : "text-brand-success")}>
          {i.quantity}
        </span>
      ),
    },
    { key: "lowStockThreshold", header: "Low Threshold" },
    { key: "reorderPoint", header: "Reorder At" },
    {
      key: "lastRestockedAt",
      header: "Last Restocked",
      render: (i: any) => i.lastRestockedAt ? new Date(i.lastRestockedAt).toLocaleDateString() : "Never",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Inventory</h1>
        <Link href="/admin/inventory/bulk-edit">
          <Button variant="outline">
            <Table2 className="h-4 w-4 mr-2" /> Bulk Edit
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search inventory..."
        actions={(item: any) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedItem(item);
              setAdjustQty(String(item.quantity));
              setAdjustDialog(true);
            }}
          >
            Adjust
          </Button>
        )}
      />

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory: {selectedItem?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Quantity: {selectedItem?.quantity}</Label>
              <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="New quantity" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="restock">Restock</option>
                <option value="adjustment">Manual Adjustment</option>
                <option value="return">Return</option>
                <option value="damage">Damage</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
            <Button onClick={handleAdjust} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">
              Update Inventory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
