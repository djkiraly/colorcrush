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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const sort = searchParams.get("sort") || "featured";
      const pageParam = searchParams.get("page") || "1";
      const res = await fetch(
        `/api/products?category=${slug}&sort=${sort}&page=${pageParam}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setLoading(false);
    }
    fetchData();
  }, [slug, searchParams]);

  const buildPageHref = (n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(n));
    return `?${params.toString()}`;
  };

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
        {!loading && total > 0 && (
          <p className="text-brand-text-muted mt-2 text-sm">
            {total} product{total !== 1 ? "s" : ""}
          </p>
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
        <>
          <ProductGrid products={products} />

          {totalPages > 1 && (
            <nav
              className="flex flex-wrap justify-center items-center gap-2 mt-10"
              aria-label="Pagination"
            >
              <a
                href={buildPageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`px-3 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  page <= 1
                    ? "bg-gray-100 text-gray-400 pointer-events-none"
                    : "bg-white text-brand-text-secondary hover:bg-gray-100"
                }`}
              >
                Previous
              </a>
              {buildPageWindow(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span
                    key={`gap-${i}`}
                    className="w-10 h-10 flex items-center justify-center text-sm text-brand-text-muted"
                  >
                    …
                  </span>
                ) : (
                  <a
                    key={p}
                    href={buildPageHref(p)}
                    aria-current={page === p ? "page" : undefined}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      page === p
                        ? "bg-brand-primary text-white"
                        : "bg-white text-brand-text-secondary hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </a>
                )
              )}
              <a
                href={buildPageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`px-3 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 pointer-events-none"
                    : "bg-white text-brand-text-secondary hover:bg-gray-100"
                }`}
              >
                Next
              </a>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

// Sliding window of page numbers with ellipses, so pagination stays readable
// when a category has many pages.
function buildPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
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
