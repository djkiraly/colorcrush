import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";
import { getCategoryBySlug } from "@/lib/queries/category";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Category not found" };

  const settings = await getSettings();
  const title = `${cat.name} — Shop ${cat.name}`;
  const description =
    cat.description ||
    `Shop our selection of ${cat.name.toLowerCase()} from ${settings.name}. Handcrafted, premium quality.`;
  const canonical = `/categories/${cat.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: cat.imageUrl ? [{ url: cat.imageUrl, alt: cat.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cat.imageUrl ? [cat.imageUrl] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const siteUrl = getSiteUrl();
  const breadcrumbs = [
    { name: "Home", url: `${siteUrl}/` },
    ...cat.ancestors.map((a) => ({
      name: a.name,
      url: `${siteUrl}/categories/${a.slug}`,
    })),
    { name: cat.name, url: `${siteUrl}/categories/${cat.slug}` },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryClient
        slug={cat.slug}
        name={cat.name}
        description={cat.description}
        ancestors={cat.ancestors}
      />
    </>
  );
}
