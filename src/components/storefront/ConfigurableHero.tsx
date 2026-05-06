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
  const fallbackImg = desktop || hero.imageMobileUrl;
  const isLightOverlay = overlay === "light";
  const textColor = isLightOverlay ? "text-brand-secondary" : "text-white";
  const subTextColor = isLightOverlay
    ? "text-brand-secondary/80"
    : "text-white/90";

  return (
    <section className="relative overflow-hidden w-full bg-brand-pink/10">
      {fallbackImg ? (
        <picture>
          {hero.imageMobileUrl && hero.imageDesktopUrl && (
            <source
              media="(max-width: 640px)"
              srcSet={hero.imageMobileUrl}
            />
          )}
          <img
            src={fallbackImg}
            alt={hero.imageAlt ?? ""}
            className="block mx-auto w-auto h-auto max-w-full max-h-[60vw] sm:max-h-[420px] lg:max-h-[520px]"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      ) : (
        <div className="aspect-[3/4] sm:aspect-[12/5] w-full" aria-hidden="true" />
      )}
      {overlay !== "none" && fallbackImg && (
        <div
          className={`absolute inset-0 ${OVERLAY_CLASSES[overlay]}`}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div
            className={`flex flex-col w-full max-w-3xl ${
              align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : ""
            } ${ALIGN_CLASSES[align]}`}
          >
            {hero.headline && (
              <h1
                className={`text-2xl sm:text-4xl lg:text-6xl font-heading font-bold leading-tight ${textColor}`}
              >
                {hero.headline}
              </h1>
            )}
            {hero.subheadline && (
              <p className={`mt-2 sm:mt-4 text-sm sm:text-lg lg:text-xl font-medium ${subTextColor}`}>
                {hero.subheadline}
              </p>
            )}
            {hero.ctaLabel && hero.ctaHref && (
              <div className="mt-4 sm:mt-8">
                <Link
                  href={hero.ctaHref}
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "bg-brand-primary hover:bg-brand-primary-hover text-white px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base rounded-xl",
                  })}
                >
                  {hero.ctaLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
