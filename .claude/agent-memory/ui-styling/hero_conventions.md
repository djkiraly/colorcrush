---
name: Hero Component Conventions
description: ConfigurableHero layout pattern, art-direction approach for mobile/desktop images, and sizing tokens
type: project
---

ConfigurableHero (`src/components/storefront/ConfigurableHero.tsx`) is the primary hero when `settings.hero.enabled` is true. The fallback hero lives inline in `src/app/(storefront)/page.tsx`.

**Layout pattern**: section uses `relative overflow-hidden flex items-center aspect-[4/5] sm:aspect-[16/10] sm:max-h-[900px]`. The background image is `absolute inset-0 w-full h-full object-cover object-center`. Text content uses `relative z-10` to layer above image and overlay.

**Desktop image spec**: Standardised on 1440×900px (16:10). `aspect-[16/10]` renders the image at its native proportions on viewports ≤1440px. `sm:max-h-[900px]` caps height on wider viewports so the hero never exceeds the source image's native height; `object-cover` only engages at that cap.

**Mobile sizing**: `aspect-[4/5]` gives a portrait crop on narrow viewports that suits a mobile-art-directed image without the old `min-h-[60vw]` vagueness.

**Art direction (mobile image fix)**: Uses `<picture>` with two explicit `<source>` elements — `(max-width: 639px)` for mobile, `(min-width: 640px)` for desktop — then a fallback `<img>`. The 639/640px split aligns with Tailwind's `sm:` breakpoint. The mobile `<source>` is rendered whenever `mobile` is truthy (independent of whether desktop exists).

**Typography scale**: headline `text-3xl sm:text-5xl lg:text-6xl`, subheadline `text-base sm:text-xl lg:text-2xl`. Drop shadows (`drop-shadow-md`, `drop-shadow`) applied to ensure legibility over images.

**CTA button**: `h-12 sm:h-14`, `px-8 sm:px-10`, `text-base sm:text-lg`, with `shadow-lg hover:shadow-xl transition-shadow`.

**Why:** Switched from `min-h` to `aspect-ratio` so the hero height tracks the 1440×900 image's natural proportions rather than arbitrary viewport fractions. The `max-h-[900px]` cap prevents runaway height on ultra-wide viewports.

**How to apply:** Use `aspect-[16/10] max-h-[900px]` for any 1440×900 hero. For different source dimensions, match the aspect ratio and set max-h to the source's pixel height.
