"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Suspense } from "react";
import { CheckCircle, Mail } from "lucide-react";

// Window globals injected by the AdPixels component
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const clearCart = useCartStore((s) => s.clearCart);
  const { data: session, status: sessionStatus } = useSession();
  const settings = useSiteSettings();

  const [info, setInfo] = useState<{
    accountCreated: boolean;
    email: string | null;
    isGuest: boolean;
    orderTotal?: number;
    currency?: string;
    orderId?: string;
  } | null>(null);

  useEffect(() => {
    if (sessionId) clearCart();
  }, [sessionId, clearCart]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/checkout/session-info?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.accountCreated === "boolean") setInfo(d);
      })
      .catch(() => {});
  }, [sessionId]);

  // Fire purchase conversion events to Google Ads and Meta once we have the
  // order total. Guarded by a per-session-id dedup key so the event fires
  // exactly once even if the user reloads the success page.
  useEffect(() => {
    if (!info || !info.orderTotal || !sessionId) return;
    const dedupKey = `_sv_conv_fired_${sessionId}`;
    try {
      if (sessionStorage.getItem(dedupKey)) return;
      sessionStorage.setItem(dedupKey, "1");
    } catch {
      // sessionStorage unavailable — fall through and fire anyway
    }

    const value = info.orderTotal;
    const currency = info.currency || "USD";
    const adsId = settings.analytics?.googleAdsId?.trim();
    const purchaseLabel = settings.analytics?.googleAdsPurchaseLabel?.trim();
    const metaId = settings.analytics?.metaPixelId?.trim();

    if (adsId && purchaseLabel && typeof window.gtag === "function") {
      // The send_to format is "<adsId>/<conversionLabel>".
      const sendTo = `${adsId}/${purchaseLabel}`;
      window.gtag("event", "conversion", {
        send_to: sendTo,
        value,
        currency,
        transaction_id: info.orderId,
      });
    }
    if (metaId && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", { value, currency });
    }
  }, [info, sessionId, settings.analytics]);

  const authed = !!session?.user;
  const accountCreated = info?.accountCreated ?? false;
  const email = info?.email ?? null;

  // Three states:
  // 1. Authed customer            → "View Orders" + "Continue Shopping"
  // 2. Not authed, account created → prompt to sign in (and verify) using the
  //    email they supplied at checkout
  // 3. Not authed, pure guest      → just "Continue Shopping"
  const showSignInPrompt = !authed && accountCreated;
  const loginHref = email
    ? `/login?email=${encodeURIComponent(email)}&next=/account/orders`
    : "/login?next=/account/orders";

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle className="h-20 w-20 text-brand-success" />
      </div>
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-4">
        Order Confirmed!
      </h1>
      <p className="text-brand-text-secondary mb-6">
        Thank you for your order. We&apos;ll send you a confirmation email with your order
        details and tracking information.
      </p>

      {sessionStatus !== "loading" && showSignInPrompt && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 text-left">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">Almost done — sign in to your new account</p>
              <p className="text-sm text-yellow-800 mt-1">
                We sent a verification email to{" "}
                <strong>{email || "your address"}</strong>. Please verify your email,
                then sign in to track this order.
              </p>
              <Link
                href={loginHref}
                className={buttonVariants({
                  className:
                    "mt-3 bg-brand-primary hover:bg-brand-primary-hover text-white",
                })}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {authed && (
          <Link
            href="/account/orders"
            className={buttonVariants({ variant: "outline", className: "px-6" })}
          >
            View Orders
          </Link>
        )}
        <Link
          href="/products"
          className={buttonVariants({
            className: "bg-brand-primary hover:bg-brand-primary-hover text-white px-6",
          })}
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
