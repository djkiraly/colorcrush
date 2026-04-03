"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductFilters } from "@/components/storefront/ProductFilters";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  image: string | null;
  category?: string | null;
  tags?: string[] | null;
  averageRating?: number;
  reviewCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setLoading(false);
    }
    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    }
    fetchCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-secondary">
            All Products
          </h1>
          <p className="text-brand-text-muted mt-1">
            {total} product{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside
          className={`w-64 flex-shrink-0 ${
            showFilters ? "block" : "hidden"
          } lg:block`}
        >
          <ProductFilters
            categories={categories}
            onClose={() => setShowFilters(false)}
          />
        </aside>

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <ProductGrid products={products} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <a
                      key={i}
                      href={`?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: String(i + 1),
                      })}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        page === i + 1
                          ? "bg-brand-primary text-white"
                          : "bg-white text-brand-text-secondary hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
