import type { CSSProperties } from "react";
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
  /**
   * Background shown behind the hero image. Visible in the pillar boxes on viewports
   * wider than the 1440px image, and behind transparent regions of a PNG/WEBP hero.
   * Precedence: gradient (if both from+to set) > color > default brand-pink/10.
   */
  backgroundColor?: string; // hex like "#fce4ec"
  backgroundGradient?: {
    from?: string; // hex
    to?: string; // hex
    angle?: number; // degrees, default 135
  };
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
  // The <img> src is the mobile-first default — small screens load it directly without
  // having to wait for the browser to evaluate any <source> media queries. Desktop
  // overrides this upward via a single <source media="(min-width: 640px)">. If only one
  // image is configured, that one is used for every viewport.
  const baseImg = mobile || desktop;
  const hasBoth = !!(mobile && desktop);
  const isLightOverlay = overlay === "light";
  const textColor = isLightOverlay ? "text-brand-secondary" : "text-white";
  const subTextColor = isLightOverlay
    ? "text-brand-secondary/80"
    : "text-white/90";

  const gradient = hero.backgroundGradient;
  const hasGradient = !!(gradient?.from && gradient?.to);
  const sectionStyle: CSSProperties | undefined = hasGradient
    ? {
        background: `linear-gradient(${gradient!.angle ?? 135}deg, ${gradient!.from}, ${gradient!.to})`,
      }
    : hero.backgroundColor
      ? { backgroundColor: hero.backgroundColor }
      : undefined;
  // Only fall back to the brand-pink tint if no custom background is configured.
  const fallbackBgClass = sectionStyle ? "" : "bg-brand-pink/10";

  return (
    /*
     * Sizing strategy:
     *   Mobile (<640px):  aspect-[4/5] full-bleed; mobile art-directed image fills the container.
     *   Desktop (≥640px): section is exactly 900px tall; the image is rendered at its native
     *                     1440×900 size (no scaling, no skewing), absolutely centered horizontally.
     *                     On viewports wider than 1440px, the brand-pink background fills the
     *                     pillar boxes; on viewports narrower than 1440px, sides are clipped
     *                     by overflow-hidden.
     */
    <section
      className={`relative overflow-hidden w-full ${fallbackBgClass} flex items-center aspect-[4/5] sm:aspect-auto sm:h-[900px]`}
      style={sectionStyle}
    >
      {baseImg ? (
        <picture className="absolute inset-0 sm:inset-auto sm:left-1/2 sm:top-0 sm:-translate-x-1/2 sm:w-[1440px] sm:h-[900px]">
          {/* Desktop override: only kicks in at ≥640px. If both mobile and desktop are set,
              this <source> wins on larger viewports; otherwise the <img> baseImg is used. */}
          {hasBoth && (
            <source
              media="(min-width: 640px)"
              srcSet={desktop}
              width={1440}
              height={900}
            />
          )}
          <img
            src={baseImg}
            alt={hero.imageAlt ?? ""}
            width={mobile ? 750 : 1440}
            height={mobile ? 1000 : 900}
            className="w-full h-full object-cover object-center sm:object-none"
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
