/**
 * Seeds the shipping_boxes table with the standard set used by box-selector.
 * Idempotent: skips inserting any box whose name already exists.
 *
 * Usage: npx tsx scripts/seed-boxes.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { shippingBoxes } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const BOXES = [
  { name: "Small Bag", lengthIn: "6.00", widthIn: "4.00", heightIn: "2.00", maxWeightOz: 16, sortOrder: 10 },
  { name: "Medium Box", lengthIn: "9.00", widthIn: "6.00", heightIn: "4.00", maxWeightOz: 48, sortOrder: 20 },
  { name: "Large Box", lengthIn: "12.00", widthIn: "9.00", heightIn: "6.00", maxWeightOz: 96, sortOrder: 30 },
  { name: "Candy Buffet", lengthIn: "16.00", widthIn: "12.00", heightIn: "8.00", maxWeightOz: 240, sortOrder: 40 },
];

async function main() {
  for (const box of BOXES) {
    const existing = await db
      .select({ id: shippingBoxes.id })
      .from(shippingBoxes)
      .where(eq(shippingBoxes.name, box.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`✓ ${box.name}: already seeded, skipping`);
      continue;
    }

    await db.insert(shippingBoxes).values(box);
    console.log(`✓ ${box.name}: inserted`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
