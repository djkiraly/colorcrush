"use client";

import { ProductCard } from "./ProductCard";

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
  isFeatured?: boolean;
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🍬</p>
        <h3 className="text-lg font-medium text-brand-text mb-2">
          No products found
        </h3>
        <p className="text-brand-text-muted">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
