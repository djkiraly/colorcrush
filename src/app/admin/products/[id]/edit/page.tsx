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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/products/${params.id}`);
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
            <Label>Short Description</Label>
            <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
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
