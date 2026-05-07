import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export type HeroSettings = {
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
  imageDesktopUrl?: string;
  imageMobileUrl?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  textAlign?: "left" | "center" | "right";
  overlay?: "dark" | "light" | "none";
};

const ALIGN_CLASSES: Record<NonNullable<HeroSettings["textAlign"]>, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const OVERLAY_CLASSES: Record<NonNullable<HeroSettings["overlay"]>, string> = {
  dark: "bg-black/40",
  light: "bg-white/40",
  none: "",
};

export function ConfigurableHero({ hero }: { hero: HeroSettings }) {
  const align = hero.textAlign ?? "center";
  const overlay = hero.overlay ?? "dark";
  const desktop = hero.imageDesktopUrl;
  const mobile = hero.imageMobileUrl;
  const fallbackImg = desktop || mobile;
  const isLightOverlay = overlay === "light";
  const textColor = isLightOverlay ? "text-brand-secondary" : "text-white";
  const subTextColor = isLightOverlay
    ? "text-brand-secondary/80"
    : "text-white/90";

  return (
    /*
     * Sizing strategy:
     *   Mobile (<640px):  aspect-[4/5] — portrait crop suits the mobile art-directed image.
     *   Desktop (≥640px): aspect-[16/10] mirrors the 1440×900 source asset; max-h-[900px]
     *                     caps height on viewports wider than 1440px so the hero never grows
     *                     beyond the native image height. object-cover only engages past that cap.
     */
    <section className="relative overflow-hidden w-full bg-brand-pink/10 flex items-center aspect-[4/5] sm:aspect-[16/10] sm:max-h-[900px]">
      {/* Full-bleed background image with art direction for mobile vs desktop */}
      {fallbackImg ? (
        <picture className="absolute inset-0 w-full h-full">
          {/* Mobile-specific image: served when viewport is ≤639px */}
          {mobile && (
            <source
              media="(max-width: 639px)"
              srcSet={mobile}
            />
          )}
          {/* Desktop-specific image: served for all wider viewports */}
          {desktop && (
            <source
              media="(min-width: 640px)"
              srcSet={desktop}
            />
          )}
          <img
            src={fallbackImg}
            alt={hero.imageAlt ?? ""}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/30 via-brand-lavender/20 to-brand-peach/30" aria-hidden="true" />
      )}

      {/* Overlay */}
      {overlay !== "none" && (
        <div
          className={`absolute inset-0 ${OVERLAY_CLASSES[overlay]}`}
          aria-hidden="true"
        />
      )}

      {/* Text content — positioned above image/overlay */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div
          className={`flex flex-col w-full max-w-3xl ${
            align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : ""
          } ${ALIGN_CLASSES[align]}`}
        >
          {hero.headline && (
            <h1
              className={`text-3xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight drop-shadow-md ${textColor}`}
            >
              {hero.headline}
            </h1>
          )}
          {hero.subheadline && (
            <p className={`mt-3 sm:mt-4 text-base sm:text-xl lg:text-2xl font-medium drop-shadow ${subTextColor}`}>
              {hero.subheadline}
            </p>
          )}
          {hero.ctaLabel && hero.ctaHref && (
            <div className="mt-6 sm:mt-8">
              <Link
                href={hero.ctaHref}
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200",
                })}
              >
                {hero.ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
