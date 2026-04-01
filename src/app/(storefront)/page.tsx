import { siteConfig } from "../../../site.config";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-pink/30 via-brand-lavender/20 to-brand-peach/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-brand-secondary leading-tight">
              {siteConfig.tagline}
            </h1>
            <p className="mt-6 text-lg text-brand-text-secondary max-w-xl mx-auto">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className={buttonVariants({ size: "lg", className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 h-12 text-base rounded-xl" })}
              >
                Shop All Candy
              </Link>
              <Link
                href="/build-your-box"
                className={buttonVariants({ variant: "outline", size: "lg", className: "border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white px-8 h-12 text-base rounded-xl" })}
              >
                Build Your Box
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-brand-pink/40 blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-brand-mint/40 blur-xl" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-brand-peach/40 blur-xl" />
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🚚", text: `Free Shipping Over $${siteConfig.freeShippingThreshold}` },
              { icon: "🍬", text: "Handcrafted with Love" },
              { icon: "🔒", text: "Secure Checkout" },
              { icon: "😊", text: "Satisfaction Guaranteed" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center justify-center gap-2">
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-sm font-medium text-brand-text-secondary">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-brand-secondary text-center mb-10">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Chocolates", slug: "chocolates", color: "bg-brand-pink/20", emoji: "🍫" },
              { name: "Gummies & Jellies", slug: "gummies-jellies", color: "bg-brand-mint/20", emoji: "🐻" },
              { name: "Hard Candy & Lollipops", slug: "hard-candy-lollipops", color: "bg-brand-lavender/20", emoji: "🍭" },
              { name: "Gift Boxes", slug: "gift-boxes", color: "bg-brand-peach/20", emoji: "🎁" },
              { name: "Seasonal Specials", slug: "seasonal-specials", color: "bg-brand-sky/20", emoji: "🌸" },
              { name: "Sugar-Free", slug: "sugar-free", color: "bg-brand-mint/30", emoji: "🌿" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className={`${cat.color} rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </div>
                <h3 className="text-xl font-heading font-semibold text-brand-secondary">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-brand-secondary text-center mb-10">
            Shop by Occasion
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Birthday", emoji: "🎂" },
              { name: "Thank You", emoji: "💐" },
              { name: "Corporate", emoji: "💼" },
              { name: "Holiday", emoji: "🎄" },
              { name: "Just Because", emoji: "💝" },
            ].map((occ) => (
              <Link
                key={occ.name}
                href={`/products?tag=${occ.name.toLowerCase().replace(" ", "-")}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full hover:bg-brand-primary/10 hover:text-brand-primary transition-colors text-brand-text-secondary font-medium"
              >
                <span className="text-xl">{occ.emoji}</span>
                {occ.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-brand-secondary">
              Trending Now
            </h2>
            <Link
              href="/products?sort=bestselling"
              className="text-brand-primary hover:text-brand-primary-hover font-medium text-sm"
            >
              View All →
            </Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>
    </div>
  );
}
