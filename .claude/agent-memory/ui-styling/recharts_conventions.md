---
name: Recharts Chart Conventions
description: Patterns, constants, and anti-patterns for Recharts charts in the admin analytics section
type: project
---

Charts live in two files:
- `src/components/admin/charts/index.tsx` — sales/overview charts
- `src/components/admin/charts/traffic.tsx` — traffic/demographics charts (PageViews, TopPages, ProductViews, DonutChart, Referrers, Countries)

Both files MUST use the same shared constants (COLORS, TICK_COLOR, GRID_COLOR, TICK_FONT_SIZE, MARGIN_STANDARD, MARGIN_HORIZONTAL_BAR) to keep visual consistency.

## Shared constants (defined at module top)

- `TICK_COLOR = "#6B7280"` — maps to `brand-text-secondary`
- `GRID_COLOR = "#F3F4F6"` — maps to `muted`
- `TICK_FONT_SIZE = 11`
- `COLORS[]` — 8-item brand palette array, in the same order as globals.css tokens
- `MARGIN_STANDARD = { top: 8, right: 24, left: 0, bottom: 4 }` — used by line/area/vertical-bar charts
- `MARGIN_HORIZONTAL_BAR = { top: 8, right: 32, left: 0, bottom: 4 }` — used by horizontal bar charts

## Key design decisions

- `autoInterval(n)`: returns 0 if n <= 8, else `Math.ceil(n/7) - 1`. Caps XAxis to ~7 labels.
- YAxis `width` prop reserves its own space — left margin should be 0, not 10.
- `TopProductsChart` and `InventoryChart`: horizontal bars, sorted descending, 40px/36px row height, truncate labels at 20 chars, YAxis width=130.
- `CategoryPieChart`: labels suppressed on slices < 5% (`MIN_PERCENT_FOR_LABEL = 0.05`). Uses `PieLabel` component with geometric positioning (outerRadius + 22). Height 340, PieChart margin right+left=40 to prevent label clipping.
- `InventoryChart`: the second `Bar` for thresholds was broken (Bar doesn't support stroke/strokeDasharray). Replaced with `ReferenceLine` components (one per unique threshold value), keyed by value, oriented on the X axis.
- `InventoryChart` legend: uses static `payload` array with the 3 stock states rather than auto-derived from Bar names.
- All line charts: `dot={false}`, `activeDot={{ r: 4 }}` for clean rendering.

## Traffic-chart specific decisions (traffic.tsx)

- `DonutChart`: min threshold for labels is 4% (`MIN_PERCENT_FOR_LABEL = 0.04`). Uses `DonutPieLabel` component with geometric positioning (outerRadius + 20). Height 300, PieChart margin right+left=36.
- `TopPagesChart`: YAxis width=160 (paths are longer than product names). Truncate at 26 chars. Row height 40px.
- `CountriesChart`: grouped horizontal bars for views + unique visitors. `barSize=10`, `barCategoryGap="30%"`, row height 44px. Top margin=36 to give the Legend room above the bars.
- `ReferrersChart`: row height 36px (not 32 — avoid thin bars).
- `PageViewsChart` Legend: `height={36}` not 32, prevents overlap with area chart top.
- All `Tooltip`: add `contentStyle={{ fontSize: 12 }}` for readable tooltip text.

## Anti-patterns to avoid

- Do NOT use `Bar` with `fill="none"` and `stroke` as a threshold indicator — use `ReferenceLine` instead.
- Do NOT set left margin > 0 on charts that have a YAxis with an explicit `width` — it creates a double-indent.
- Do NOT render pie labels unconditionally — small slices overlap; gate on percent threshold.
- Do NOT hardcode COLORS/TICK_COLOR/GRID_COLOR differently in traffic.tsx vs index.tsx — they must be identical arrays/values.
- Do NOT use `data.length * 32` for row height in horizontal bar charts — use 36 (single bar) or 44 (grouped bars).
