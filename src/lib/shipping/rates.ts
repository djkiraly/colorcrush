import { shippo } from "@/lib/shippo";
import { getSettings } from "@/lib/settings";
import {
  calculateCartWeightOz,
  selectBoxForCart,
  type CartItemForShipping,
} from "@/lib/shipping/box-selector";
import type { ShippingDestination } from "@/lib/validators/shipping";
import { ShippingRatesError } from "@/lib/shipping/errors";

export interface ShippingRateOption {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  estimatedDays: number | null;
  isFlatRate: boolean;
}

export type DestinationAddress = ShippingDestination;

const CARRIER_KEYS = {
  USPS: "usps",
  UPS: "ups",
  FEDEX: "fedex",
} as const;

function isCarrierEnabled(
  provider: string,
  enabled: { usps: boolean; ups: boolean; fedex: boolean }
): boolean {
  const key = (CARRIER_KEYS as Record<string, "usps" | "ups" | "fedex">)[
    provider.toUpperCase()
  ];
  if (!key) return false;
  return enabled[key] ?? false;
}

/**
 * Compute shipping rate options for a cart shipping to `destination`.
 *
 * - Carts at or below `flatRateThresholdOz` get a single flat-rate option and
 *   skip the Shippo call entirely.
 * - Otherwise we select a box, build a Shippo shipment, filter by enabled
 *   carriers, and return rates sorted cheapest-first.
 */
export async function getShippingRates(
  items: CartItemForShipping[],
  destination: DestinationAddress
): Promise<ShippingRateOption[]> {
  const settings = await getSettings();
  const ship = settings.shipping;

  const totalWeightOz = calculateCartWeightOz(items, ship.defaultProductWeightOz);

  // Flat-rate path
  if (totalWeightOz <= ship.flatRateThresholdOz) {
    return [
      {
        rateId: "flat-standard",
        carrier: "flat",
        service: ship.flatRateLabel,
        amountCents: ship.flatRateCents,
        estimatedDays: null,
        isFlatRate: true,
      },
    ];
  }

  // Live-rate path via Shippo
  const box = await selectBoxForCart(items, ship.defaultProductWeightOz);
  if (!box) {
    throw new ShippingRatesError(
      "No active shipping boxes configured. Add or activate a box in admin settings.",
      true
    );
  }

  if (!ship.origin?.street1 || !ship.origin?.city || !ship.origin?.state || !ship.origin?.zip) {
    throw new ShippingRatesError(
      "Origin (ship-from) address is not fully configured.",
      true
    );
  }

  const totalWeightLb = Math.max(0.01, totalWeightOz / 16);
  const weightLb = (Math.round(totalWeightLb * 100) / 100).toFixed(2);

  let shipment;
  try {
    shipment = await shippo.shipments.create({
    addressFrom: {
      name: ship.origin.name,
      street1: ship.origin.street1,
      street2: ship.origin.street2 || undefined,
      city: ship.origin.city,
      state: ship.origin.state,
      zip: ship.origin.zip,
      country: ship.origin.country,
      phone: ship.origin.phone || undefined,
      email: ship.origin.email || undefined,
    },
    addressTo: {
      // Carrier label prints whatever `name` we send here. Always use the
      // shopper-supplied recipient name (falls back to a placeholder only when
      // the legacy validator allowed it through with no name).
      name: destination.name?.trim() || "Recipient",
      street1: destination.street1,
      street2: destination.street2 || undefined,
      city: destination.city,
      state: destination.state,
      zip: destination.zip,
      country: destination.country,
      phone: destination.phone?.trim() || undefined,
    },
    parcels: [
      {
        length: String(box.lengthIn),
        width: String(box.widthIn),
        height: String(box.heightIn),
        distanceUnit: "in",
        weight: weightLb,
        massUnit: "lb",
      },
    ],
    async: false,
  });
  } catch (err) {
    console.error("[shipping/rates] Shippo SDK error:", err);
    // Pull as much useful detail as we can out of the SDK exception so the
    // admin can diagnose: Shippo SDK errors include `body`, `statusCode`, and
    // sometimes a structured response. Strip the API key if it sneaks in.
    const errAny = err as {
      message?: string;
      statusCode?: number;
      body?: unknown;
      rawResponse?: unknown;
    };
    const detail = [
      errAny.statusCode ? `HTTP ${errAny.statusCode}` : null,
      errAny.message,
      typeof errAny.body === "string"
        ? errAny.body
        : errAny.body
        ? JSON.stringify(errAny.body)
        : null,
    ]
      .filter(Boolean)
      .join(" — ");
    throw new ShippingRatesError(
      "Could not retrieve shipping rates from the carrier. Please verify your address.",
      true,
      detail ? [detail] : undefined
    );
  }

  const messages = (shipment as { messages?: Array<{ text?: string; source?: string }> })
    .messages;
  if (Array.isArray(messages) && messages.length > 0) {
    console.warn(
      "[shipping/rates] Shippo returned messages:",
      messages.map((m) => `${m.source || "?"}: ${m.text || ""}`).join(" | ")
    );
  }

  const rawRates = (shipment.rates ?? []) as Array<{
    objectId?: string;
    provider?: string;
    servicelevel?: { name?: string; token?: string };
    amount?: string;
    estimatedDays?: number;
  }>;

  const filtered = rawRates.filter((r) =>
    isCarrierEnabled(r.provider || "", ship.carriersEnabled)
  );

  const mapped: ShippingRateOption[] = filtered
    .map((r) => ({
      rateId: r.objectId || "",
      carrier: (r.provider || "").toLowerCase(),
      service: r.servicelevel?.name || r.servicelevel?.token || "Service",
      amountCents: Math.round(parseFloat(r.amount || "0") * 100),
      estimatedDays:
        typeof r.estimatedDays === "number" ? r.estimatedDays : null,
      isFlatRate: false,
    }))
    .filter((r) => r.rateId && r.amountCents > 0)
    .sort((a, b) => a.amountCents - b.amountCents);

  if (mapped.length === 0) {
    // No rates from any enabled carrier. Surface the cause if Shippo gave us one.
    const carrierMessages = (messages || [])
      .map((m) => `${m.source ? `[${m.source}] ` : ""}${m.text || ""}`.trim())
      .filter(Boolean);
    if (carrierMessages.length > 0) {
      console.warn(
        "[shipping/rates] No usable rates; carrier messages:",
        carrierMessages.join(" | ")
      );
    }
    // Diagnostic: log how many rates Shippo returned vs how many passed our
    // enabled-carrier filter, so admins can tell the difference between
    // "Shippo returned nothing" and "we filtered everything out".
    const providersReturned = Array.from(
      new Set(rawRates.map((r) => (r.provider || "?").toLowerCase()))
    );
    console.warn(
      `[shipping/rates] Shippo returned ${rawRates.length} raw rate(s) from providers [${providersReturned.join(", ") || "none"}]; ${filtered.length} matched enabled carriers (${Object.entries(
        ship.carriersEnabled
      )
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ") || "none"})`
    );
    throw new ShippingRatesError(
      "No shipping options are available for this address. Please verify the address or contact support.",
      true,
      carrierMessages
    );
  }

  return mapped;
}
