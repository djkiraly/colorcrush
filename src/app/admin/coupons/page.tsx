"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "percentage", value: "", minOrderAmount: "", maxUses: "", expiresAt: "",
  });

  const fetchCoupons = async () => {
    const res = await fetch("/api/coupons");
    const data = await res.json();
    setCoupons(data.coupons || []);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
      }),
    });
    if (res.ok) {
      toast.success("Coupon created!");
      setDialogOpen(false);
      setForm({ code: "", type: "percentage", value: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
      fetchCoupons();
    } else {
      toast.error("Failed to create coupon");
    }
  };

  const columns = [
    { key: "code", header: "Code", render: (c: any) => <span className="font-mono font-bold">{c.code}</span> },
    { key: "type", header: "Type", render: (c: any) => <span className="capitalize">{c.type.replace("_", " ")}</span> },
    {
      key: "value", header: "Value", render: (c: any) =>
        c.type === "percentage" ? `${c.value}%` : c.type === "fixed" ? `$${c.value}` : "Free Ship",
    },
    { key: "minOrderAmount", header: "Min Order", render: (c: any) => c.minOrderAmount ? `$${c.minOrderAmount}` : "—" },
    { key: "usedCount", header: "Used", render: (c: any) => `${c.usedCount}${c.maxUses ? `/${c.maxUses}` : ""}` },
    {
      key: "isActive", header: "Status",
      render: (c: any) => <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
    },
    { key: "expiresAt", header: "Expires", render: (c: any) => c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Coupons</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <DataTable columns={columns} data={coupons} searchable={false} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Value</Label><Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Min Order Amount</Label><Input type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></div>
            <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
            <div className="space-y-2"><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">Create Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
