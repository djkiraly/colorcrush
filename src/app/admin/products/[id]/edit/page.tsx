"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { AIProductGenerator } from "@/components/admin/AIProductGenerator";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/products/${params.id}?includeInactive=true`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          price: data.price,
          compareAtPrice: data.compareAtPrice || "",
          costPrice: data.costPrice || "",
          sku: data.sku,
          manufacturer: data.manufacturer || "",
          categoryId: data.categoryId || "",
          weight: data.weight || "",
          tags: (data.tags || []).join(", "),
          allergens: (data.allergens || []).join(", "),
          ingredients: data.ingredients || "",
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isGiftEligible: data.isGiftEligible,
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
        });
        setImages(data.images || []);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          categoryId: form.categoryId || null,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
          allergens: form.allergens ? form.allergens.split(",").map((a: string) => a.trim()) : [],
        }),
      });
      if (res.ok) {
        toast.success("Product updated!");
        router.push("/admin/products");
      } else {
        toast.error("Failed to update product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!form) return <p>Product not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
        Edit Product
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-friendly-name" />
            <p className="text-xs text-brand-text-muted">The URL path for this product (e.g. /products/{form.slug}). Must be unique.</p>
          </div>
          <AIProductGenerator
            productName={form.name}
            categoryName={categories.find((c) => c.id === form.categoryId)?.name}
            onApply={(content) => {
              setForm((f: any) => ({
                ...f,
                description: content.description,
                shortDescription: content.shortDescription,
                metaTitle: content.metaTitle,
                metaDescription: content.metaDescription,
                tags: content.tags.join(", "),
                allergens: content.allergens.join(", "),
              }));
            }}
          />
          <div className="space-y-2">
            <Label>Short Description</Label>
            <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor value={form.description} onChange={(val) => setForm({ ...form, description: val })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Compare At</Label>
              <Input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weight per item (oz)</Label>
            <Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Used for shipping cost calculation" />
          </div>
          <div className="space-y-2">
            <Label>Manufacturer / Source</Label>
            <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Where the product was sourced from" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Allergens</Label>
            <Input value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Ingredients</Label>
            <Textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={3} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
            <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /></div>
            <div className="flex items-center justify-between"><Label>Gift Eligible</Label><Switch checked={form.isGiftEligible} onCheckedChange={(v) => setForm({ ...form, isGiftEligible: v })} /></div>
          </div>
        </div>
        {/* SEO */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">SEO</h2>
          <div className="space-y-2">
            <Label>Meta Title ({(form.metaTitle || "").length}/255)</Label>
            <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Images</h2>
          <ProductImageManager
            productId={params.id as string}
            images={images}
            onChange={setImages}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
