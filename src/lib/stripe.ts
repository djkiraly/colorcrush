import Stripe from "stripe";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

let _stripe: Stripe | null = null;
let _cachedSecretKey: string | null = null;
let _dbLoadPromise: Promise<void> | null = null;

async function fetchKeyFromDb(field: "secretKey" | "publishableKey" | "webhookSecret"): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "stripe"))
      .limit(1);
    if (row?.value) {
      const val = row.value as Partial<Record<typeof field, string>>;
      if (val[field]) return val[field]!;
    }
  } catch {}
  return "";
}

async function getSecretKey(): Promise<string> {
  return (await fetchKeyFromDb("secretKey")) || process.env.STRIPE_SECRET_KEY || "";
}

export async function getWebhookSecret(): Promise<string> {
  return (await fetchKeyFromDb("webhookSecret")) || process.env.STRIPE_WEBHOOK_SECRET || "";
}

export async function getPublishableKey(): Promise<string> {
  return (
    (await fetchKeyFromDb("publishableKey")) ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    ""
  );
}

function buildClient(key: string): Stripe {
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION, typescript: true });
}

/**
 * Loads the Stripe secret key from the DB (falling back to env) and rebuilds
 * the cached client if it differs. Memoized — concurrent callers share the
 * same in-flight promise.
 */
function ensureDbKeyLoaded(): Promise<void> {
  if (_dbLoadPromise) return _dbLoadPromise;
  _dbLoadPromise = (async () => {
    const key = await getSecretKey();
    if (key && key !== _cachedSecretKey) {
      _stripe = buildClient(key);
      _cachedSecretKey = key;
    }
  })().catch(() => {
    // Swallow — fall back to env-only client.
  });
  return _dbLoadPromise;
}

/** Force the next call to reload Stripe credentials from the DB. */
export function invalidateStripeClient(): void {
  _stripe = null;
  _cachedSecretKey = null;
  _dbLoadPromise = null;
}

/**
 * Synchronous accessor — used by code that needs the client immediately
 * (notably `stripe.webhooks.constructEvent`, which is local-only crypto and
 * doesn't actually require a valid API key). Falls back to env so it never
 * returns null. The DB-aware path is the proxy below.
 */
function getStripeSync(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY || "";
  _stripe = buildClient(key);
  _cachedSecretKey = key;
  // Kick off DB load so subsequent calls use the persisted key.
  void ensureDbKeyLoaded();
  return _stripe;
}

export async function getStripeClient(): Promise<Stripe> {
  await ensureDbKeyLoaded();
  return getStripeSync();
}

/**
 * Build a deferred-method proxy so any `stripe.foo.bar.baz(...)` call:
 *   1. Awaits the DB key load
 *   2. Walks the path on the freshly-cached client
 *   3. Forwards the call
 *
 * Property access stays sync (returns nested proxies). Only the final method
 * invocation is async, which matches Stripe SDK semantics — every Stripe
 * resource method already returns a Promise.
 */
function makeLazyProxy(path: string[]): unknown {
  const placeholder = function () {} as unknown as object;
  return new Proxy(placeholder, {
    get(_t, prop) {
      if (typeof prop === "symbol") return undefined;
      // If something `await`s the proxy itself, don't pretend to be a thenable.
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      return makeLazyProxy([...path, String(prop)]);
    },
    apply(_t, _this, args) {
      return ensureDbKeyLoaded().then(() => {
        let cursor: unknown = getStripeSync();
        for (let i = 0; i < path.length - 1; i++) {
          cursor = (cursor as Record<string, unknown>)[path[i]];
        }
        const method = (cursor as Record<string, unknown>)[path[path.length - 1]] as (
          ...a: unknown[]
        ) => unknown;
        return method.apply(cursor, args);
      });
    },
  });
}

/**
 * Lazy proxy. `stripe.checkout.sessions.create({...})` resolves the
 * DB-saved Stripe key on first call and rebuilds the client when it
 * differs from the env-built one. `stripe.webhooks.constructEvent` is
 * special-cased because it's sync and doesn't actually need a valid key
 * (signature verification only uses the webhook secret).
 */
export const stripe = new Proxy({} as Stripe, {
  get(_, topProp) {
    if (topProp === "webhooks") {
      return getStripeSync().webhooks;
    }
    if (typeof topProp === "symbol") return undefined;
    if (topProp === "then" || topProp === "catch" || topProp === "finally") return undefined;
    return makeLazyProxy([String(topProp)]);
  },
}) as Stripe;

export async function testStripeConnection(): Promise<{
  success: boolean;
  accountName?: string;
  error?: string;
}> {
  try {
    const client = await getStripeClient();
    const account = await client.accounts.retrieve();
    return {
      success: true,
      accountName:
        account.settings?.dashboard?.display_name ||
        account.business_profile?.name ||
        account.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
