"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { siteConfig } from "../../../../site.config";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const {
    items,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    discount,
    couponCode,
    freeShippingRemaining,
    updateQuantity,
    removeItem,
    setCoupon,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCoupon(couponInput.toUpperCase(), data.discount);
        toast.success(`Coupon applied! You save $${data.discount.toFixed(2)}`);
      } else {
        toast.error(data.message || "Invalid coupon code");
      }
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-6">🛒</p>
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
          Your cart is empty
        </h1>
        <p className="text-brand-text-muted mb-6">
          Looks like you haven&apos;t added any sweet treats yet!
        </p>
        <Link
          href="/products"
          className={buttonVariants({ className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-8" })}
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-xl p-4 flex gap-4 items-center shadow-sm"
            >
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium hover:text-brand-primary transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-brand-primary font-semibold mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-2 hover:bg-gray-50"
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-2 hover:bg-gray-50"
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-semibold w-20 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-brand-text-muted hover:text-brand-error transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit sticky top-24">
          <h2 className="text-lg font-heading font-semibold text-brand-secondary mb-4">
            Order Summary
          </h2>

          {freeShippingRemaining > 0 && (
            <div className="bg-brand-mint/30 rounded-lg px-4 py-2 text-sm mb-4">
              Add <strong>${freeShippingRemaining.toFixed(2)}</strong> more for free shipping!
            </div>
          )}

          {/* Coupon */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={couponLoading}
              variant="outline"
            >
              Apply
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand-success">
                <span>Discount ({couponCode})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Shipping</span>
              <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Tax ({(siteConfig.taxRate * 100).toFixed(0)}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-brand-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className={buttonVariants({ className: "w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-12 text-base mt-4" })}
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
