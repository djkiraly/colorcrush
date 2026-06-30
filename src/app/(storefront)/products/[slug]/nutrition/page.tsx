import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNutritionBySlug } from "@/lib/queries/nutrition";
import {
  formatContainsStatement,
  type AllergenDeclaration,
} from "@/lib/allergens";
import { NutritionFactsPanel } from "@/components/storefront/NutritionFactsPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNutritionBySlug(slug);
  if (!data) return { title: "Nutrition information" };
  return {
    title: `${data.product.name} — Nutrition & Allergens`,
    description: `Nutrition facts, ingredients, and allergen information for ${data.product.name}.`,
    alternates: { canonical: `/products/${data.product.slug}/nutrition` },
  };
}

export default async function ProductNutritionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getNutritionBySlug(slug);
  if (!data) notFound();

  const { product, nutrition } = data;
  const containsStatement = nutrition
    ? formatContainsStatement(
        nutrition.majorAllergens as AllergenDeclaration[]
      )
    : null;

  return (
    <main className="min-h-screen bg-brand-bg pb-16">
      {/* Brand accent bar — purple → pink → teal → gold */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-secondary via-brand-pink to-brand-mint" />

      <div className="mx-auto w-full max-w-xl px-4 pt-6">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          {product.name}
        </h1>
        <Link
          href={`/products/${product.slug}`}
          className="text-sm text-brand-primary underline"
        >
          ← Back to product
        </Link>

        {!nutrition ? (
          <div className="mt-10 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-heading text-lg font-semibold text-brand-secondary">
              Nutrition information coming soon
            </p>
            <p className="mt-2 text-sm text-brand-text-secondary">
              We&apos;re still adding nutrition and allergen details for this
              product. Please check back later.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <NutritionFactsPanel nutrition={nutrition} />

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-brand-secondary">
                Ingredients
              </h2>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-brand-text">
                {nutrition.ingredients}
              </p>

              {/* FALCPA "Contains" statement — bold, directly below the
                  ingredients, at least as prominent as the ingredient list. */}
              {containsStatement ? (
                <p className="mt-4 text-base font-bold text-brand-text">
                  {containsStatement}
                </p>
              ) : nutrition.noMajorAllergensReviewed ? (
                <p className="mt-4 text-base text-brand-text-secondary">
                  No major allergens declared.
                </p>
              ) : null}

              {/* Cross-contact advisory — separate, visually distinct line.
                  Never part of the mandatory Contains statement. */}
              {nutrition.crossContactNote ? (
                <p className="mt-3 border-t border-brand-text-muted/20 pt-3 text-sm italic text-brand-text-secondary">
                  {nutrition.crossContactNote}
                </p>
              ) : null}
            </section>

            <p className="px-1 text-xs text-brand-text-muted">
              Nutrition and allergen information is provided by the manufacturer.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
