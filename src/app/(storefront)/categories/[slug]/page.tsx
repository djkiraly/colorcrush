"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState<{ name: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const sort = searchParams.get("sort") || "featured";
      const page = searchParams.get("page") || "1";
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/products?category=${slug}&sort=${sort}&page=${page}`),
        fetch("/api/categories"),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData.products || []);
      const cat = categoriesData.categories?.find((c: { slug: string }) => c.slug === slug);
      setCategory(cat || null);
      setLoading(false);
    }
    fetchData();
  }, [slug, searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-brand-primary">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-brand-text">{category?.name || slug}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary">
          {category?.name || slug}
        </h1>
        {category?.description && (
          <p className="text-brand-text-secondary mt-2">{category.description}</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <ProductGrid products={products} />
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><div className="h-8 bg-gray-200 rounded w-48 animate-pulse" /></div>}>
      <CategoryContent />
    </Suspense>
  );
}
