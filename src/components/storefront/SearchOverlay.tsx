"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import Image from "next/image";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  category: string | null;
}

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          setQuery("");
          setResults([]);
        }
      }
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-w-[calc(100%-2rem)] sm:max-w-2xl mx-auto mt-4 sm:mt-20 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b">
          <Search className="h-5 w-5 text-brand-text-muted" />
          <Input
            autoFocus
            placeholder="Search candies, chocolates, gifts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                onClose();
              }
            }}
            className="border-0 focus-visible:ring-0 text-lg h-14"
          />
          <button onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="p-6 text-center text-brand-text-muted">Searching...</div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-h-60 sm:max-h-96 overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => {
                  router.push(`/products/${product.slug}`);
                  onClose();
                }}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-text truncate">
                    {product.name}
                  </p>
                  {product.category && (
                    <p className="text-sm text-brand-text-muted">{product.category}</p>
                  )}
                </div>
                <span className="font-semibold text-brand-primary">
                  ${product.price}
                </span>
              </button>
            ))}
            <button
              className="w-full px-4 py-3 text-center text-sm font-medium text-brand-primary hover:bg-brand-primary/5 transition-colors"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                onClose();
              }}
            >
              View all results
            </button>
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="p-6 text-center text-brand-text-muted">
            No products found for &quot;{query}&quot;
          </div>
        )}

        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-brand-text-muted flex justify-between">
          <span>Press Enter to see all results</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
