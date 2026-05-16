"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Table2, Upload, X } from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive" | "featured";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

const EMPTY_FILTERS = {
  status: "all" as StatusFilter,
  categoryId: "",
  minPrice: "",
  maxPrice: "",
  minStock: "",
  maxStock: "",
  minOrdered: "",
  maxOrdered: "",
};

type Filters = typeof EMPTY_FILTERS;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const activeFilterCount = (() => {
    let n = 0;
    if (filters.status !== "all") n++;
    if (filters.categoryId) n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.minStock) n++;
    if (filters.maxStock) n++;
    if (filters.minOrdered) n++;
    if (filters.maxOrdered) n++;
    return n;
  })();

  const handleToggleActive = async (p: any, isActive: boolean) => {
    setTogglingId(p.id);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive } : x)));
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update product");
      }
      toast.success(isActive ? "Product activated" : "Product deactivated");
    } catch (err: any) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !isActive } : x)));
      toast.error(err.message || "Failed to update product");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete product");
      }
      toast.success("Product deleted");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchProducts = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    params.set("status", filters.status);
    // Belt-and-suspenders: if status is "all", also pass includeInactive=true so
    // older API behavior matches the new explicit filter.
    if (filters.status === "all") params.set("includeInactive", "true");
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minStock !== "") params.set("minStock", filters.minStock);
    if (filters.maxStock !== "") params.set("maxStock", filters.maxStock);
    if (filters.minOrdered !== "") params.set("minOrdered", filters.minOrdered);
    if (filters.maxOrdered !== "") params.set("maxOrdered", filters.maxOrdered);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filters]);

  useEffect(() => {
    fetch("/api/categories?all=true")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const columns = [
    {
      key: "image",
      header: "Image",
      render: (p: any) => (
        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
          {p.image && <Image src={p.image} alt="" width={40} height={40} className="w-full h-full object-cover" />}
        </div>
      ),
    },
    { key: "name", header: "Name" },
    { key: "sku", header: "SKU", render: (p: any) => <span className="text-xs font-mono">{p.sku || "—"}</span> },
    {
      key: "price",
      header: "Price",
      render: (p: any) => <span className="font-semibold">${p.price}</span>,
    },
    {
      key: "stock",
      header: "Stock",
      render: (p: any) => (
        <span className={p.stock <= 10 ? "text-brand-error font-bold" : ""}>{p.stock}</span>
      ),
    },
    {
      key: "orderedCount",
      header: "Ordered",
      render: (p: any) => <span>{p.orderedCount ?? 0}</span>,
    },
    { key: "category", header: "Category" },
    {
      key: "isFeatured",
      header: "Status",
      render: (p: any) => (
        <div className="flex gap-1">
          {p.isFeatured && <Badge className="bg-brand-peach text-xs">Featured</Badge>}
          {!p.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      render: (p: any) => (
        <Switch
          checked={!!p.isActive}
          disabled={togglingId === p.id}
          onCheckedChange={(v) => handleToggleActive(p, v)}
          aria-label={p.isActive ? "Deactivate product" : "Activate product"}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Products
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/products/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
          </Link>
          <Link href="/admin/products/bulk-edit">
            <Button variant="outline">
              <Table2 className="h-4 w-4 mr-2" /> Bulk Edit
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-secondary">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="text-xs text-brand-text-muted">
            {total} product{total !== 1 ? "s" : ""}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-3 inline-flex items-center gap-1 text-brand-primary hover:underline"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value as StatusFilter)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
              <option value="featured">Featured only</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <select
              value={filters.categoryId}
              onChange={(e) => updateFilter("categoryId", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Price</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                className="h-9 text-sm"
              />
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Stock</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={filters.minStock}
                onChange={(e) => updateFilter("minStock", e.target.value)}
                className="h-9 text-sm"
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={filters.maxStock}
                onChange={(e) => updateFilter("maxStock", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Ordered</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={filters.minOrdered}
                onChange={(e) => updateFilter("minOrdered", e.target.value)}
                className="h-9 text-sm"
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={filters.maxOrdered}
                onChange={(e) => updateFilter("maxOrdered", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        searchPlaceholder="Search products..."
        actions={(p: any) => (
          <div className="flex gap-1">
            <Link href={`/admin/products/${p.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(p)}
              disabled={deletingId === p.id}
            >
              <Trash2 className="h-4 w-4 text-brand-error" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
