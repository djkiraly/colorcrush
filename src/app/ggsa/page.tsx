export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { GgsaOrderForm } from "@/components/ggsa/GgsaOrderForm";
import {
  GGSA_PICKUP_NOTICE,
  getNextPickupDate,
  formatPickupDate,
} from "@/lib/ggsa-pickup";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const enabled = settings.ggsa?.enabled;
  return {
    title: "GGSA Team Sweet Bags",
    description:
      "Order Color Crush Candy Team Sweet Bags to support the Gering Girls Softball Association. Pick up at the concession stand on game night.",
    // Don't let the page be indexed while it's switched off.
    robots: enabled ? undefined : { index: false, follow: false },
    alternates: { canonical: "/ggsa" },
  };
}

export default async function GgsaPage() {
  const settings = await getSettings();

  if (!settings.ggsa?.enabled) {
    notFound();
  }

  const {
    logoColorCrush,
    logoGgsa,
    productImages,
    tagline,
    title,
    description,
    footer,
  } = settings.ggsa;
  const images = (productImages ?? []).filter(Boolean).slice(0, 3);
  const nextPickup = formatPickupDate(getNextPickupDate());

  return (
    <div className="min-h-screen bg-[#FBF7FD]">
      {/* ── Hero / co-branded header ── */}
      <header className="bg-gradient-to-br from-[#7B2D8E] via-[#9333A8] to-[#14B8A6] text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {logoColorCrush && (
              <Image
                src={logoColorCrush}
                alt="Color Crush Candy"
                width={220}
                height={96}
                priority
                unoptimized
                className="h-16 w-auto object-contain drop-shadow sm:h-20"
              />
            )}
            {logoColorCrush && logoGgsa && (
              <span aria-hidden className="text-2xl font-light text-white/60">
                ×
              </span>
            )}
            {logoGgsa && (
              <Image
                src={logoGgsa}
                alt="Gering Girls Softball Association"
                width={220}
                height={96}
                priority
                unoptimized
                className="h-16 w-auto object-contain drop-shadow sm:h-20"
              />
            )}
          </div>

          <div className="mt-8 text-center">
            {tagline && (
              <p className="text-sm font-semibold uppercase tracking-widest text-[#F5B400]">
                {tagline}
              </p>
            )}
            {title && (
              <h1 className="mt-2 font-heading text-4xl font-extrabold sm:text-5xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mx-auto mt-3 max-w-2xl text-base text-white/90 sm:text-lg">
                {description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: product showcase + pickup */}
          <div className="space-y-6">
            {images.length > 0 && (
              <div>
                <div className="overflow-hidden rounded-2xl border border-[#7B2D8E]/10 bg-white shadow-sm">
                  <div className="relative aspect-square">
                    <Image
                      src={images[0]}
                      alt="Team Sweet Bag"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {images.slice(1).map((src, i) => (
                      <div
                        key={src}
                        className="relative aspect-square overflow-hidden rounded-xl border border-[#7B2D8E]/10 bg-white shadow-sm"
                      >
                        <Image
                          src={src}
                          alt={`Team Sweet Bag photo ${i + 2}`}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pickup notice */}
            <div className="rounded-2xl border-2 border-[#14B8A6]/30 bg-[#14B8A6]/5 p-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0F766E]" />
                <div>
                  <h2 className="font-heading font-bold text-[#0F766E]">
                    Concession-stand pickup
                  </h2>
                  <p className="mt-1 text-sm text-[#334155]">{GGSA_PICKUP_NOTICE}</p>
                  <p className="mt-2 text-sm font-semibold text-[#334155]">
                    Minimum order: 8 bags.
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#0F766E]">
                    <MapPin className="h-4 w-4" />
                    Next pickup: {nextPickup}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: order card */}
          <div>
            <div className="rounded-2xl border border-[#7B2D8E]/10 bg-white p-6 shadow-lg sm:p-8">
              <h2 className="font-heading text-2xl font-bold text-[#7B2D8E]">
                Order your bags
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                3&nbsp;oz Team Sweet Bag · $3.00 each
              </p>
              <div className="mt-6">
                <GgsaOrderForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      {footer && (
        <footer className="border-t border-[#7B2D8E]/10 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-500">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}
