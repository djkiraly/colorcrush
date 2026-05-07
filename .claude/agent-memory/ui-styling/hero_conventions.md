---
name: Hero Component Conventions
description: ConfigurableHero layout pattern, art-direction approach for mobile/desktop images, and sizing tokens
type: project
---

ConfigurableHero (`src/components/storefront/ConfigurableHero.tsx`) is the primary hero when `settings.hero.enabled` is true. The fallback hero lives inline in `src/app/(storefront)/page.tsx`.

**Layout pattern**: section uses `relative overflow-hidden flex items-center min-h-[60vw] sm:min-h-[480px] lg:min-h-[600px]`. The background image is `absolute inset-0 w-full h-full object-cover`. Text content uses `relative z-10` to layer above image and overlay.

**Art direction (mobile image fix)**: Uses `<picture>` with two explicit `<source>` elements — `(max-width: 639px)` for mobile, `(min-width: 640px)` for desktop — then a fallback `<img>`. The 639/640px split aligns with Tailwind's `sm:` breakpoint. The mobile `<source>` is rendered whenever `mobile` is truthy (independent of whether desktop exists), unlike the old pattern which required both URLs.

**Typography scale**: headline `text-3xl sm:text-5xl lg:text-6xl`, subheadline `text-base sm:text-xl lg:text-2xl`. Drop shadows (`drop-shadow-md`, `drop-shadow`) applied to ensure legibility over images.

**CTA button**: `h-12 sm:h-14`, `px-8 sm:px-10`, `text-base sm:text-lg`, with `shadow-lg hover:shadow-xl transition-shadow`.

**Why:** Original hero had `h-auto max-h-[60vw]` image with absolute-positioned text — section height was image-driven and extremely short (~225px on mobile). The full-bleed `min-h` approach claims real viewport real estate on first paint.

**How to apply:** Any hero or banner section that needs to feel prominent should use `min-h` on the section (not rely on image natural height), with `absolute inset-0 object-cover` on the background image and `relative z-10` on text.
