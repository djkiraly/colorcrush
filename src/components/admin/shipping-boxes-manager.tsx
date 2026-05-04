"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

interface ShippingBox {
  id: string;
  name: string;
  lengthIn: string;
  widthIn: string;
  heightIn: string;
  maxWeightOz: number;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_NEW = {
  name: "",
  lengthIn: "",
  widthIn: "",
  heightIn: "",
  maxWeightOz: "",
  sortOrder: "0",
};

export function ShippingBoxesManager() {
  const [boxes, setBoxes] = useState<ShippingBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newBox, setNewBox] = useState({ ...EMPTY_NEW });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipping-boxes");
      const data = await res.json();
      if (res.ok) setBoxes(data.boxes || []);
      else toast.error(data.error || "Failed to load boxes");
    } catch {
      toast.error("Failed to load boxes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function update(
    id: string,
    patch: {
      name?: string;
      lengthIn?: number;
      widthIn?: number;
      heightIn?: number;
      maxWeightOz?: number;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    setBusyId(id);
    try {
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.lengthIn !== undefined) body.lengthIn = parseFloat(String(patch.lengthIn));
      if (patch.widthIn !== undefined) body.widthIn = parseFloat(String(patch.widthIn));
      if (patch.heightIn !== undefined) body.heightIn = parseFloat(String(patch.heightIn));
      if (patch.maxWeightOz !== undefined) body.maxWeightOz = patch.maxWeightOz;
      if (patch.isActive !== undefined) body.isActive = patch.isActive;
      if (patch.sortOrder !== undefined) body.sortOrder = patch.sortOrder;

      const res = await fetch(`/api/admin/shipping-boxes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBoxes((prev) => prev.map((b) => (b.id === id ? data.box : b)));
      toast.success("Box updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete box "${name}"? Live-rate orders will use the next-largest active box.`))
      return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/shipping-boxes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBoxes((prev) => prev.filter((b) => b.id !== id));
      toast.success("Box deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function create() {
    if (!newBox.name || !newBox.lengthIn || !newBox.widthIn || !newBox.heightIn || !newBox.maxWeightOz) {
      toast.error("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/shipping-boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBox.name.trim(),
          lengthIn: parseFloat(newBox.lengthIn),
          widthIn: parseFloat(newBox.widthIn),
          heightIn: parseFloat(newBox.heightIn),
          maxWeightOz: parseInt(newBox.maxWeightOz, 10),
          sortOrder: parseInt(newBox.sortOrder || "0", 10),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBoxes((prev) => [...prev, data.box]);
      setNewBox({ ...EMPTY_NEW });
      toast.success("Box created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-text-muted">Loading boxes…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand-text-muted">
        Boxes are picked smallest-first whose <strong>max weight</strong> covers the cart total.
        If nothing fits, the largest active box is used. Inactive boxes are skipped.
      </p>

      {boxes.length === 0 && (
        <p className="text-sm text-amber-700">
          No boxes configured. Live-rate carts will fail until at least one active box exists.
        </p>
      )}

      <div className="space-y-3">
        {boxes.map((box) => (
          <BoxRow
            key={box.id}
            box={box}
            busy={busyId === box.id}
            onSave={(patch) => update(box.id, patch)}
            onDelete={() => remove(box.id, box.name)}
            onToggle={(isActive) => update(box.id, { isActive })}
          />
        ))}
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-200 p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add a box
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-2 space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={newBox.name}
              onChange={(e) => setNewBox({ ...newBox, name: e.target.value })}
              placeholder="e.g. Premium Gift Box"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">L (in)</Label>
            <Input
              type="number"
              step="0.01"
              value={newBox.lengthIn}
              onChange={(e) => setNewBox({ ...newBox, lengthIn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">W (in)</Label>
            <Input
              type="number"
              step="0.01"
              value={newBox.widthIn}
              onChange={(e) => setNewBox({ ...newBox, widthIn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">H (in)</Label>
            <Input
              type="number"
              step="0.01"
              value={newBox.heightIn}
              onChange={(e) => setNewBox({ ...newBox, heightIn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max weight (oz)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              value={newBox.maxWeightOz}
              onChange={(e) => setNewBox({ ...newBox, maxWeightOz: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={create} disabled={creating} className="mt-3">
          <Plus className="h-4 w-4" /> {creating ? "Adding…" : "Add box"}
        </Button>
      </div>
    </div>
  );
}

function BoxRow({
  box,
  busy,
  onSave,
  onDelete,
  onToggle,
}: {
  box: ShippingBox;
  busy: boolean;
  onSave: (patch: {
    name: string;
    lengthIn: number;
    widthIn: number;
    heightIn: number;
    maxWeightOz: number;
    sortOrder: number;
  }) => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}) {
  const [draft, setDraft] = useState({
    name: box.name,
    lengthIn: box.lengthIn,
    widthIn: box.widthIn,
    heightIn: box.heightIn,
    maxWeightOz: String(box.maxWeightOz),
    sortOrder: String(box.sortOrder),
  });

  // Reset draft when underlying box changes (e.g. after toggle save)
  useEffect(() => {
    Promise.resolve().then(() =>
      setDraft({
        name: box.name,
        lengthIn: box.lengthIn,
        widthIn: box.widthIn,
        heightIn: box.heightIn,
        maxWeightOz: String(box.maxWeightOz),
        sortOrder: String(box.sortOrder),
      })
    );
  }, [box]);

  const dirty =
    draft.name !== box.name ||
    parseFloat(draft.lengthIn) !== parseFloat(box.lengthIn) ||
    parseFloat(draft.widthIn) !== parseFloat(box.widthIn) ||
    parseFloat(draft.heightIn) !== parseFloat(box.heightIn) ||
    parseInt(draft.maxWeightOz, 10) !== box.maxWeightOz ||
    parseInt(draft.sortOrder, 10) !== box.sortOrder;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
        <div className="col-span-2 md:col-span-2 space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">L (in)</Label>
          <Input
            type="number"
            step="0.01"
            value={draft.lengthIn}
            onChange={(e) => setDraft({ ...draft, lengthIn: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">W (in)</Label>
          <Input
            type="number"
            step="0.01"
            value={draft.widthIn}
            onChange={(e) => setDraft({ ...draft, widthIn: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">H (in)</Label>
          <Input
            type="number"
            step="0.01"
            value={draft.heightIn}
            onChange={(e) => setDraft({ ...draft, heightIn: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max (oz)</Label>
          <Input
            type="number"
            step="1"
            min="1"
            value={draft.maxWeightOz}
            onChange={(e) => setDraft({ ...draft, maxWeightOz: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort</Label>
          <Input
            type="number"
            step="1"
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={box.isActive} onCheckedChange={onToggle} disabled={busy} />
          <span className={box.isActive ? "" : "text-brand-text-muted"}>
            {box.isActive ? "Active" : "Inactive"}
          </span>
        </label>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={busy}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        <Button
          size="sm"
          onClick={() =>
            onSave({
              name: draft.name,
              lengthIn: parseFloat(draft.lengthIn),
              widthIn: parseFloat(draft.widthIn),
              heightIn: parseFloat(draft.heightIn),
              maxWeightOz: parseInt(draft.maxWeightOz, 10),
              sortOrder: parseInt(draft.sortOrder, 10),
            })
          }
          disabled={busy || !dirty}
        >
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}
