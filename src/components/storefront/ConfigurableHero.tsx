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
  const mobile = hero.imageMobileUrl || desktop;
  const isLightOverlay = overlay === "light";
  const textColor = isLightOverlay ? "text-brand-secondary" : "text-white";
  const subTextColor = isLightOverlay
    ? "text-brand-secondary/80"
    : "text-white/90";

  return (
    <section className="relative overflow-hidden min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] flex">
      {desktop && (
        <picture>
          {hero.imageMobileUrl && (
            <source
              media="(max-width: 640px)"
              srcSet={hero.imageMobileUrl}
            />
          )}
          <img
            src={mobile}
            alt={hero.imageAlt ?? ""}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      )}
      {overlay !== "none" && desktop && (
        <div
          className={`absolute inset-0 ${OVERLAY_CLASSES[overlay]}`}
          aria-hidden="true"
        />
      )}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex">
        <div
          className={`flex flex-col w-full max-w-3xl ${
            align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : ""
          } ${ALIGN_CLASSES[align]}`}
        >
          {hero.headline && (
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight ${textColor}`}
            >
              {hero.headline}
            </h1>
          )}
          {hero.subheadline && (
            <p className={`mt-4 text-xl font-medium ${subTextColor}`}>
              {hero.subheadline}
            </p>
          )}
          {hero.ctaLabel && hero.ctaHref && (
            <div className="mt-8">
              <Link
                href={hero.ctaHref}
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 h-12 text-base rounded-xl",
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
