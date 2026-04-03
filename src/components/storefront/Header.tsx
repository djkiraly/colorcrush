"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Search, Menu, X, User, Heart, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "./SearchOverlay";

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/categories/chocolates", label: "Chocolates" },
  { href: "/categories/gummies-jellies", label: "Gummies" },
  { href: "/categories/gift-boxes", label: "Gift Boxes" },
  { href: "/build-your-box", label: "Build Your Box" },
];

export function Header() {
  const siteConfig = useSiteSettings();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHome = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const isSuperAdmin = (session?.user as { role?: string })?.role === "super_admin";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        {/* Top bar */}
        <div className="bg-brand-secondary text-white text-center text-sm py-1.5 px-4">
          <p>
            Free shipping on orders over $
            {siteConfig.freeShippingThreshold}!
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo — absolute on desktop to span header, inline on mobile */}
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
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-3 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo — inline on mobile */}
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
                  {/* Spacer for desktop absolute logo */}
                  <span className={`hidden lg:block ${isHome ? "w-[250px]" : "w-[175px]"}`} />
                </>
              ) : (
                <span className="text-xl sm:text-2xl font-heading font-bold text-brand-secondary">
                  {siteConfig.name}
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-base font-medium text-brand-text hover:text-brand-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="block text-base font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
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
