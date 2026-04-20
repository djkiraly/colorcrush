"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, FolderTree, Upload, Trash2, Loader2 } from "lucide-react";
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
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "0",
    isActive: true,
    imageUrl: "",
    parentId: "" as string,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const { roots, childrenByParent, descendantsOf } = useMemo(() => {
    const roots: Category[] = [];
    const childrenByParent = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentId === null) {
        roots.push(c);
      } else {
        const list = childrenByParent.get(c.parentId) ?? [];
        list.push(c);
        childrenByParent.set(c.parentId, list);
      }
    }
    const sortBy = (a: Category, b: Category) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    roots.sort(sortBy);
    for (const list of childrenByParent.values()) list.sort(sortBy);

    const descendantsOf = (id: string): Set<string> => {
      const out = new Set<string>();
      const walk = (parentId: string) => {
        for (const child of childrenByParent.get(parentId) ?? []) {
          out.add(child.id);
          walk(child.id);
        }
      };
      walk(id);
      return out;
    };

    return { roots, childrenByParent, descendantsOf };
  }, [categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const body = {
      name: form.name,
      slug,
      description: form.description,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive,
      imageUrl: form.imageUrl || null,
      parentId: form.parentId || null,
    };

    const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      toast.success(editingCategory ? "Category updated!" : "Category created!");
      setDialogOpen(false);
      setEditingCategory(null);
      setForm({ name: "", slug: "", description: "", sortOrder: "0", isActive: true, imageUrl: "", parentId: "" });
      fetchCategories();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error || "Failed to save category");
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
      imageUrl: cat.imageUrl || "",
      parentId: cat.parentId || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", sortOrder: "0", isActive: true, imageUrl: "", parentId: "" });
    setDialogOpen(true);
  };

  const parentOptions = useMemo(() => {
    const excluded = new Set<string>();
    if (editingCategory) {
      excluded.add(editingCategory.id);
      for (const d of descendantsOf(editingCategory.id)) excluded.add(d);
    }
    return categories.filter((c) => !excluded.has(c.id));
  }, [categories, descendantsOf, editingCategory]);

  const renderRow = (cat: Category, depth: number) => {
    const kids = childrenByParent.get(cat.id) ?? [];
    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {cat.imageUrl ? (
            <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
              <Image src={cat.imageUrl} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
            </div>
          ) : (
            <FolderTree className="h-5 w-5 text-brand-text-muted flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{cat.name}</div>
            <div className="text-xs font-mono text-brand-text-muted truncate">{cat.slug}</div>
          </div>
          <span className="text-xs text-brand-text-muted w-12 text-right">#{cat.sortOrder}</span>
          <Badge className={cat.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {cat.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        {kids.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Categories</h1>
        <Button onClick={openNew} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {roots.length === 0 ? (
          <div className="py-8 text-center text-brand-text-muted text-sm">No categories yet.</div>
        ) : (
          roots.map((root) => renderRow(root, 0))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parent</Label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">— Top level —</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parentId ? `— ${p.name}` : p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            <div className="space-y-2">
              <Label>Feature Image</Label>
              {form.imageUrl && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mb-2">
                  <Image src={form.imageUrl} alt="Category image" width={80} height={80} className="h-16 w-16 rounded object-cover" unoptimized />
                  <span className="text-xs text-brand-text-muted truncate flex-1">Current image</span>
                  <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="p-1 text-red-500 hover:text-red-700" title="Remove image">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <label className="cursor-pointer flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors text-sm text-brand-text-muted">
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingImage ? "Uploading..." : form.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    try {
                      const urlRes = await fetch("/api/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileName: file.name, contentType: file.type, pathPrefix: "categories" }),
                      });
                      if (!urlRes.ok) throw new Error();
                      const { uploadUrl, publicUrl } = await urlRes.json();
                      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                      setForm((f) => ({ ...f, imageUrl: publicUrl }));
                    } catch {
                      toast.error("Failed to upload image");
                    } finally {
                      setUploadingImage(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
