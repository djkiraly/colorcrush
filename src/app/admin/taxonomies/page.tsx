"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  colorHex: string | null;
};

type RootKind = "type" | "color" | "event";

const ROOTS: Record<RootKind, { slug: string; label: string; description: string }> = {
  type: {
    slug: "shop-by-type",
    label: "Types",
    description:
      "Candy types — Chocolate, Gummies, Hard Candies, etc. Customers filter by these on /products.",
  },
  color: {
    slug: "shop-by-color",
    label: "Colors",
    description:
      "Color tags with optional hex swatches that show on the storefront filter.",
  },
  event: {
    slug: "shop-by-event",
    label: "Events",
    description: "Occasions — Wedding, Birthday, Christmas, etc.",
  },
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminTaxonomiesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<RootKind>("type");
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const rootByKind = useMemo(() => {
    const map = new Map<RootKind, Category | undefined>();
    for (const kind of Object.keys(ROOTS) as RootKind[]) {
      map.set(kind, categories.find((c) => c.slug === ROOTS[kind].slug && c.parentId === null));
    }
    return map;
  }, [categories]);

  const childrenOf = (rootId: string | undefined) => {
    if (!rootId) return [];
    return categories
      .filter((c) => c.parentId === rootId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Taxonomies</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Manage the values customers can filter products by. For arbitrary category trees, use the{" "}
          <a className="underline" href="/admin/categories">
            full Categories editor
          </a>
          .
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-brand-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RootKind)}>
          <TabsList variant="line" className="w-full justify-start">
            {(Object.keys(ROOTS) as RootKind[]).map((kind) => (
              <TabsTrigger key={kind} value={kind} className="px-4">
                {ROOTS[kind].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(ROOTS) as RootKind[]).map((kind) => {
            const root = rootByKind.get(kind);
            return (
              <TabsContent key={kind} value={kind}>
                <p className="text-sm text-brand-text-muted mb-4">{ROOTS[kind].description}</p>
                {root ? (
                  <TaxonomyEditor
                    kind={kind}
                    rootId={root.id}
                    items={childrenOf(root.id)}
                    onChanged={fetchCategories}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
                    Root category <code>{ROOTS[kind].slug}</code> not found. Create it in the{" "}
                    <a className="underline" href="/admin/categories">
                      Categories editor
                    </a>{" "}
                    first.
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function TaxonomyEditor({
  kind,
  rootId,
  items,
  onChanged,
}: {
  kind: RootKind;
  rootId: string;
  items: Category[];
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#FF0000");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        slug: slugify(newName),
        parentId: rootId,
        sortOrder: items.length,
        isActive: true,
      };
      if (kind === "color") body.colorHex = newColor;
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed");
      }
      setNewName("");
      setNewColor("#FF0000");
      toast.success(`${ROOTS[kind].label.replace(/s$/, "")} added`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="py-8 text-center text-brand-text-muted text-sm">
            No {ROOTS[kind].label.toLowerCase()} yet.
          </div>
        ) : (
          items.map((item) => (
            <TaxonomyRow key={item.id} kind={kind} item={item} onChanged={onChanged} />
          ))
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
        <Input
          placeholder={`New ${ROOTS[kind].label.toLowerCase().replace(/s$/, "")} name…`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1"
        />
        {kind === "color" && (
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-12 rounded border border-input cursor-pointer"
            aria-label="Pick swatch color"
          />
        )}
        <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

function TaxonomyRow({
  kind,
  item,
  onChanged,
}: {
  kind: RootKind;
  item: Category;
  onChanged: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [colorHex, setColorHex] = useState(item.colorHex || "#FF0000");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [isActive, setIsActive] = useState(item.isActive);
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty =
    name !== item.name ||
    sortOrder !== String(item.sortOrder) ||
    isActive !== item.isActive ||
    imageUrl !== (item.imageUrl || "") ||
    (kind === "color" && colorHex !== (item.colorHex || "#FF0000"));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        sortOrder: parseInt(sortOrder) || 0,
        isActive,
        imageUrl: imageUrl || null,
      };
      if (kind === "color") body.colorHex = colorHex;
      const res = await fetch(`/api/categories/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
      onChanged();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const urlRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          pathPrefix: "categories",
        }),
      });
      if (!urlRes.ok) throw new Error();
      const { uploadUrl, publicUrl } = await urlRes.json();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setImageUrl(publicUrl);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}"? Products tagged with this will lose the tag.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50">
      {kind === "color" ? (
        <input
          type="color"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          className="h-8 w-10 rounded border border-input cursor-pointer flex-shrink-0"
          aria-label={`${item.name} swatch color`}
        />
      ) : imageUrl ? (
        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt=""
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <label className="w-10 h-10 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer flex-shrink-0">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-text-muted" />
          ) : (
            <Upload className="h-4 w-4 text-brand-text-muted" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}

      <div className="flex-1 min-w-0">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm font-medium border-0 bg-transparent shadow-none focus-visible:ring-1 px-1"
        />
        <div className="text-xs font-mono text-brand-text-muted truncate px-1">{item.slug}</div>
      </div>

      <div className="flex items-center gap-1">
        <Label htmlFor={`sort-${item.id}`} className="text-xs text-brand-text-muted">
          #
        </Label>
        <Input
          id={`sort-${item.id}`}
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="h-8 w-14 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {kind !== "color" && imageUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setImageUrl("")}
          aria-label="Remove image"
        >
          <Trash2 className="h-4 w-4 text-brand-text-muted" />
        </Button>
      )}

      <Button
        size="sm"
        onClick={handleSave}
        disabled={!dirty || saving}
        className="bg-brand-primary hover:bg-brand-primary-hover text-white"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={deleting}
        className="text-brand-error hover:text-brand-error"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
