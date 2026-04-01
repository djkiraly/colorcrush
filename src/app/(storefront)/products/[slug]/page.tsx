"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProduct(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">😢</p>
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
          Product Not Found
        </h1>
        <p className="text-brand-text-muted">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
