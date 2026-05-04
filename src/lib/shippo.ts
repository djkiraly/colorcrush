import { Shippo } from "shippo";

let _client: Shippo | null = null;

function getClient(): Shippo {
  if (_client) return _client;
  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) throw new Error("SHIPPO_API_KEY is not set");
  _client = new Shippo({ apiKeyHeader: apiKey });
  return _client;
}

/**
 * Lazy proxy — defers SDK construction until first property access so importing
 * this module has no side effects (mirrors src/lib/db.ts and src/lib/stripe.ts).
 */
export const shippo = new Proxy({} as Shippo, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});

export const isShippoTestMode = process.env.SHIPPO_TEST_MODE === "true";
