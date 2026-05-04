import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { shippingRateRequestSchema } from "@/lib/validators/shipping";
import { getShippingRates } from "@/lib/shipping/rates";
import { getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const body = await request.json();
    parsed = shippingRateRequestSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  try {
    const settings = await getSettings();
    const defaultWeight = settings.shipping.defaultProductWeightOz;

    const productIds = parsed.items.map((i) => i.productId);
    const productRows = productIds.length
      ? await db
          .select({ id: products.id, weightOz: products.weightOz })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];
    const weightById = new Map(productRows.map((p) => [p.id, p.weightOz]));

    const cartItems = parsed.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      weightOz: weightById.get(i.productId) ?? defaultWeight,
    }));

    const rates = await getShippingRates(cartItems, parsed.destination);
    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[shipping/rates]", err);
    const message = err instanceof Error ? err.message : "Failed to fetch shipping rates";
    // Sanitize: never leak Shippo internals to the client
    const safe = /SHIPPO_API_KEY|shippo|address|zip/i.test(message)
      ? "Could not retrieve shipping rates. Please verify your address and try again."
      : message;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
