import { getSettings } from "@/lib/settings";

/**
 * Resolve the public base URL of this deployment for outbound links
 * (verification emails, Stripe success/cancel URLs, etc).
 *
 * In production, env vars pointing at localhost are skipped — they're a
 * common footgun (a real .env.local left over from dev gets copied into
 * a prod deploy and poisons every customer-facing link). In development
 * mode localhost is fine, so we keep it.
 *
 * Priority:
 *   1. NEXTAUTH_URL          (skipped in prod if localhost)
 *   2. AUTH_URL              (skipped in prod if localhost)
 *   3. NEXT_PUBLIC_APP_URL   (skipped in prod if localhost)
 *   4. settings.url          (DB)
 *   5. ""
 *
 * Always returns the value with no trailing slash.
 */
export async function getPublicBaseUrl(): Promise<string> {
  const isProd = process.env.NODE_ENV === "production";
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (isProd && isLocalhost(c)) continue;
    return stripTrailingSlash(c);
  }

  try {
    const settings = await getSettings();
    if (settings.url && (!isProd || !isLocalhost(settings.url))) {
      return stripTrailingSlash(settings.url);
    }
  } catch {
    // ignore — fall through
  }
  return "";
}

/**
 * Synchronous best-effort version. Skips DB and uses env vars only. Use this
 * inside hot paths where awaiting `getSettings()` would be unjustified, or
 * in non-async contexts.
 */
export function getPublicBaseUrlSync(): string {
  const isProd = process.env.NODE_ENV === "production";
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (isProd && isLocalhost(c)) continue;
    return stripTrailingSlash(c);
  }
  return "";
}

function isLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1"
    );
  } catch {
    return /\blocalhost\b|\b127\.0\.0\.1\b/.test(url);
  }
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
