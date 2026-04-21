"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Search, Menu, X, User, Heart, Shield, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "./SearchOverlay";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
};

export function Header() {
  const siteConfig = useSiteSettings();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHome = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedRoot, setMobileExpandedRoot] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const navRef = useRef<HTMLDivElement | null>(null);
  const items = useCartStore((s) => s.items);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const isSuperAdmin = (session?.user as { role?: string })?.role === "super_admin";

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((r) => r.json())
      .then((data) => setTree(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const rootOrder = ["shop-by-type", "shop-by-color", "shop-by-event", "gift-boxes"];
  const orderedRoots = rootOrder
    .map((slug) => tree.find((r) => r.slug === slug))
    .filter((r): r is CategoryNode => !!r);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        {siteConfig.announcementBar?.enabled !== false && (
          <div className="bg-brand-secondary text-white text-center text-sm py-1.5 px-4">
            <p>
              {siteConfig.announcementBar?.text?.trim()
                ? siteConfig.announcementBar.text.replace(
                    /\{freeShippingThreshold\}/g,
                    String(siteConfig.freeShippingThreshold)
                  )
                : `Free shipping on orders over $${siteConfig.freeShippingThreshold}!`}
            </p>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {siteConfig.logoUrl && (
            <Link href="/" className={`hidden lg:block absolute left-8 top-[calc(50%+15px)] -translate-y-1/2 z-10`}>
              <Image
                src={siteConfig.logoUrl}
                alt={siteConfig.name}
                width={250}
                height={250}
                className={`${isHome ? "h-[250px]" : "h-[175px]"} w-auto object-contain`}
                unoptimized
              />
            </Link>
          )}

          <div className="flex items-center justify-between h-16">
            <button
              className="lg:hidden p-3 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              {siteConfig.logoUrl ? (
                <>
                  <Image
                    src={siteConfig.logoUrl}
                    alt={siteConfig.name}
                    width={160}
                    height={64}
                    className="h-10 sm:h-14 w-auto object-contain lg:hidden"
                    unoptimized
                  />
                  <span className={`hidden lg:block ${isHome ? "w-[250px]" : "w-[175px]"}`} />
                </>
              ) : (
                <span className="text-xl sm:text-2xl font-heading font-bold text-brand-secondary">
                  {siteConfig.name}
                </span>
              )}
            </Link>

            <nav ref={navRef} className="hidden lg:flex items-center gap-6">
              <Link
                href="/products"
                className="text-sm font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
              >
                Shop All
              </Link>
              {orderedRoots.map((root) => {
                const isOpen = openDropdown === root.slug;
                return (
                  <div key={root.id} className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
                      onClick={() => setOpenDropdown(isOpen ? null : root.slug)}
                      aria-expanded={isOpen}
                    >
                      {root.name.replace(/^Shop by /, "")}
                      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[32rem] max-w-[90vw] bg-white border border-gray-100 rounded-xl shadow-lg p-5 z-50">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {root.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/categories/${child.slug}`}
                              onClick={() => setOpenDropdown(null)}
                              className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors py-1"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 mt-4 pt-3">
                          <Link
                            href={`/categories/${root.slug}`}
                            onClick={() => setOpenDropdown(null)}
                            className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
                          >
                            View all {root.name.toLowerCase()} →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Link
                href="/build-your-box"
                className="text-sm font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
              >
                Build Your Box
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="h-5 w-5" />
              </Button>
              <Link href="/account/wishlist">
                <Button variant="ghost" size="icon" aria-label="Wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              {isSuperAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon" aria-label="Admin Dashboard">
                    <Shield className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/account">
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white max-h-[80vh] overflow-y-auto">
            <nav className="px-4 py-4 space-y-2">
              <Link
                href="/products"
                className="block py-2 text-base font-medium text-brand-text hover:text-brand-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop All
              </Link>
              {orderedRoots.map((root) => {
                const isOpen = mobileExpandedRoot === root.slug;
                return (
                  <div key={root.id} className="border-b border-gray-100 last:border-b-0">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between py-2 text-base font-medium text-brand-text"
                      onClick={() => setMobileExpandedRoot(isOpen ? null : root.slug)}
                      aria-expanded={isOpen}
                    >
                      <span>{root.name}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="pb-2 pl-4 space-y-1">
                        <Link
                          href={`/categories/${root.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm font-medium text-brand-primary"
                        >
                          View all {root.name.toLowerCase()}
                        </Link>
                        {root.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-1.5 text-sm text-brand-text-secondary"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <Link
                href="/build-your-box"
                className="block py-2 text-base font-medium text-brand-text hover:text-brand-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Build Your Box
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="block py-2 text-base font-medium text-brand-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
