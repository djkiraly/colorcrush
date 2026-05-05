import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { getProductBySlug } from "@/lib/queries/product";
import { getSettings } from "@/lib/settings";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const settings = await getSettings();
  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    settings.description;
  const primaryImage =
    product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
  const canonical = `/products/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(canonical),
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const siteUrl = getSiteUrl();
  const settings = await getSettings();
  const canonical = `${siteUrl}/products/${product.slug}`;
  const inStock = (product.inventory?.quantity ?? 0) > 0;

  // Serialize Date fields for client component boundary
  const detailProduct = {
    ...product,
    reviews: product.reviews.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : (r.createdAt as unknown as string),
    })),
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description || product.shortDescription || product.name,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    brand: product.manufacturer
      ? { "@type": "Brand", name: product.manufacturer }
      : { "@type": "Brand", name: settings.name },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: settings.currency || "USD",
      price: Number(product.price).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating.toFixed(2),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbs: { name: string; url: string }[] = [
    { name: "Home", url: `${siteUrl}/` },
    { name: "Products", url: `${siteUrl}/products` },
  ];
  if (product.category) {
    breadcrumbs.push({
      name: product.category.name,
      url: `${siteUrl}/categories/${product.category.slug}`,
    });
  }
  breadcrumbs.push({ name: product.name, url: canonical });

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetail product={detailProduct as never} />
    </>
  );
}
