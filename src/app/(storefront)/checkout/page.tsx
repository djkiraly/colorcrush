"use client";

import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, subtotal, shippingCost, taxAmount, total, discount, couponCode } = useCart();
  const siteConfig = useSiteSettings();
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "overnight">("standard");
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const shippingOptions = [
    { id: "standard", label: "Standard (5-7 business days)", price: siteConfig.shippingRates.standard },
    { id: "express", label: "Express (2-3 business days)", price: siteConfig.shippingRates.express },
    { id: "overnight", label: "Overnight (1 business day)", price: siteConfig.shippingRates.overnight },
  ];

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingMethod,
          couponCode,
          giftMessage: isGift ? giftMessage : undefined,
          isGift,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
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
        <Link href="/products" className={buttonVariants({ className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-8 mt-4" })}>
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping Method */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-heading font-semibold mb-4">Shipping Method</h2>
            <div className="space-y-3">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    shippingMethod === opt.id
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.id}
                      checked={shippingMethod === opt.id}
                      onChange={() => setShippingMethod(opt.id as "standard" | "express" | "overnight")}
                      className="accent-brand-primary"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {subtotal >= siteConfig.freeShippingThreshold && opt.id === "standard"
                      ? "FREE"
                      : `$${opt.price.toFixed(2)}`}
                  </span>
                </label>
              ))}
            </div>
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
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>
                    {item.name} x {item.quantity}
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
            <h2 className="text-lg font-heading font-semibold text-brand-secondary mb-4">
              Summary
            </h2>
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
                <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
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
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-12 text-base mt-4"
            >
              {loading ? "Redirecting..." : "Pay with Stripe"}
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
