import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { shippingRateRequestSchema } from "@/lib/validators/shipping";
import { getShippingRates } from "@/lib/shipping/rates";
import {
  calculateCartWeightOz,
  selectBoxForCart,
} from "@/lib/shipping/box-selector";
import { getSettings } from "@/lib/settings";
import { ShippingRatesError } from "@/lib/shipping/errors";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";

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

  // Admin diagnostic mode: include a per-item weight breakdown in the response
  // so an admin can verify every cart item is being counted with the correct
  // weight. Customers never see this — it's gated on session role.
  const session = await getAuthSession();
  const includeDebug =
    isAdmin(session) || request.nextUrl.searchParams.get("debug") === "1";
  // The `debug=1` URL flag is admin-only too: only honored when isAdmin passes,
  // otherwise it's silently ignored. (Re-check explicitly.)
  const debugEnabled = isAdmin(session) && includeDebug;

  try {
    const settings = await getSettings();
    const defaultWeight = settings.shipping.defaultProductWeightOz;

    const productIds = parsed.items.map((i) => i.productId);
    const productRows = productIds.length
      ? await db
          .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            weightOz: products.weightOz,
            defaultBoxId: products.defaultBoxId,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];
    const productById = new Map(productRows.map((p) => [p.id, p]));

    // When a size/variant is selected, its weightOzOverride (if set) takes
    // precedence over the base product weight. Fetch overrides for every
    // variant referenced in the cart.
    const variantIds = [
      ...new Set(
        parsed.items
          .map((i) => i.variantId)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const variantRows = variantIds.length
      ? await db
          .select({
            id: productVariants.id,
            weightOzOverride: productVariants.weightOzOverride,
          })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : [];
    const variantById = new Map(variantRows.map((v) => [v.id, v]));

    // Resolve per-line weight: selected variant override → product weight →
    // configured default.
    const resolveWeightOz = (item: { productId: string; variantId?: string | null }) => {
      const override = item.variantId
        ? variantById.get(item.variantId)?.weightOzOverride
        : null;
      if (override != null) return override;
      return productById.get(item.productId)?.weightOz ?? defaultWeight;
    };

    const cartItems = parsed.items.map((i) => {
      const p = productById.get(i.productId);
      return {
        productId: i.productId,
        quantity: i.quantity,
        weightOz: resolveWeightOz(i),
        defaultBoxId: p?.defaultBoxId ?? null,
      };
    });

    const rates = await getShippingRates(cartItems, parsed.destination);

    if (debugEnabled) {
      const totalWeightOz = calculateCartWeightOz(cartItems, defaultWeight);
      const selectedBox = await selectBoxForCart(cartItems, defaultWeight);
      const breakdown = parsed.items.map((i) => {
        const p = productById.get(i.productId);
        const productWeightOz = p?.weightOz ?? 0;
        const variantWeightOz = i.variantId
          ? variantById.get(i.variantId)?.weightOzOverride ?? null
          : null;
        const effectiveWeightOz = resolveWeightOz(i);
        return {
          productId: i.productId,
          variantId: i.variantId ?? null,
          name: p?.name ?? "(unknown product)",
          sku: p?.sku ?? null,
          quantity: i.quantity,
          productWeightOz,
          variantWeightOz,
          effectiveWeightOz,
          subtotalOz: effectiveWeightOz * i.quantity,
          usedVariantOverride: variantWeightOz != null,
          usedDefault: variantWeightOz == null && productWeightOz <= 0,
          missingFromDb: !p,
        };
      });
      const totalWeightLb = Math.round((totalWeightOz / 16) * 100) / 100;
      return NextResponse.json({
        rates,
        debug: {
          itemCount: parsed.items.length,
          totalWeightOz,
          totalWeightLb,
          defaultProductWeightOz: defaultWeight,
          flatRateThresholdOz: settings.shipping.flatRateThresholdOz,
          isFlatRatePath: totalWeightOz <= settings.shipping.flatRateThresholdOz,
          selectedBox: selectedBox
            ? {
                id: selectedBox.id,
                name: selectedBox.name,
                dimsIn: `${selectedBox.lengthIn} × ${selectedBox.widthIn} × ${selectedBox.heightIn}`,
              }
            : null,
          items: breakdown,
        },
      });
    }

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
