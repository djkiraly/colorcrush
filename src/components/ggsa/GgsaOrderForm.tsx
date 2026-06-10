"use client";

import { useState } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ggsaOrderSchema,
  GGSA_UNIT_PRICE_CENTS,
  GGSA_MIN_QUANTITY,
  type GgsaFlavor,
} from "@/lib/validators/ggsa";

const FLAVORS: { value: GgsaFlavor; label: string; blurb: string }[] = [
  { value: "sour", label: "Sour", blurb: "Tangy & puckery" },
  { value: "sweet", label: "Sweet", blurb: "Classic sugary" },
  { value: "mixed", label: "Mixed", blurb: "Best of both" },
];

const MAX_QTY = 500;

export function GgsaOrderForm() {
  const [flavor, setFlavor] = useState<GgsaFlavor | null>(null);
  const [quantity, setQuantity] = useState(GGSA_MIN_QUANTITY);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const totalCents = GGSA_UNIT_PRICE_CENTS * Math.max(GGSA_MIN_QUANTITY, quantity);
  const totalLabel = `$${(totalCents / 100).toFixed(2)}`;

  const clamp = (n: number) => Math.min(MAX_QTY, Math.max(GGSA_MIN_QUANTITY, n));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = { flavor, quantity, contactName, email, phone };
    const parsed = ggsaOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ggsa/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrors({ form: data.error || "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrors({ form: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Flavor — single select */}
      <fieldset>
        <legend className="block text-sm font-semibold text-[#581C87] mb-2">
          Choose a flavor
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {FLAVORS.map((f) => {
            const selected = flavor === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFlavor(f.value)}
                className={[
                  "rounded-xl border-2 px-3 py-4 text-center transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B2D8E] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#7B2D8E] bg-[#7B2D8E] text-white shadow-md"
                    : "border-gray-200 bg-white text-[#1E1B2E] hover:border-[#7B2D8E]/50 hover:bg-[#7B2D8E]/5",
                ].join(" ")}
              >
                <span className="block font-heading font-bold text-base">{f.label}</span>
                <span
                  className={[
                    "block text-xs mt-0.5",
                    selected ? "text-white/80" : "text-gray-500",
                  ].join(" ")}
                >
                  {f.blurb}
                </span>
              </button>
            );
          })}
        </div>
        {errors.flavor && (
          <p className="mt-1.5 text-sm text-red-600">{errors.flavor}</p>
        )}
      </fieldset>

      {/* Quantity */}
      <div>
        <Label htmlFor="ggsa-qty" className="text-sm font-semibold text-[#581C87]">
          Quantity
        </Label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => clamp(q - 1))}
            disabled={quantity <= GGSA_MIN_QUANTITY}
            className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-gray-200 text-[#7B2D8E] transition-colors hover:bg-[#7B2D8E]/5 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Minus className="h-4 w-4" />
          </button>
          <Input
            id="ggsa-qty"
            type="number"
            inputMode="numeric"
            min={GGSA_MIN_QUANTITY}
            max={MAX_QTY}
            value={quantity}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setQuantity(Number.isNaN(n) ? GGSA_MIN_QUANTITY : clamp(n));
            }}
            className="h-11 w-24 text-center text-lg font-semibold"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => clamp(q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-gray-200 text-[#7B2D8E] transition-colors hover:bg-[#7B2D8E]/5"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="ml-auto text-right">
            <span className="block text-xs text-gray-500">Total</span>
            <span className="block font-heading text-2xl font-bold text-[#7B2D8E]">
              {totalLabel}
            </span>
          </span>
        </div>
        {errors.quantity && (
          <p className="mt-1.5 text-sm text-red-600">{errors.quantity}</p>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Contact details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="ggsa-name" className="text-sm font-semibold text-[#581C87]">
            Contact name
          </Label>
          <Input
            id="ggsa-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
            className="mt-1.5 h-11"
            aria-invalid={!!errors.contactName}
          />
          {errors.contactName && (
            <p className="mt-1.5 text-sm text-red-600">{errors.contactName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="ggsa-email" className="text-sm font-semibold text-[#581C87]">
            Email
          </Label>
          <Input
            id="ggsa-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-1.5 h-11"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="ggsa-phone" className="text-sm font-semibold text-[#581C87]">
            Phone number
          </Label>
          <Input
            id="ggsa-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(308) 555-0123"
            autoComplete="tel"
            className="mt-1.5 h-11"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B2D8E] px-6 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-[#6A2479] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B2D8E] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting to checkout…
          </>
        ) : (
          <>Checkout · {totalLabel}</>
        )}
      </button>
      <p className="text-center text-xs text-gray-500">
        Secure payment powered by Stripe. You&apos;ll confirm before paying.
      </p>
    </form>
  );
}
