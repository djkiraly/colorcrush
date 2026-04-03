---
name: Layout Conventions
description: Page wrapper, 2-col product grid, Tabs containment pattern used in the storefront
type: project
---

**Page wrapper (storefront):**
`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`

**Product detail grid:**
`grid grid-cols-1 lg:grid-cols-2 gap-10` — images left, info right. Images column uses `space-y-4`; info column uses `space-y-6`.

**Section vertical rhythm:** `py-12 md:py-20` (standard), `mt-12` for Tabs section below the product grid.

**Tabs containment rule:** The `<Tabs>` root gets `w-full overflow-hidden`; every `<TabsContent>` gets `min-w-0`. This prevents rich-text or wide table children from causing horizontal scroll.

**Allergen banner:** Uses hardcoded `bg-yellow-50` / `text-yellow-800` in `ProductDetail.tsx` — known styling debt (not a design token). Leave for a dedicated token audit.

**Admin analytics tab bar (line variant):**
`<TabsList variant="line" className="w-full justify-start">` — full-width underline-style tabs. The `line` variant adds `border-b border-border` to the list as the track, and the active trigger's `::after` pseudo-element (positioned at `bottom-[-1px]`, height `0.5rem`, `bg-primary`) overlaps the track to form the underline indicator. Triggers in this variant use `py-2.5 px-4` (overriding the default `py-0.5 px-1.5` pill sizing). Tab content gets `pt-6` for breathing room.

**Period filter button group (analytics header):**
`flex gap-1 p-1 rounded-lg bg-muted` container. Active button: `bg-card shadow-sm text-brand-secondary`. Inactive: `text-muted-foreground hover:text-foreground hover:bg-card/60`. Uses `bg-card` not `bg-white` to work in dark mode.

**StatsCard dark mode:**
`StatsCard` receives a `color` className (e.g., `bg-brand-mint/20`) as a transparent overlay. The base card must be `bg-card border border-border/50 dark:border-border/30 shadow-sm` before the color prop is applied via `cn()`.

**Why:** These conventions are established across Phase 1–5 commits and should be followed consistently on all new storefront pages.
