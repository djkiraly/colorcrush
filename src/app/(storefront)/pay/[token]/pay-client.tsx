"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

export default function PayClient({ token, successUrl }: { token: string; successUrl: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pay/${token}/intent`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
        setStripePromise(loadStripe(data.publishableKey));
      })
      .catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">
        Could not initialize payment: {error}
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Loading payment form…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold mb-4">Payment</h2>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PayForm successUrl={successUrl} />
      </Elements>
    </div>
  );
}

function PayForm({ successUrl }: { successUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${successUrl}`,
      },
    });

    if (error) {
      setErrorMsg(error.message || "Payment failed");
      setSubmitting(false);
    }
    // On success, Stripe redirects to return_url
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}
