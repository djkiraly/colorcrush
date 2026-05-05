import { siteConfig } from "../../site.config";

/**
 * Resolve the canonical site origin for SEO surfaces (canonicals, OG URLs,
 * sitemap, JSON-LD).
 *
 * Order: NEXT_PUBLIC_SITE_URL env → siteConfig.url. Always returns a value
 * with no trailing slash.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const raw = (fromEnv && fromEnv.trim()) || siteConfig.url;
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path) return base;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
