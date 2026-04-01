"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { Suspense } from "react";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (sessionId) clearCart();
  }, [sessionId, clearCart]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle className="h-20 w-20 text-brand-success" />
      </div>
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-4">
        Order Confirmed!
      </h1>
      <p className="text-brand-text-secondary mb-8">
        Thank you for your order. We&apos;ll send you a confirmation email with your order details and tracking information.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/account/orders"
          className={buttonVariants({ variant: "outline", className: "px-6" })}
        >
          View Orders
        </Link>
        <Link
          href="/products"
          className={buttonVariants({ className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-6" })}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
