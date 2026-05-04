/**
 * One-off: backfill drizzle.__drizzle_migrations rows for migrations whose
 * effects are already present in the live schema. Inserts only — no schema
 * changes. After running, `npm run migrate` will treat 0002–0006 as applied
 * and only execute the new 0007 migration.
 *
 * Usage: npx tsx scripts/fix-migration-drift.ts [--dry-run]
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const DRY_RUN = process.argv.includes("--dry-run");
const TAGS_TO_BACKFILL = [
  "0002_slimy_bishop",
  "0003_stiff_joshua_kane",
  "0004_color_crush_taxonomy",
  "0005_scheduled_alerts",
  "0006_alerts_notified_at",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const folder = path.join(process.cwd(), "src/lib/db/migrations");
  const journal = JSON.parse(
    fs.readFileSync(path.join(folder, "meta/_journal.json"), "utf8")
  ) as { entries: Array<{ idx: number; tag: string; when: number }> };

  const sql = neon(url);

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`;

  const existing = (await sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations`) as Array<{
    hash: string;
    created_at: string | number | null;
  }>;
  const existingHashes = new Set(existing.map((r) => r.hash));
  console.log(`Existing rows in drizzle.__drizzle_migrations: ${existing.length}`);

  for (const tag of TAGS_TO_BACKFILL) {
    const entry = journal.entries.find((e) => e.tag === tag);
    if (!entry) {
      console.error(`✗ ${tag}: not found in journal`);
      continue;
    }
    const sqlContents = fs.readFileSync(path.join(folder, `${tag}.sql`), "utf8");
    const hash = crypto.createHash("sha256").update(sqlContents).digest("hex");

    if (existingHashes.has(hash)) {
      console.log(`✓ ${tag}: already in drizzle.__drizzle_migrations (hash match), skipping`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`(dry-run) would insert ${tag} hash=${hash.slice(0, 12)}… when=${entry.when}`);
      continue;
    }

    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when})`;
    console.log(`✓ ${tag}: backfilled (when=${entry.when})`);
  }

  console.log(DRY_RUN ? "\nDry run complete." : "\nDrift fix complete. Run `npm run migrate` next.");
}

main().catch((err) => {
  console.error("✗ Fix failed:", err);
  process.exit(1);
});
