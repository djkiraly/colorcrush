import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { getMigrationStatus } from "../src/lib/db/migration-status";

const STATUS_ONLY = process.argv.includes("--status") || process.argv.includes("--check");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const host = new URL(url).host;
  const sql = neon(url);
  const db = drizzle(sql);

  const before = await getMigrationStatus(db);

  console.log("─────────────────────────────────────────────");
  console.log(`Database:          ${host}`);
  console.log(`Current version:   ${formatVersion(before.currentVersion, before.currentTag)}`);
  console.log(`Target version:    ${formatVersion(before.targetVersion, before.targetTag)}`);
  console.log(`Status:            ${before.isCurrent ? "✓ up to date" : `${before.pending.length} pending`}`);
  if (before.pending.length > 0) {
    console.log("Pending migrations:");
    for (const p of before.pending) console.log(`  • [${p.idx}] ${p.tag}`);
  }
  console.log("─────────────────────────────────────────────");

  if (STATUS_ONLY) {
    console.log(before.isCurrent ? "No changes needed." : "Run `npm run migrate` to apply.");
    process.exit(before.isCurrent ? 0 : 2);
  }

  if (before.isCurrent) {
    console.log("Nothing to do.");
    return;
  }

  console.log(`Applying ${before.pending.length} migration(s)…`);
  await migrate(db, { migrationsFolder: "src/lib/db/migrations" });

  const after = await getMigrationStatus(db);
  console.log(`✅ Done. Database is now at ${formatVersion(after.currentVersion, after.currentTag)}.`);
}

function formatVersion(idx: number, tag: string | null): string {
  if (idx < 0 || !tag) return "(none — fresh DB)";
  return `v${idx} — ${tag}`;
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
