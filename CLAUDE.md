# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Next.js 16)
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit generate   # Generate migration from schema changes
npm run migrate            # Run pending migrations (uses neon-http migrator — drizzle-kit migrate is incompatible with Neon)
npx drizzle-kit push       # Push schema directly (dev shortcut, skips migrations)
npx tsx scripts/seed.ts          # Seed database with sample data
npx tsx scripts/create-admin.ts  # Create an admin user
```

## Architecture

**E-commerce candy store** ("Sweet Haven") — Next.js 16 App Router with two route groups:

- `(storefront)` — Public-facing shop: products, categories, cart, checkout, build-your-own-box, accounts
- `admin` — Admin portal (role-gated via `auth()` in layout): products, orders, customers, analytics, settings, inventory, coupons, reviews, emails, interactions

**Key layers:**

- **Database**: Drizzle ORM + Neon Postgres (serverless HTTP driver). Schema in `src/lib/db/schema.ts`, migrations in `src/lib/db/migrations/`. The `db` export is a lazy proxy — no import-time side effects.
- **Auth**: NextAuth v5 (beta) with Google OAuth + credentials provider. Session includes user `role` (customer/admin/super_admin). Auth config in `src/lib/auth.ts`.
- **Payments**: Stripe (lazy proxy like db). Webhook handler at `api/webhooks/`.
- **Storage**: Google Cloud Storage for product images. GCS config is stored in the `site_settings` DB table and loaded at runtime (`src/lib/gcs.ts`).
- **Email**: Gmail API via googleapis (`src/lib/gmail.ts`). HTML templates in `src/lib/email-templates/`.
- **Settings**: Two-tier config — static defaults in `site.config.ts` (brand, colors, shipping rates, feature flags), with DB overrides in `site_settings` table merged at runtime (`src/lib/settings.ts`).

**Frontend patterns:**

- UI components: shadcn/ui in `src/components/ui/`, domain components split into `src/components/storefront/` and `src/components/admin/`
- State: Zustand stores in `src/stores/` (cart, filters)
- Forms: react-hook-form + zod validators (schemas in `src/lib/validators/`)
- Styling: Tailwind CSS v4, fonts Inter (body) + Poppins (headings)
- Charts: Recharts for admin analytics dashboard

**Path alias**: `@/*` maps to `./src/*`

**Environment**: Config loaded from `.env.local` (DATABASE_URL, Stripe keys, Google OAuth, GCS credentials).
