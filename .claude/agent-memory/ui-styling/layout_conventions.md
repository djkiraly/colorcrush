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

**Why:** These conventions are established across Phase 1–5 commits and should be followed consistently on all new storefront pages.
