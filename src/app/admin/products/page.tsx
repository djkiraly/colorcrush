"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Table2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    params.set("includeInactive", "true");
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotalPages(data.totalPages || 1);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

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

      <DataTable
        columns={columns}
        data={products}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={setSearch}
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
