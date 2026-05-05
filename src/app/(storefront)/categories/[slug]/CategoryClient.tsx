"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  slug: string;
  name: string;
  description: string | null;
  ancestors: { name: string; slug: string }[];
};

function CategoryContent({ slug, name, description, ancestors }: Props) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const sort = searchParams.get("sort") || "featured";
      const page = searchParams.get("page") || "1";
      const res = await fetch(
        `/api/products?category=${slug}&sort=${sort}&page=${page}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      setLoading(false);
    }
    fetchData();
  }, [slug, searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-primary">
          Home
        </Link>
        {ancestors.map((a) => (
          <span key={a.slug} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/categories/${a.slug}`}
              className="hover:text-brand-primary"
            >
              {a.name}
            </Link>
          </span>
        ))}
        <ChevronRight className="h-3 w-3" />
        <span className="text-brand-text">{name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary">
          {name}
        </h1>
        {description && (
          <p className="text-brand-text-secondary mt-2">{description}</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
            >
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

export default function CategoryClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      }
    >
      <CategoryContent {...props} />
    </Suspense>
  );
}
