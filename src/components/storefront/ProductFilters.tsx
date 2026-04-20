"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const TAGS = [
  "vegan",
  "sugar-free",
  "gluten-free",
  "nut-free",
  "bestseller",
  "new",
  "gift",
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name: A-Z" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ProductFiltersProps {
  categories: Category[];
  onClose?: () => void;
}

export function ProductFilters({ categories, onClose }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "featured";
  const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const minPrice = parseInt(searchParams.get("minPrice") || "0");
  const maxPrice = parseInt(searchParams.get("maxPrice") || "100");

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const toggleTag = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
  };

  const resetFilters = () => {
    router.push(window.location.pathname);
  };

  const hasFilters =
    currentCategory || currentTags.length > 0 || minPrice > 0 || maxPrice < 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-brand-secondary">
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear All
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-medium text-brand-text mb-2">Sort By</h4>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams({ sort: opt.value })}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                currentSort === opt.value
                  ? "bg-brand-primary/10 text-brand-primary font-medium"
                  : "text-brand-text-secondary hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories (grouped by root) */}
      <CategorySection
        categories={categories}
        currentCategory={currentCategory}
        onSelect={(slug) => updateParams({ category: slug })}
      />

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-brand-text mb-2">
          Price Range
        </h4>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[minPrice, maxPrice]}
          onValueChange={(value) => {
            const vals = Array.isArray(value) ? value : [value];
            updateParams({
              minPrice: vals[0] > 0 ? String(vals[0]) : null,
              maxPrice: (vals[1] ?? 100) < 100 ? String(vals[1]) : null,
            });
          }}
          className="my-4"
        />
        <div className="flex justify-between text-sm text-brand-text-muted">
          <span>${minPrice}</span>
          <span>${maxPrice}+</span>
        </div>
      </div>

      {/* Tags (attribute/dietary) */}
      <div>
        <h4 className="text-sm font-medium text-brand-text mb-2">Tags</h4>
        <div className="space-y-2">
          {TAGS.map((tag) => (
            <div key={tag} className="flex items-center gap-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={currentTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              />
              <Label htmlFor={`tag-${tag}`} className="text-sm capitalize cursor-pointer">
                {tag.replace("-", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  categories,
  currentCategory,
  onSelect,
}: {
  categories: Category[];
  currentCategory: string;
  onSelect: (slug: string | null) => void;
}) {
  const { roots, childrenByParent } = useMemo(() => {
    const roots = categories.filter((c) => c.parentId === null).sort((a, b) => a.name.localeCompare(b.name));
    const childrenByParent = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentId) {
        const list = childrenByParent.get(c.parentId) ?? [];
        list.push(c);
        childrenByParent.set(c.parentId, list);
      }
    }
    for (const list of childrenByParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return { roots, childrenByParent };
  }, [categories]);

  // Expand the root that contains the currently-selected category (or the first root)
  const initialExpanded = useMemo(() => {
    if (currentCategory) {
      const selected = categories.find((c) => c.slug === currentCategory);
      if (selected?.parentId) return selected.parentId;
      if (selected && selected.parentId === null) return selected.id;
    }
    return roots[0]?.id ?? null;
  }, [categories, currentCategory, roots]);

  const [expanded, setExpanded] = useState<string | null>(initialExpanded);

  return (
    <div>
      <h4 className="text-sm font-medium text-brand-text mb-2">Category</h4>
      <div className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
            !currentCategory
              ? "bg-brand-primary/10 text-brand-primary font-medium"
              : "text-brand-text-secondary hover:bg-gray-50"
          }`}
        >
          All Categories
        </button>
        {roots.map((root) => {
          const isOpen = expanded === root.id;
          const children = childrenByParent.get(root.id) ?? [];
          return (
            <div key={root.id}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : root.id)}
                className="flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded text-brand-text hover:bg-gray-50"
              >
                <span className="font-medium">{root.name}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="pl-3 space-y-1 mt-1">
                  <button
                    onClick={() => onSelect(root.slug)}
                    className={`block w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                      currentCategory === root.slug
                        ? "bg-brand-primary/10 text-brand-primary font-medium"
                        : "text-brand-text-secondary hover:bg-gray-50"
                    }`}
                  >
                    All {root.name}
                  </button>
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.slug)}
                      className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${
                        currentCategory === c.slug
                          ? "bg-brand-primary/10 text-brand-primary font-medium"
                          : "text-brand-text-secondary hover:bg-gray-50"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
