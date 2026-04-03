"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "./StarRating";
import { QuantitySelector } from "./QuantitySelector";
import { ProductReviews } from "./ProductReviews";
import { useCartStore } from "@/stores/cart-store";
import { useSession } from "next-auth/react";
import { AuthPromptModal } from "./AuthPromptModal";
import { toast } from "sonner";
import type { CartItem } from "@/types";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    price: string;
    compareAtPrice: string | null;
    tags: string[] | null;
    allergens: string[] | null;
    ingredients: string | null;
    nutritionInfo: unknown;
    isGiftEligible: boolean;
    images: { id: string; url: string; altText: string | null; isPrimary: boolean }[];
    category: { id: string; name: string; slug: string } | null;
    inventory: { quantity: number } | null;
    reviews: { id: string; rating: number; title: string | null; body: string | null; userName: string; createdAt: string; isVerifiedPurchase: boolean; adminResponse: string | null }[];
    averageRating: number;
    reviewCount: number;
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ item: Omit<CartItem, "quantity">; quantity: number } | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const { data: session } = useSession();

  const price = parseFloat(product.price);
  const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const isOnSale = comparePrice && comparePrice > price;
  const inStock = (product.inventory?.quantity ?? 0) > 0;
  const primaryImage = product.images[selectedImage]?.url || product.images[0]?.url;

  const handleAddToCart = () => {
    const item = {
      productId: product.id,
      name: product.name,
      price,
      image: product.images[0]?.url || "",
      slug: product.slug,
    };

    if (!session?.user) {
      setPendingItem({ item, quantity });
      setAuthPromptOpen(true);
      return;
    }

    addItem(item, quantity);
    setCartOpen(true);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-brand-primary">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/categories/${product.category.slug}`} className="hover:text-brand-primary">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-brand-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.images[selectedImage]?.altText || product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🍬</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? "border-brand-primary" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt={img.altText || ""} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-sm text-brand-text-muted uppercase tracking-wide hover:text-brand-primary"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-3xl font-heading font-bold text-brand-secondary">
            {product.name}
          </h1>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.averageRating} showCount count={product.reviewCount} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-brand-primary">${price.toFixed(2)}</span>
            {isOnSale && (
              <span className="text-xl text-brand-text-muted line-through">${comparePrice!.toFixed(2)}</span>
            )}
            {isOnSale && (
              <Badge className="bg-brand-primary text-white">
                Save ${(comparePrice! - price).toFixed(2)}
              </Badge>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-brand-text-secondary leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag.replace("-", " ")}
                </Badge>
              ))}
            </div>
          )}

          {/* Allergens */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="bg-yellow-50 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-yellow-800">
                Allergens: {product.allergens.join(", ")}
              </p>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={product.inventory?.quantity || 99}
            />
            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white h-12 text-base rounded-xl"
            >
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Add to Wishlist
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {product.isGiftEligible && (
            <p className="text-sm text-brand-text-muted flex items-center gap-2">
              🎁 Gift eligible — add a message at checkout
            </p>
          )}
        </div>
      </div>

      {/* Tabs — w-full + overflow-hidden prevents rich-text children from blowing out the page */}
      <Tabs defaultValue="description" className="mt-12 w-full overflow-hidden">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
          <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary">
            Description
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary">
            Ingredients & Allergens
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary">
            Reviews ({product.reviewCount})
          </TabsTrigger>
        </TabsList>

        {/* min-w-0 collapses the flex/grid intrinsic minimum so the content can shrink */}
        <TabsContent value="description" className="mt-6 min-w-0">
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{
              __html: product.description || "<p>No description available.</p>",
            }}
          />
        </TabsContent>

        <TabsContent value="ingredients" className="mt-6 min-w-0">
          <div className="space-y-4">
            {product.ingredients && (
              <div>
                <h4 className="font-medium text-brand-text mb-2">Ingredients</h4>
                <p className="text-brand-text-secondary leading-relaxed">{product.ingredients}</p>
              </div>
            )}
            {product.allergens && product.allergens.length > 0 && (
              <div>
                <h4 className="font-medium text-brand-text mb-2">Allergens</h4>
                <div className="flex flex-wrap gap-2">
                  {product.allergens.map((a) => (
                    <Badge key={a} variant="destructive" className="capitalize">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 min-w-0">
          <ProductReviews reviews={product.reviews} averageRating={product.averageRating} totalReviews={product.reviewCount} />
        </TabsContent>
      </Tabs>

      <AuthPromptModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        pendingItem={pendingItem}
      />
    </div>
  );
}
