"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AIProductGenerator } from "@/components/admin/AIProductGenerator";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [boxes, setBoxes] = useState<
    { id: string; name: string; maxWeightOz: number; isActive: boolean }[]
  >([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/admin/shipping-boxes")
      .then((r) => r.json())
      .then((d) => setBoxes((d.boxes || []).filter((b: { isActive: boolean }) => b.isActive)))
      .catch(() => {});
  }, []);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    weightOz: "4",
    defaultBoxId: "",
    sku: "",
    manufacturer: "",
    weight: "",
    categoryIds: [] as string[],
    tags: "",
    isActive: true,
    isFeatured: false,
    isGiftEligible: true,
    allergens: "",
    ingredients: "",
    metaTitle: "",
    metaDescription: "",
  });

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          weightOz: form.weightOz ? parseInt(form.weightOz, 10) : 4,
          defaultBoxId: form.defaultBoxId || null,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
          allergens: form.allergens ? form.allergens.split(",").map((a) => a.trim()) : [],
          categoryIds: form.categoryIds,
        }),
      });

      if (res.ok) {
        const product = await res.json();
        toast.success("Product created! Add images now.");
        router.push(`/admin/products/${product.id}/edit`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
        New Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <AIProductGenerator
            productName={form.name}
            categoryName={categories.find(c => c.id === form.categoryIds[0])?.name}
            onApply={(content) => {
              console.log("[AI Apply] AI returned:");
              console.log("  metaTitle =", JSON.stringify(content.metaTitle));
              console.log("  metaDescription =", JSON.stringify(content.metaDescription));
              console.log("  tags =", JSON.stringify(content.tags));
              console.log("  allergens =", JSON.stringify(content.allergens));
              setForm((f) => {
                const next = {
                  ...f,
                  description: content.description || f.description,
                  shortDescription: content.shortDescription || f.shortDescription,
                  metaTitle: content.metaTitle ?? f.metaTitle,
                  metaDescription: content.metaDescription ?? f.metaDescription,
                  tags:
                    Array.isArray(content.tags) && content.tags.length > 0
                      ? content.tags.join(", ")
                      : f.tags,
                  allergens:
                    Array.isArray(content.allergens) && content.allergens.length > 0
                      ? content.allergens.join(", ")
                      : f.allergens,
                };
                console.log("[AI Apply] form state after merge:");
                console.log("  form.metaTitle =", JSON.stringify(next.metaTitle));
                console.log("  form.metaDescription =", JSON.stringify(next.metaDescription));
                console.log("  form.tags =", JSON.stringify(next.tags));
                console.log("  form.allergens =", JSON.stringify(next.allergens));
                return next;
              });
              setTimeout(() => {
                console.log("[AI Apply] DOM after render:");
                const inputs = Array.from(
                  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
                    "input, textarea"
                  )
                );
                for (const el of inputs) {
                  const label = el
                    .closest(".space-y-2")
                    ?.querySelector("label")
                    ?.textContent?.trim();
                  if (label && /meta|tags|allergens/i.test(label)) {
                    console.log(`  «${label}» →`, JSON.stringify(el.value));
                  }
                }
              }, 50);
            }}
          />
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input id="shortDescription" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <RichTextEditor value={form.description} onChange={(val) => setForm({ ...form, description: val })} />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare At Price</Label>
              <Input id="compareAtPrice" type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if left blank" />
              <p className="text-xs text-brand-text-muted">Format: CATG-PROD-0001. Leave blank to auto-generate from category and product name.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight per item (oz)</Label>
              <Input id="weight" type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Used for shipping cost calculation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightOz">Shipping weight (oz)</Label>
              <Input
                id="weightOz"
                type="number"
                step="1"
                min="0"
                value={form.weightOz}
                onChange={(e) => setForm({ ...form, weightOz: e.target.value })}
                placeholder="4"
              />
              {(!form.weightOz || parseInt(form.weightOz, 10) === 0) && (
                <p className="text-xs text-amber-700">
                  ⚠️ Using default weight — set actual weight for accurate shipping rates.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultBoxId">Default shipping box</Label>
              <select
                id="defaultBoxId"
                value={form.defaultBoxId}
                onChange={(e) => setForm({ ...form, defaultBoxId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Auto (by weight)</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (≤ {b.maxWeightOz} oz)
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-text-muted">
                Forces this product into the chosen carton when calculating shipping. Cart with mixed
                products uses the largest declared box.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer / Source</Label>
            <Input id="manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Where the product was sourced from" />
          </div>
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-md border border-input bg-background p-3 max-h-56 overflow-y-auto">
              {categories.length === 0 && (
                <p className="text-xs text-brand-text-muted col-span-full">No categories yet.</p>
              )}
              {categories.map((c) => {
                const checked = form.categoryIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          categoryIds: e.target.checked
                            ? [...f.categoryIds, c.id]
                            : f.categoryIds.filter((id) => id !== c.id),
                        }));
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-brand-text-muted">The first selected category is used as the primary category for SKU generation.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vegan, gluten-free, bestseller" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergens">Allergens (comma separated)</Label>
            <Input id="allergens" value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder="milk, soy, tree nuts" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea id="ingredients" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={3} />
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">SEO</h2>
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title ({form.metaTitle.length}/255)</Label>
            <Input id="metaTitle" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea id="metaDescription" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} />
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-heading font-semibold">Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Gift Eligible</Label>
              <Switch checked={form.isGiftEligible} onCheckedChange={(v) => setForm({ ...form, isGiftEligible: v })} />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8">
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
