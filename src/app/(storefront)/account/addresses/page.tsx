"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Address = {
  id: string;
  label: string | null;
  recipientName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

const EMPTY_FORM = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  isDefault: false,
};

export default function AddressesPage() {
  const { status: sessionStatus } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/addresses");
      if (!res.ok) {
        setAddresses([]);
        return;
      }
      const data = await res.json();
      setAddresses(data.addresses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchAddresses();
    else if (sessionStatus === "unauthenticated") setLoading(false);
  }, [sessionStatus]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setDialogOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      label: a.label ?? "",
      recipientName: a.recipientName ?? "",
      phone: a.phone ?? "",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      zip: a.zip,
      isDefault: a.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : "/api/account/addresses";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          label: form.label.trim() || null,
          line2: form.line2.trim() || null,
          state: form.state.toUpperCase(),
          country: "US",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.details || "Failed to save");
      }
      toast.success(editingId ? "Address updated" : "Address saved");
      setDialogOpen(false);
      fetchAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Address) => {
    if (!confirm(`Delete this address? This cannot be undone.`)) return;
    setDeletingId(a.id);
    try {
      const res = await fetch(`/api/account/addresses/${a.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Address removed");
      fetchAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMakeDefault = async (a: Address) => {
    if (a.isDefault) return;
    try {
      const res = await fetch(`/api/account/addresses/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
          My Addresses
        </h1>
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <p className="text-brand-text-muted">
            Sign in to manage your addresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary">
          My Addresses
        </h1>
        <Button
          onClick={openNew}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-brand-text-muted">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading…
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <MapPin className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <p className="text-brand-text-muted mb-4">No addresses saved yet.</p>
          <Button
            onClick={openNew}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl p-5 shadow-sm border flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-brand-secondary">
                    {a.label || a.recipientName || "Address"}
                  </span>
                  {a.isDefault && (
                    <Badge className="bg-brand-mint/40 text-brand-secondary text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(a)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-brand-error" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-brand-text-secondary space-y-0.5">
                <p className="font-medium text-brand-text">{a.recipientName}</p>
                <p>{a.line1}</p>
                {a.line2 && <p>{a.line2}</p>}
                <p>
                  {a.city}, {a.state} {a.zip}
                </p>
                {a.phone && <p className="text-brand-text-muted">{a.phone}</p>}
              </div>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => handleMakeDefault(a)}
                  className="text-xs text-brand-primary hover:underline inline-flex items-center gap-1 self-start"
                >
                  <Star className="h-3 w-3" /> Make default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit address" : "Add a new address"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="Home, Work, Mom's"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input
                  id="recipientName"
                  required
                  value={form.recipientName}
                  onChange={(e) =>
                    setForm({ ...form, recipientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  inputMode="tel"
                  placeholder="(555) 555-5555"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="line1">Street address</Label>
                <Input
                  id="line1"
                  required
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="line2">Apartment, suite (optional)</Label>
                <Input
                  id="line2"
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  required
                  maxLength={2}
                  placeholder="NE"
                  value={form.state}
                  onChange={(e) =>
                    setForm({ ...form, state: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  required
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default address
              </Label>
              <Switch
                id="isDefault"
                checked={form.isDefault}
                onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? "Save changes" : "Save address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
