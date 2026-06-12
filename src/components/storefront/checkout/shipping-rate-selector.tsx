"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { ShippingRateOption } from "@/lib/shipping/rates";
import type { ShippingDestination } from "@/lib/validators/shipping";
import { Loader2, AlertCircle, Truck } from "lucide-react";

type CartLine = { productId: string; variantId?: string | null; quantity: number };

interface Props {
  destination: ShippingDestination | null;
  items: CartLine[];
  onError?: (message: string | null) => void;
}

function isCompleteAddress(d: ShippingDestination | null): d is ShippingDestination {
  if (!d) return false;
  return Boolean(
    d.street1?.trim() &&
      d.city?.trim() &&
      d.state?.length === 2 &&
      d.zip?.length >= 5 &&
      d.country === "US"
  );
}

function destinationKey(d: ShippingDestination | null) {
  if (!d) return "";
  return [d.street1, d.street2 || "", d.city, d.state, d.zip, d.country].join("|");
}

function itemsKey(items: CartLine[]) {
  return items
    .map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`)
    .sort()
    .join(",");
}

export function ShippingRateSelector({ destination, items, onError }: Props) {
  const selectedRate = useCartStore((s) => s.selectedRate);
  const setSelectedRate = useCartStore((s) => s.setSelectedRate);

  const [rates, setRates] = useState<ShippingRateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastRequestKeyRef = useRef<string>("");

  useEffect(() => {
    if (!isCompleteAddress(destination) || items.length === 0) {
      // Clear and bail — schedule on a microtask to avoid a sync-in-effect render
      Promise.resolve().then(() => {
        setRates([]);
        setError(null);
      });
      return;
    }

    const key = `${destinationKey(destination)}::${itemsKey(items)}`;
    if (key === lastRequestKeyRef.current) return;
    lastRequestKeyRef.current = key;

    let cancelled = false;

    // All initial state mutations happen inside the async chain so they don't
    // run synchronously inside the effect body.
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setSelectedRate(null);
        setLoading(true);
        setError(null);
        onError?.(null);
      })
      .then(() =>
        fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination, items }),
        })
      )
      .then(async (r) => ({ status: r!.status, body: await r!.json() }))
      .then(({ status, body }) => {
        if (cancelled) return;
        if (status !== 200) {
          const msg = body?.error || "Could not fetch shipping rates";
          setError(msg);
          onError?.(msg);
          setRates([]);
          return;
        }
        const list: ShippingRateOption[] = body.rates || [];
        setRates(list);
        if (list.length > 0) {
          setSelectedRate(list[0]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Network error";
        setError(msg);
        onError?.(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, items, setSelectedRate, onError]);

  if (!isCompleteAddress(destination)) {
    return (
      <div className="rounded-xl border border-dashed bg-white/60 p-6 text-sm text-brand-text-muted">
        Enter a complete shipping address above to see live shipping rates.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-white p-6 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
        Fetching live shipping rates…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
        No shipping options available for this address. Please verify the address.
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Shipping rate" className="space-y-3">
      {rates.map((rate) => {
        const isSelected = selectedRate?.rateId === rate.rateId;
        const id = `rate-${rate.rateId}`;
        return (
          <label
            key={rate.rateId}
            htmlFor={id}
            className={[
              "flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-all",
              isSelected
                ? "border-brand-primary bg-gradient-to-r from-brand-primary/5 via-purple-50 to-pink-50 shadow-sm ring-1 ring-brand-primary/20"
                : "border-gray-200 hover:border-brand-primary/40 hover:bg-purple-50/30",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <input
                id={id}
                type="radio"
                name="shipping-rate"
                value={rate.rateId}
                checked={isSelected}
                onChange={() => setSelectedRate(rate)}
                className="accent-brand-primary h-4 w-4"
              />
              <Truck
                className={`h-4 w-4 ${
                  isSelected ? "text-brand-primary" : "text-brand-text-muted"
                }`}
                aria-hidden
              />
              <div>
                <div className="text-sm font-semibold capitalize text-brand-secondary">
                  {rate.carrier === "flat" ? rate.service : `${rate.carrier.toUpperCase()} · ${rate.service}`}
                </div>
                {rate.estimatedDays !== null && (
                  <div className="text-xs text-brand-text-muted">
                    Est. {rate.estimatedDays} business day{rate.estimatedDays === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm font-bold text-brand-primary">
              ${(rate.amountCents / 100).toFixed(2)}
            </div>
          </label>
        );
      })}
    </div>
  );
}
