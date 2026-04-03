"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  [key: string]: unknown;
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    const res = await fetch("/api/coupons");
    const data = await res.json();
    setCoupons(data.coupons || []);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount ?? "",
      maxUses: coupon.maxUses?.toString() ?? "",
      startsAt: coupon.startsAt ? coupon.startsAt.split("T")[0] : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const toggleActive = async (coupon: Coupon) => {
    const res = await fetch(`/api/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    if (res.ok) {
      toast.success(`Coupon ${coupon.isActive ? "deactivated" : "activated"}`);
      fetchCoupons();
    } else {
      toast.error("Failed to update coupon");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      value: parseFloat(form.value),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      startsAt: form.startsAt ? new Date(form.startsAt) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
    };

    const isEdit = !!editingCoupon;
    const url = isEdit ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(isEdit ? "Coupon updated!" : "Coupon created!");
      setDialogOpen(false);
      setEditingCoupon(null);
      setForm(emptyForm);
      fetchCoupons();
    } else {
      toast.error(isEdit ? "Failed to update coupon" : "Failed to create coupon");
    }
  };

  const columns = [
    { key: "code", header: "Code", render: (c: Coupon) => <span className="font-mono font-bold">{c.code}</span> },
    { key: "type", header: "Type", render: (c: Coupon) => <span className="capitalize">{c.type.replace("_", " ")}</span> },
    {
      key: "value", header: "Value", render: (c: Coupon) =>
        c.type === "percentage" ? `${c.value}%` : c.type === "fixed" ? `$${c.value}` : "Free Ship",
    },
    { key: "minOrderAmount", header: "Min Order", render: (c: Coupon) => c.minOrderAmount ? `$${c.minOrderAmount}` : "—" },
    { key: "usedCount", header: "Used", render: (c: Coupon) => `${c.usedCount}${c.maxUses ? `/${c.maxUses}` : ""}` },
    {
      key: "isActive", header: "Status",
      render: (c: Coupon) => <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
    },
    { key: "expiresAt", header: "Expires", render: (c: Coupon) => c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Coupons</h1>
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        searchable={false}
        actions={(coupon: Coupon) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleActive(coupon)} title={coupon.isActive ? "Deactivate" : "Activate"}>
              {coupon.isActive
                ? <ToggleRight className="h-4 w-4 text-green-600" />
                : <ToggleLeft className="h-4 w-4 text-gray-400" />
              }
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCoupon(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCoupon ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{form.type === "percentage" ? "Value (%)" : form.type === "fixed" ? "Value ($)" : "Value"}</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Min Order Amount ($)</Label>
              <Input type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="No minimum" />
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts At</Label>
                <Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">
              {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
