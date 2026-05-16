import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { shippingRateRequestSchema } from "@/lib/validators/shipping";
import { getShippingRates } from "@/lib/shipping/rates";
import { getSettings } from "@/lib/settings";
import { ShippingRatesError } from "@/lib/shipping/errors";

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
          .select({
            id: products.id,
            weightOz: products.weightOz,
            defaultBoxId: products.defaultBoxId,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];
    const productById = new Map(productRows.map((p) => [p.id, p]));

    const cartItems = parsed.items.map((i) => {
      const p = productById.get(i.productId);
      return {
        productId: i.productId,
        quantity: i.quantity,
        weightOz: p?.weightOz ?? defaultWeight,
        defaultBoxId: p?.defaultBoxId ?? null,
      };
    });

    const rates = await getShippingRates(cartItems, parsed.destination);
    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[shipping/rates]", err);
    if (err instanceof ShippingRatesError && err.safe) {
      return NextResponse.json(
        {
          error: err.message,
          // Surface carrier-specific messages (e.g. "No carrier accounts
          // configured", "Invalid postal code") so the admin can diagnose
          // without digging through server logs.
          ...(err.carrierMessages && err.carrierMessages.length > 0
            ? { carrierMessages: err.carrierMessages }
            : {}),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not retrieve shipping rates. Please verify your address and try again." },
      { status: 400 }
    );
  }
}
