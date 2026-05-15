import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import ProductsClient from "./ProductsClient";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = "Shop All Candy & Chocolates";
  const description = `Browse the full collection of handcrafted candies, chocolates, and gift boxes from ${settings.name}.`;
  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/products",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ProductsPage() {
  return <ProductsClient />;
}
