---
name: Project Design Tokens
description: Brand color tokens, CSS custom properties, font families, and radius scale defined in globals.css
type: project
---

Tailwind v4 with `@theme inline` block in `src/app/globals.css` — no `tailwind.config.ts` exists.

**Brand color tokens (--color-brand-*):**
- `brand-primary`: #F43F5E (rose-500 equivalent)
- `brand-primary-hover`: #E11D48
- `brand-secondary`: #581C87 (purple-900)
- `brand-pink`, `brand-mint`, `brand-lavender`, `brand-peach`, `brand-sky`: accent palette
- `brand-bg`: #FAFAFA | `brand-surface`: #FFFFFF
- `brand-text`: #1E1B2E | `brand-text-secondary`: #6B7280 | `brand-text-muted`: #9CA3AF
- `brand-success`: #10B981 | `brand-warning`: #F59E0B | `brand-error`: #EF4444

**Typography:**
- `--font-sans`: Inter, system-ui — body
- `--font-heading`: Poppins — headings (loaded via @font-face from Google Fonts URL, not next/font)
- `--font-mono`: Geist Mono

**Radius scale:** `--radius: 0.75rem`, sm/md/lg/xl/2xl/3xl/4xl variants via calc().

**No `@tailwindcss/typography` plugin installed** — prose classes are unavailable. Rich text must be styled with custom CSS.

**Styling approach:** Tailwind v4 uses `@theme inline` + CSS custom properties. Colors are referenced as `bg-brand-primary` etc. in JSX, or as `var(--color-brand-*)` in CSS rules.

**Why:** Design tokens are defined in globals.css using Tailwind v4's `@theme inline` block, not a JS config file.
**How to apply:** Always reference `var(--color-brand-*)` in CSS blocks and `bg-brand-*`/`text-brand-*` in JSX classNames. Never hardcode hex values.
