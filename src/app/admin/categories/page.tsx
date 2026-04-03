"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, FolderTree, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: "0", isActive: true, imageUrl: "" });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const body = {
      name: form.name,
      slug,
      description: form.description,
      sortOrder: parseInt(form.sortOrder),
      isActive: form.isActive,
      imageUrl: form.imageUrl || null,
    };

    const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      toast.success(editingCategory ? "Category updated!" : "Category created!");
      setDialogOpen(false);
      setEditingCategory(null);
      setForm({ name: "", slug: "", description: "", sortOrder: "0", isActive: true, imageUrl: "" });
      fetchCategories();
    } else {
      toast.error("Failed to save category");
    }
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: String(cat.sortOrder), isActive: cat.isActive, imageUrl: cat.imageUrl || "" });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", sortOrder: "0", isActive: true, imageUrl: "" });
    setDialogOpen(true);
  };

  const columns = [
    {
      key: "imageUrl",
      header: "Image",
      render: (c: any) => c.imageUrl ? (
        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
          <Image src={c.imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
        </div>
      ) : <FolderTree className="h-5 w-5 text-brand-text-muted" />,
    },
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug", render: (c: any) => <span className="text-xs font-mono">{c.slug}</span> },
    { key: "sortOrder", header: "Order" },
    {
      key: "isActive",
      header: "Status",
      render: (c: any) => <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Categories</h1>
        <Button onClick={openNew} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchable={false}
        actions={(c: any) => (
          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
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
                {uploadingImage ? "Uploading..." : (form.imageUrl ? "Replace image" : "Upload image")}
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
