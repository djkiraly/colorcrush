"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { CheckCircle, Loader2, MailX, AlertCircle } from "lucide-react";

function UnsubscribeContent() {
  const settings = useSiteSettings();
  const params = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; email: string; alreadyUnsubscribed: boolean }
    | { status: "done"; email: string }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "This unsubscribe link is missing its token." });
      return;
    }
    fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setState({ status: "error", message: data.error || "Invalid link" });
          return;
        }
        setState({
          status: "ready",
          email: data.email,
          alreadyUnsubscribed: !!data.alreadyUnsubscribed,
        });
      })
      .catch(() => setState({ status: "error", message: "Network error" }));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error || "Failed to unsubscribe" });
        return;
      }
      setState({ status: "done", email: data.email });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {state.status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 text-brand-text-muted mx-auto mb-4 animate-spin" />
          <p className="text-brand-text-muted">Loading…</p>
        </>
      )}

      {state.status === "error" && (
        <>
          <AlertCircle className="h-16 w-16 text-brand-error mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
            Couldn&apos;t process this link
          </h1>
          <p className="text-brand-text-secondary mb-6">{state.message}</p>
          <p className="text-sm text-brand-text-muted">
            If you keep seeing this, please email{" "}
            {settings.contact?.email ? (
              <a
                href={`mailto:${settings.contact.email}`}
                className="text-brand-primary underline"
              >
                {settings.contact.email}
              </a>
            ) : (
              "us"
            )}{" "}
            and we&apos;ll remove you manually.
          </p>
        </>
      )}

      {state.status === "ready" && (
        <>
          <MailX className="h-16 w-16 text-brand-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
            {state.alreadyUnsubscribed
              ? "You're already unsubscribed"
              : "Unsubscribe from emails?"}
          </h1>
          <p className="text-brand-text-secondary mb-6">
            {state.alreadyUnsubscribed ? (
              <>
                <strong>{state.email}</strong> is no longer on the newsletter list.
              </>
            ) : (
              <>
                We&apos;ll stop sending newsletters to{" "}
                <strong>{state.email}</strong>. Transactional emails
                (order confirmations, shipping updates) will still come through.
              </>
            )}
          </p>
          {!state.alreadyUnsubscribed && (
            <Button
              onClick={handleUnsubscribe}
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm unsubscribe
            </Button>
          )}
          <div className="mt-8">
            <Link href="/" className="text-sm text-brand-primary hover:underline">
              ← Back to {settings.name}
            </Link>
          </div>
        </>
      )}

      {state.status === "done" && (
        <>
          <CheckCircle className="h-16 w-16 text-brand-success mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-brand-text-secondary mb-6">
            We won&apos;t send any more newsletters to{" "}
            <strong>{state.email}</strong>. Sorry to see you go!
          </p>
          <Link
            href="/"
            className="text-sm text-brand-primary hover:underline"
          >
            ← Back to {settings.name}
          </Link>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
