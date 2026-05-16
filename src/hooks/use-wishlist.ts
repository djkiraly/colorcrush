"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  image: string | null;
  inStock: boolean;
  createdAt: string;
};

type SessionUser = { isGuest?: boolean };

/**
 * Client-side wishlist state.
 *
 * - Lazy-loads from `/api/account/wishlist` once per signed-in real account.
 * - Logged-out and guest sessions get a no-op API + a toast prompting them to
 *   sign in / create an account.
 * - `toggle()` is optimistic: it flips local state instantly and rolls back on
 *   API failure.
 */
export function useWishlist() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;
  const isGuest = !!user?.isGuest;
  const isAuthed = status === "authenticated" && !!session?.user;
  const canUse = isAuthed && !isGuest;

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canUse) {
      setItems([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/account/wishlist")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canUse]);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const promptSignIn = useCallback(() => {
    if (!isAuthed) {
      toast.info("Sign in to save favorites", {
        action: {
          label: "Sign in",
          onClick: () => router.push("/login?next=/account/wishlist"),
        },
      });
      return;
    }
    if (isGuest) {
      toast.info("Create a free account to save favorites", {
        action: {
          label: "Create account",
          onClick: () => router.push("/register?next=/account/wishlist"),
        },
      });
    }
  }, [isAuthed, isGuest, router]);

  const toggle = useCallback(
    async (
      product: { id: string; name?: string; slug?: string; price?: string; image?: string | null }
    ) => {
      if (!canUse) {
        promptSignIn();
        return;
      }

      const already = items.some((i) => i.productId === product.id);

      if (already) {
        // Optimistic removal
        const prev = items;
        setItems((list) => list.filter((i) => i.productId !== product.id));
        try {
          const res = await fetch(
            `/api/account/wishlist?productId=${encodeURIComponent(product.id)}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error();
          toast.success("Removed from wishlist");
        } catch {
          setItems(prev);
          toast.error("Couldn't update wishlist");
        }
        return;
      }

      // Optimistic add — we don't know the createdAt/id yet, so synthesize
      // placeholders that get replaced on the next /GET.
      const optimistic: WishlistItem = {
        id: `optimistic-${product.id}`,
        productId: product.id,
        name: product.name ?? "",
        slug: product.slug ?? "",
        price: product.price ?? "0",
        compareAtPrice: null,
        image: product.image ?? null,
        inStock: true,
        createdAt: new Date().toISOString(),
      };
      const prev = items;
      setItems((list) => [optimistic, ...list]);
      try {
        const res = await fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed");
        }
        toast.success("Saved to wishlist");
      } catch (err) {
        setItems(prev);
        toast.error(err instanceof Error ? err.message : "Couldn't update wishlist");
      }
    },
    [items, canUse, promptSignIn]
  );

  const refresh = useCallback(async () => {
    if (!canUse) return;
    setLoading(true);
    try {
      const res = await fetch("/api/account/wishlist");
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [canUse]);

  return {
    items,
    loading,
    loaded,
    canUse,
    isAuthed,
    isGuest,
    isInWishlist,
    toggle,
    refresh,
    promptSignIn,
  };
}
