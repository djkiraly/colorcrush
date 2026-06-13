"use client";

import { useEffect, useRef, useState } from "react";
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
import { AdminProductVariantsEditor } from "@/components/admin/AdminProductVariantsEditor";
import { ByobProductFields } from "@/components/admin/ByobProductFields";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  // Bumped after AI Apply so the affected inputs remount and re-read state —
  // works around a controlled/uncontrolled latch in @base-ui/react/input
  // that can ignore prop updates from setForm.
  const [aiApplyCount, setAiApplyCount] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([]);
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

  const groupedCategories = (() => {
    const roots = categories.filter((c) => c.parentId === null);
    const groups = roots.map((root) => ({
      root,
      children: categories
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    const orphans = categories.filter(
      (c) => c.parentId !== null && !roots.some((r) => r.id === c.parentId)
    );
    return { groups, orphans };
  })();

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
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
          categoryIds: Array.isArray(data.categoryIds) && data.categoryIds.length > 0
            ? data.categoryIds
            : data.categoryId
            ? [data.categoryId]
            : [],
          weightOz: data.weightOz != null ? String(data.weightOz) : "4",
          defaultBoxId: data.defaultBoxId || "",
          tags: (data.tags || []).join(", "),
          allergens: (data.allergens || []).join(", "),
          ingredients: data.ingredients || "",
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isGiftEligible: data.isGiftEligible,
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          hasVariants: data.hasVariants === true,
          byobEligible: data.byobEligible === true,
          byobTaste: data.byobTaste || "",
          byobColor: data.byobColor || "",
          byobFlavor: data.byobFlavor || "",
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
          weightOz: form.weightOz ? parseInt(form.weightOz, 10) : 4,
          defaultBoxId: form.defaultBoxId || null,
          categoryIds: form.categoryIds,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
          allergens: form.allergens ? form.allergens.split(",").map((a: string) => a.trim()) : [],
          byobTaste: form.byobTaste || null,
          byobColor: form.byobColor || null,
          byobFlavor: form.byobFlavor || null,
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

  if (typeof window !== "undefined") {
    console.log("[AIv2 render] aiApplyCount =", aiApplyCount, "form =", {
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      tags: form.tags,
      allergens: form.allergens,
    });
  }

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
            categoryName={categories.find((c) => c.id === form.categoryIds[0])?.name}
            onApply={(content) => {
              console.log("[AIv2] onApply fired. content =", {
                metaTitle: content.metaTitle,
                metaDescription: content.metaDescription,
                tags: content.tags,
                allergens: content.allergens,
              });
              setForm((f: any) => {
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
                console.log("[AIv2] setForm reducer next =", {
                  metaTitle: next.metaTitle,
                  metaDescription: next.metaDescription,
                  tags: next.tags,
                  allergens: next.allergens,
                });
                return next;
              });
              setAiApplyCount((n) => {
                console.log("[AIv2] bumping aiApplyCount from", n, "to", n + 1);
                return n + 1;
              });
              setTimeout(() => {
                const findInput = (id: string) =>
                  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                    `input[data-debug="${id}"], textarea[data-debug="${id}"]`
                  );
                console.log("[AIv2] DOM after 300ms:", {
                  metaTitle: findInput("metaTitle")?.value,
                  metaDescription: findInput("metaDescription")?.value,
                  tags: findInput("tags")?.value,
                  allergens: findInput("allergens")?.value,
                });
              }, 300);
            }}
          />
          <div className="space-y-2">
            <Label>Short Description</Label>
            <input
              key={`shortDescription-${aiApplyCount}`}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            />
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
            <Input
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
              value={form.defaultBoxId || ""}
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
          <div className="space-y-2">
            <Label>Manufacturer / Source</Label>
            <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Where the product was sourced from" />
          </div>
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="space-y-4 rounded-md border border-input bg-background p-3 max-h-96 overflow-y-auto">
              {categories.length === 0 && (
                <p className="text-xs text-brand-text-muted">No categories yet.</p>
              )}
              {groupedCategories.groups.map(({ root, children }) => {
                const renderCheckbox = (c: { id: string; name: string }) => {
                  const checked = (form.categoryIds as string[]).includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f: any) => ({
                            ...f,
                            categoryIds: e.target.checked
                              ? [...(f.categoryIds as string[]), c.id]
                              : (f.categoryIds as string[]).filter((id) => id !== c.id),
                          }));
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                };
                return (
                  <div key={root.id}>
                    <div className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-1">
                      {root.name}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {renderCheckbox(root)}
                      {children.map(renderCheckbox)}
                    </div>
                  </div>
                );
              })}
              {groupedCategories.orphans.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-1">Other</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {groupedCategories.orphans.map((c) => {
                      const checked = (form.categoryIds as string[]).includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setForm((f: any) => ({
                                ...f,
                                categoryIds: e.target.checked
                                  ? [...(f.categoryIds as string[]), c.id]
                                  : (f.categoryIds as string[]).filter((id) => id !== c.id),
                              }));
                            }}
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-brand-text-muted">The first selected category is used as the primary category.</p>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <input
              key={`tags-${aiApplyCount}`}
              data-debug="tags"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Allergens</Label>
            <input
              key={`allergens-${aiApplyCount}`}
              data-debug="allergens"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              value={form.allergens}
              onChange={(e) => setForm({ ...form, allergens: e.target.value })}
            />
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
            <input
              key={`metaTitle-${aiApplyCount}`}
              data-debug="metaTitle"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <textarea
              key={`metaDescription-${aiApplyCount}`}
              data-debug="metaDescription"
              className="flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              rows={2}
            />
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

        {/* Variations */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <AdminProductVariantsEditor
            productId={params.id as string}
            productImages={images}
            hasVariants={!!form.hasVariants}
            onHasVariantsChange={(v) => setForm({ ...form, hasVariants: v })}
          />
        </div>

        <ByobProductFields
          value={{
            byobEligible: !!form.byobEligible,
            byobTaste: form.byobTaste || "",
            byobColor: form.byobColor || "",
            byobFlavor: form.byobFlavor || "",
          }}
          onChange={(patch) => setForm((f: any) => ({ ...f, ...patch }))}
        />

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
