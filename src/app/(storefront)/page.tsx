export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button-variants";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { ConfigurableHero } from "@/components/storefront/ConfigurableHero";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

type CategoryRow = typeof categories.$inferSelect;
type CategoryNode = CategoryRow & { children: CategoryNode[] };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = `${settings.name} — Handcrafted Candy, Chocolate & Gift Boxes`;
  const description =
    settings.description ||
    `Shop premium handcrafted candies, chocolates, and customizable gift boxes from ${settings.name}.`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/",
      siteName: settings.name,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const TYPE_EMOJI: Record<string, string> = {
  "chocolate-bars": "🍫",
  "gummies-chewy": "🐻",
  "hard-candies": "🍬",
  "chocolate-covered": "🍓",
  "chocolate-boxes": "📦",
  fudge: "🍮",
  licorice: "🖤",
  "lollipops-suckers": "🍭",
  marshmallows: "☁️",
  "caramels-toffees": "🍯",
  taffy: "🌈",
  mints: "🌿",
  novelty: "✨",
  "freeze-dried": "❄️",
  nostalgic: "🎞️",
  "sugar-free": "🌱",
};

const TYPE_COLOR: Record<string, string> = {
  "chocolate-bars": "bg-brand-pink/20",
  "gummies-chewy": "bg-brand-mint/20",
  "hard-candies": "bg-brand-lavender/20",
  "chocolate-covered": "bg-brand-peach/20",
  "chocolate-boxes": "bg-brand-sky/20",
  fudge: "bg-brand-pink/30",
  licorice: "bg-brand-lavender/30",
  "lollipops-suckers": "bg-brand-peach/30",
  marshmallows: "bg-brand-sky/30",
  "caramels-toffees": "bg-brand-peach/20",
  taffy: "bg-brand-mint/30",
  mints: "bg-brand-mint/40",
  novelty: "bg-brand-lavender/20",
  "freeze-dried": "bg-brand-sky/20",
  nostalgic: "bg-brand-pink/20",
  "sugar-free": "bg-brand-mint/30",
};

const EVENT_EMOJI: Record<string, string> = {
  birthday: "🎂",
  wedding: "💍",
  "bridal-shower": "💐",
  "baby-shower": "🍼",
  graduation: "🎓",
  "team-sports": "🏆",
  school: "🎒",
  corporate: "💼",
  fundraiser: "🎟️",
  "party-favors": "🎉",
  "candy-buffet": "🍭",
  seasonal: "🌸",
  valentines: "💝",
  easter: "🐰",
  halloween: "🎃",
  christmas: "🎄",
  "back-to-school": "📚",
  "game-day": "🏈",
  prom: "👑",
};

async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    const all = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
    const byId = new Map<string, CategoryNode>();
    for (const c of all) byId.set(c.id, { ...c, children: [] });
    const roots: CategoryNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const settings = await getSettings();
  const tree = await getCategoryTree();

  const typeRoot = tree.find((r) => r.slug === "shop-by-type");
  const eventRoot = tree.find((r) => r.slug === "shop-by-event");
  const typeChildren = (typeRoot?.children ?? []).slice(0, 8);
  const eventSlugOrder = [
    "birthday",
    "wedding",
    "valentines",
    "easter",
    "halloween",
    "christmas",
    "party-favors",
    "corporate",
  ];
  const eventChildren = eventSlugOrder
    .map((slug) => (eventRoot?.children ?? []).find((c) => c.slug === slug))
    .filter((c): c is CategoryNode => !!c);

  return (
    <div>
      {/* Hero */}
      {settings.hero?.enabled ? (
        <ConfigurableHero hero={settings.hero} />
      ) : (
      <section className="relative bg-gradient-to-br from-brand-pink/30 via-brand-lavender/20 to-brand-peach/30 overflow-hidden min-h-[60vw] sm:min-h-[480px] lg:min-h-[600px] flex items-center">
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-bold text-brand-secondary leading-tight">
              Handcrafted Candy, Chocolate &amp; Gift Boxes
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-brand-secondary/80 font-medium">
              {settings.tagline}
            </p>
            <p className="mt-5 text-base sm:text-lg text-brand-text-secondary max-w-xl mx-auto">
              {settings.description}
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200",
                })}
              >
                Shop All Candy
              </Link>
              <Link
                href="/build-your-box"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg rounded-xl",
                })}
              >
                Build Your Box
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-brand-pink/40 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-brand-mint/40 blur-2xl" aria-hidden="true" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-brand-peach/40 blur-2xl" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/3 w-40 h-40 rounded-full bg-brand-lavender/30 blur-2xl" aria-hidden="true" />
      </section>
      )}

      {/* Trust Badges */}
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              // TEMP: Free shipping is not being offered for now — always show
              // "Fast Shipping". Restore the showFreeShipping ternary below to
              // re-enable the "Free Shipping Over $X" badge.
              // showFreeShipping
              //   ? { icon: "🚚", text: `Free Shipping Over $${settings.freeShippingThreshold}` }
              //   : { icon: "🚚", text: "Fast Shipping" },
              { icon: "🚚", text: "Fast Shipping" },
              { icon: "🍬", text: "Handcrafted with Love" },
              { icon: "🔒", text: "Secure Checkout" },
              { icon: "😊", text: "Satisfaction Guaranteed" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center justify-center gap-2">
                <span className="text-2xl" aria-hidden="true">{badge.icon}</span>
                <span className="text-sm font-medium text-brand-text-secondary">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Type */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-brand-secondary">Shop by Type</h2>
            {typeRoot && (
              <Link
                href={`/categories/${typeRoot.slug}`}
                className="text-brand-primary hover:text-brand-primary-hover font-medium text-sm"
              >
                View all →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {typeChildren.map((cat, idx) => {
              const imageUrl = cat.imageUrl;
              if (imageUrl) {
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="relative rounded-2xl overflow-hidden h-48 sm:h-56 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <Image
                      src={imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={idx < 4}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="relative h-full flex items-end justify-center p-5">
                      <h3 className="text-xl font-heading font-semibold text-white text-center drop-shadow-lg">
                        {cat.name}
                      </h3>
                    </div>
                  </Link>
                );
              }
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className={`${TYPE_COLOR[cat.slug] ?? "bg-brand-pink/20"} rounded-2xl p-5 sm:p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
                    {TYPE_EMOJI[cat.slug] ?? "🍬"}
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-brand-secondary">
                    {cat.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shop by Event */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-brand-secondary">Shop by Event</h2>
            {eventRoot && (
              <Link
                href={`/categories/${eventRoot.slug}`}
                className="text-brand-primary hover:text-brand-primary-hover font-medium text-sm"
              >
                View all →
              </Link>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {eventChildren.map((evt) => (
              <Link
                key={evt.id}
                href={`/categories/${evt.slug}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full hover:bg-brand-primary/10 hover:text-brand-primary transition-colors text-brand-text-secondary font-medium"
              >
                <span className="text-xl" aria-hidden="true">{EVENT_EMOJI[evt.slug] ?? "🎉"}</span>
                {evt.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-brand-secondary">Trending Now</h2>
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
