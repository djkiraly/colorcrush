"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useCartStore, lineKey } from "@/stores/cart-store";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { ShippingRateSelector } from "@/components/storefront/checkout/shipping-rate-selector";
import type { ShippingDestination } from "@/lib/validators/shipping";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

export default function CheckoutPage() {
  const { items, subtotal, taxAmount, discount, couponCode } = useCart();
  const selectedRate = useCartStore((s) => s.selectedRate);
  const { data: session, status: sessionStatus } = useSession();
  const siteConfig = useSiteSettings();
  const emailVerified = (session?.user as { emailVerified?: string | null })?.emailVerified;
  const isGuestUser = (session?.user as { isGuest?: boolean })?.isGuest ?? false;
  const isVerified = !!emailVerified;
  const [resending, setResending] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Guest checkout fields (shown only when no session)
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [guestPassword, setGuestPassword] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);

  const [shipAddr, setShipAddr] = useState({
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const destination: ShippingDestination | null = useMemo(() => {
    if (
      !shipAddr.street1.trim() ||
      !shipAddr.city.trim() ||
      shipAddr.state.length !== 2 ||
      shipAddr.zip.length < 5
    ) {
      return null;
    }
    return {
      street1: shipAddr.street1.trim(),
      street2: shipAddr.street2.trim() || undefined,
      city: shipAddr.city.trim(),
      state: shipAddr.state.toUpperCase(),
      zip: shipAddr.zip.trim(),
      country: "US",
    };
  }, [shipAddr]);

  const cartLines = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      })),
    [items]
  );

  const shippingCostCents = selectedRate?.amountCents ?? 0;
  const shippingCost = shippingCostCents / 100;
  const total =
    Math.max(0, subtotal - discount) + shippingCost + (subtotal - discount) * siteConfig.taxRate;

  const handleCheckout = async () => {
    if (!selectedRate) {
      toast.error("Please select a shipping option");
      return;
    }
    if (!session?.user) {
      // Guest validation
      if (!guestEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail.trim())) {
        setGuestError("Enter a valid email");
        return;
      }
      if (!guestName.trim()) {
        setGuestError("Enter your name");
        return;
      }
      if (createAccount && guestPassword.length < 8) {
        setGuestError("Password must be at least 8 characters");
        return;
      }
      setGuestError(null);
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
          })),
          shippingMethod: "standard", // legacy field; carrier/service comes from selectedRate
          shippingRate: {
            rateId: selectedRate.rateId,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            amountCents: selectedRate.amountCents,
            estimatedDays: selectedRate.estimatedDays,
          },
          shippingAddress: destination,
          couponCode,
          giftMessage: isGift ? giftMessage : undefined,
          isGift,
          guest: !session?.user
            ? {
                email: guestEmail.trim(),
                name: guestName.trim(),
                createAccount,
                password: createAccount ? guestPassword : undefined,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === "ACCOUNT_EXISTS") {
        setGuestError(data.error);
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-6">🛒</p>
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className={buttonVariants({
            className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 mt-4",
          })}
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const guestFieldsValid =
    !!session?.user ||
    (!!guestEmail.trim() &&
      !!guestName.trim() &&
      (!createAccount || guestPassword.length >= 8));
  const canPay = !!selectedRate && !!destination && guestFieldsValid;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">Checkout</h1>

      {session?.user && !isVerified && !isGuestUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">Email not verified</p>
            <p className="text-sm text-yellow-700 mt-1">
              You can still complete this order, but please verify your email so we can send you order
              updates.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                try {
                  const r = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session.user?.email }),
                  });
                  if (r.ok) {
                    toast.success("Verification email sent! Check your inbox.");
                  } else {
                    const data = await r.json().catch(() => ({}));
                    toast.error(data.error || "Failed to resend");
                  }
                } catch {
                  toast.error("Failed to resend");
                } finally {
                  setResending(false);
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              {resending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>
        </div>
      )}

      {!session?.user && sessionStatus !== "loading" && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold">Contact</h2>
            <Link
              href="/login?next=/checkout"
              className="text-sm text-brand-primary hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-name">Full name</Label>
              <Input
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Label htmlFor="create-account" className="cursor-pointer">
              Create an account to track this order
            </Label>
            <Switch
              id="create-account"
              checked={createAccount}
              onCheckedChange={setCreateAccount}
            />
          </div>
          {createAccount && (
            <div className="space-y-2 mt-3">
              <Label htmlFor="guest-password">Password (min. 8 characters)</Label>
              <Input
                id="guest-password"
                type="password"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-brand-text-muted">
                We&apos;ll email you a verification link after checkout completes.
              </p>
            </div>
          )}
          {guestError && (
            <p className="text-sm text-red-600 mt-3">{guestError}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-heading font-semibold mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street1">Street address</Label>
                <Input
                  id="street1"
                  value={shipAddr.street1}
                  onChange={(e) => setShipAddr({ ...shipAddr, street1: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street2">Apartment, suite (optional)</Label>
                <Input
                  id="street2"
                  value={shipAddr.street2}
                  onChange={(e) => setShipAddr({ ...shipAddr, street2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={shipAddr.city}
                  onChange={(e) => setShipAddr({ ...shipAddr, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  maxLength={2}
                  placeholder="NE"
                  value={shipAddr.state}
                  onChange={(e) => setShipAddr({ ...shipAddr, state: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={shipAddr.zip}
                  onChange={(e) => setShipAddr({ ...shipAddr, zip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={shipAddr.country} disabled />
              </div>
            </div>
          </div>

          {/* Shipping Method (live rates) */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-heading font-semibold mb-4">Shipping Method</h2>
            <ShippingRateSelector destination={destination} items={cartLines} />
          </div>

          {/* Gift Options */}
          {siteConfig.features.giftMessages && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold">Gift Options</h2>
                <Switch checked={isGift} onCheckedChange={setIsGift} />
              </div>
              {isGift && (
                <div className="space-y-2">
                  <Label htmlFor="giftMessage">Gift Message</Label>
                  <Textarea
                    id="giftMessage"
                    placeholder="Write a sweet message..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Order Review */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-heading font-semibold mb-4">Order Review</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={lineKey(item)} className="flex justify-between text-sm">
                  <span>
                    {item.name}
                    {item.variantDescription ? ` — ${item.variantDescription}` : ""} x{" "}
                    {item.quantity}
                  </span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20 sm:top-24">
            <h2 className="text-lg font-heading font-semibold text-brand-secondary mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-success">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Shipping</span>
                <span>
                  {selectedRate ? `$${shippingCost.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand-primary">${total.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={loading || !canPay}
              className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-12 text-base mt-4"
            >
              {loading
                ? "Redirecting..."
                : !destination
                ? "Enter Shipping Address"
                : !selectedRate
                ? "Select a Shipping Option"
                : !guestFieldsValid
                ? "Enter Contact Info"
                : "Pay with Stripe"}
            </Button>
            <p className="text-xs text-brand-text-muted text-center mt-3">
              You&apos;ll be redirected to Stripe for secure payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
