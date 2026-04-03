import Stripe from "stripe";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let _stripe: Stripe | null = null;
let _cachedSecretKey: string | null = null;

async function getSecretKey(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "stripe"))
      .limit(1);
    if (row?.value) {
      const val = row.value as { secretKey?: string };
      if (val.secretKey) return val.secretKey;
    }
  } catch {}
  return process.env.STRIPE_SECRET_KEY || "";
}

export async function getWebhookSecret(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "stripe"))
      .limit(1);
    if (row?.value) {
      const val = row.value as { webhookSecret?: string };
      if (val.webhookSecret) return val.webhookSecret;
    }
  } catch {}
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export async function getPublishableKey(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "stripe"))
      .limit(1);
    if (row?.value) {
      const val = row.value as { publishableKey?: string };
      if (val.publishableKey) return val.publishableKey;
    }
  } catch {}
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

async function getStripeClient(): Promise<Stripe> {
  const key = await getSecretKey();
  if (!key) throw new Error("Stripe secret key not configured");
  if (_stripe && _cachedSecretKey === key) return _stripe;
  _stripe = new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  _cachedSecretKey = key;
  return _stripe;
}

export function invalidateStripeClient(): void {
  _stripe = null;
  _cachedSecretKey = null;
}

export function getStripe(): Stripe {
  // Synchronous fallback using env var (for backwards compat)
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      _stripe = new Stripe(key, {
        apiVersion: "2026-03-25.dahlia",
        typescript: true,
      });
      _cachedSecretKey = key;
    }
  }
  return _stripe!;
}

// Lazy proxy — works synchronously for existing call sites
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

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
