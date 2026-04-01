"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Products
        </h1>
        <Link href="/admin/products/new">
          <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </Link>
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
          </div>
        )}
      />
    </div>
  );
}
