"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
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
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const price = parseFloat(product.price);
  const comparePrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const isOnSale = comparePrice && comparePrice > price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price,
      image: product.image || "",
      slug: product.slug,
    });
    setCartOpen(true);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍬
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isOnSale && (
            <Badge className="bg-brand-primary text-white text-xs">Sale</Badge>
          )}
          {product.tags?.includes("new") && (
            <Badge className="bg-brand-mint text-brand-text text-xs">New</Badge>
          )}
          {product.tags?.includes("bestseller") && (
            <Badge className="bg-brand-peach text-brand-text text-xs">
              Bestseller
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 backdrop-blur-sm hover:bg-white rounded-full h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Add to cart */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl h-10"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-xs text-brand-text-muted uppercase tracking-wide mb-1">
            {product.category}
          </p>
        )}
        <h3 className="font-medium text-brand-text line-clamp-1 group-hover:text-brand-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-brand-primary">${price.toFixed(2)}</span>
          {isOnSale && (
            <span className="text-sm text-brand-text-muted line-through">
              ${comparePrice!.toFixed(2)}
            </span>
          )}
        </div>
        {(product.averageRating ?? 0) > 0 && (
          <div className="mt-2">
            <StarRating
              rating={product.averageRating!}
              size={14}
              showCount
              count={product.reviewCount}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
