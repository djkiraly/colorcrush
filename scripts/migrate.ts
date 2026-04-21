import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Aborting migration.");
    process.exit(1);
  }

  console.log("Running migrations against", new URL(url).host);

  const sql = neon(url);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "src/lib/db/migrations" });

  console.log("✅ Migrations applied.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
