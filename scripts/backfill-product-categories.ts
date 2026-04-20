import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

(async () => {
  const r = await db.execute(
    sql`INSERT INTO product_categories (product_id, category_id)
        SELECT id, category_id FROM products WHERE category_id IS NOT NULL
        ON CONFLICT DO NOTHING`
  );
  console.log("Backfilled rows:", r.rowCount ?? "ok");
  process.exit(0);
})();
