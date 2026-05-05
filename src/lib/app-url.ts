import { getSettings } from "@/lib/settings";

/**
 * Resolve the public base URL of this deployment for outbound links
 * (verification emails, Stripe success/cancel URLs, etc).
 *
 * Priority — environment variables come first because they are
 * deployment-specific and the most reliable signal of where this
 * particular running process is exposed:
 *   1. NEXTAUTH_URL
 *   2. AUTH_URL
 *   3. NEXT_PUBLIC_APP_URL
 *   4. settings.url   (DB; can be stale across env imports)
 *   5. ""             (caller responsible for handling)
 *
 * Always returns the value with no trailing slash.
 */
export async function getPublicBaseUrl(): Promise<string> {
  const fromEnv =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  if (fromEnv) return stripTrailingSlash(fromEnv);

  try {
    const settings = await getSettings();
    if (settings.url) return stripTrailingSlash(settings.url);
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
  return stripTrailingSlash(
    process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ""
  );
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
