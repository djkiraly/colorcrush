/**
 * Manual smoke test — pings the Shippo API to confirm the configured key works.
 * Not run in CI; invoke directly when troubleshooting connectivity.
 *
 * Usage: npx tsx scripts/test-shippo.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { shippo, isShippoTestMode } from "../src/lib/shippo";

async function main() {
  console.log(`Shippo test mode: ${isShippoTestMode}`);
  const result = await shippo.addresses.list();
  const count = Array.isArray(result?.results) ? result.results.length : 0;
  console.log(`✓ Connected. addresses.list() returned ${count} record(s).`);
}

main().catch((err) => {
  console.error("✗ Shippo connection failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
