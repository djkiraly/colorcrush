"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCartStore } from "@/stores/cart-store";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { toast } from "sonner";

export default function WishlistPage() {
  const { status } = useSession();
  const settings = useSiteSettings();
  const wishlist = useWishlist();
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);

  // Feature-flag guard. Hide the page entirely when wishlist is disabled in
  // site settings so admins can turn the feature off without touching code.
  if (settings.features?.wishlist === false) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
          My Wishlist
        </h1>
        <div className="text-center py-12 text-brand-text-muted">
          Wishlists are currently disabled.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        My Wishlist
      </h1>

      {status === "loading" || (wishlist.canUse && wishlist.loading && !wishlist.loaded) ? (
        <div className="py-12 flex items-center justify-center text-brand-text-muted">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading…
        </div>
      ) : !wishlist.isAuthed ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Heart className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <p className="text-brand-text mb-2 font-medium">
            Sign in to view your wishlist
          </p>
          <p className="text-sm text-brand-text-muted mb-6">
            Save your favorite treats so you can find them again later.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/login?next=/account/wishlist">
              <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/register?next=/account/wishlist">
              <Button variant="outline">Create an account</Button>
            </Link>
          </div>
        </div>
      ) : wishlist.isGuest ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Heart className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <p className="text-brand-text mb-2 font-medium">
            Create a free account to save favorites
          </p>
          <p className="text-sm text-brand-text-muted mb-6">
            Your guest checkout doesn&apos;t carry over a wishlist. Set a password
            on your account and your saved items stay with you.
          </p>
          <Link href="/register?next=/account/wishlist">
            <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
              Create account
            </Button>
          </Link>
        </div>
      ) : wishlist.items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Heart className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <p className="text-brand-text-muted mb-4">
            Your wishlist is empty. Start browsing to save your favorite treats!
          </p>
          <Link href="/products">
            <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
              Browse products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.items.map((item) => {
            const price = parseFloat(item.price);
            return (
              <div
                key={item.productId}
                className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="aspect-square bg-gray-100 block relative"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍬
                    </div>
                  )}
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-brand-text hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="font-bold text-brand-primary mt-1">
                    ${price.toFixed(2)}
                  </p>
                  {!item.inStock && (
                    <p className="text-xs font-semibold text-red-600 mt-1">
                      ⚠️ Low Stock
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white"
                      onClick={() => {
                        addItem({
                          productId: item.productId,
                          name: item.name,
                          price,
                          image: item.image || "",
                          slug: item.slug,
                        });
                        setCartOpen(true);
                        toast.success(`${item.name} added to cart`);
                      }}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        wishlist.toggle({
                          id: item.productId,
                          name: item.name,
                          slug: item.slug,
                          price: item.price,
                          image: item.image,
                        })
                      }
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4 text-brand-error" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
