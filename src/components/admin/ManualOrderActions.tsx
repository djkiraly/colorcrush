"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Copy, Check, Send, CreditCard, DollarSign, X } from "lucide-react";

type Order = {
  id: string;
  status: string;
  paymentMethod: string | null;
  paymentLinkToken: string | null;
  paymentLinkExpiresAt: string | null;
  total: string;
  orderNumber: string;
};

export function ManualOrderActions({
  order,
  onChange,
}: {
  order: Order;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isDraft = order.status === "draft";
  const isPending = order.status === "pending_payment";
  const isPostPayment = ["confirmed", "paid_offline", "processing", "shipped", "delivered"].includes(order.status);

  async function sendLink(isResend: boolean) {
    setBusy(true);
    try {
      const url = isResend
        ? `/api/admin/orders/${order.id}/resend-payment-link`
        : `/api/admin/orders/${order.id}/send-payment-link`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPayUrl(data.payUrl);
      toast.success(isResend ? "Payment link resent" : "Payment link sent");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDraft(reason: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/cancel-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("Draft cancelled");
      setShowCancel(false);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (isPostPayment) {
    return <PaymentMethodBadge method={order.paymentMethod} />;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold">Payment</h3>

      {isPending && order.paymentLinkToken && (
        <PaymentLinkInfo
          token={order.paymentLinkToken}
          expiresAt={order.paymentLinkExpiresAt}
          recentlyCopied={copied}
          onCopy={() => {
            const url = payUrl || `${window.location.origin}/pay/${order.paymentLinkToken}`;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-2">
        {isDraft && (
          <Button onClick={() => sendLink(false)} disabled={busy} className="justify-start">
            <Send className="h-4 w-4" /> Send payment link
          </Button>
        )}
        {isPending && (
          <Button onClick={() => sendLink(true)} disabled={busy} variant="secondary" className="justify-start">
            <Send className="h-4 w-4" /> Resend payment link
          </Button>
        )}
        <Button
          onClick={() => setShowCharge(true)}
          disabled={busy}
          variant="secondary"
          className="justify-start"
        >
          <CreditCard className="h-4 w-4" /> Take payment now
        </Button>
        <Button
          onClick={() => setShowOffline(true)}
          disabled={busy}
          variant="secondary"
          className="justify-start"
        >
          <DollarSign className="h-4 w-4" /> Mark paid (offline)
        </Button>
        <Button
          onClick={() => setShowCancel(true)}
          disabled={busy}
          variant="destructive"
          className="justify-start"
        >
          <X className="h-4 w-4" /> {isDraft ? "Cancel draft" : "Cancel order"}
        </Button>
      </div>

      <OfflinePaymentModal
        open={showOffline}
        onOpenChange={setShowOffline}
        orderId={order.id}
        onDone={() => {
          setShowOffline(false);
          onChange();
        }}
      />

      <AdminChargeModal
        open={showCharge}
        onOpenChange={setShowCharge}
        orderId={order.id}
        onDone={() => {
          setShowCharge(false);
          onChange();
        }}
      />

      <CancelDraftModal
        open={showCancel}
        onOpenChange={setShowCancel}
        onConfirm={cancelDraft}
      />
    </div>
  );
}

function PaymentLinkInfo({
  token,
  expiresAt,
  recentlyCopied,
  onCopy,
}: {
  token: string;
  expiresAt: string | null;
  recentlyCopied: boolean;
  onCopy: () => void;
}) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/pay/${token}`
    : `/pay/${token}`;
  const expires = expiresAt ? new Date(expiresAt) : null;
  const isExpired = expires ? expires < new Date() : false;

  return (
    <div className="rounded-lg border bg-amber-50 p-3 text-sm">
      <div className="font-medium mb-1">Payment link active</div>
      <div className="flex items-center gap-2 mb-2">
        <code className="flex-1 truncate font-mono text-xs bg-white border rounded px-2 py-1">
          {url}
        </code>
        <Button size="icon" variant="ghost" onClick={onCopy} type="button">
          {recentlyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {expires && (
          <>
            {isExpired ? "Expired " : "Expires "}
            {expires.toLocaleString()}
          </>
        )}
      </div>
    </div>
  );
}

function PaymentMethodBadge({ method }: { method: string | null }) {
  const labels: Record<string, string> = {
    stripe_checkout: "Stripe Checkout",
    stripe_admin_charge: "Stripe (Admin Charged)",
    stripe_customer_pay: "Stripe (Customer Paid via Link)",
    offline_cash: "Cash",
    offline_check: "Check",
    offline_other: "Other (offline)",
  };
  const label = method ? labels[method] || method : "—";
  return (
    <div className="rounded-lg border bg-card p-4 text-sm">
      <div className="text-muted-foreground mb-1">Payment</div>
      <div className="font-medium">{label}</div>
    </div>
  );
}

function OfflinePaymentModal({
  open,
  onOpenChange,
  orderId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  orderId: string;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "check" | "other">("cash");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid-offline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, notes: notes.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("Order marked as paid");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark order as paid (offline)</DialogTitle>
          <DialogDescription>
            Use this for cash, check, or any payment taken outside Stripe. The order will be
            confirmed and inventory decremented.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Method</Label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "cash" | "check" | "other")}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Check #1234, paid in store, etc."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Recording..." : "Mark as paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDraftModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order</DialogTitle>
          <DialogDescription>
            This will mark the order as cancelled. If a payment link was sent, it will become
            invalid.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason (optional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="..." />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep order
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Cancel order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminChargeModal({
  open,
  onOpenChange,
  orderId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  orderId: string;
  onDone: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch the PaymentIntent when modal opens
  if (open && !clientSecret && !error) {
    fetch(`/api/admin/orders/${orderId}/charge`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
        setStripePromise(loadStripe(data.publishableKey));
      })
      .catch((err) => setError(String(err)));
  }

  function handleClose(b: boolean) {
    if (!b) {
      setClientSecret(null);
      setStripePromise(null);
      setError(null);
    }
    onOpenChange(b);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Enter the customer's card details. The order will be confirmed automatically once
            payment succeeds.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && (!clientSecret || !stripePromise) && (
          <p className="text-sm text-muted-foreground">Loading payment form…</p>
        )}
        {clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <ChargeForm onDone={onDone} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChargeForm({ onDone }: { onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      setErrorMsg(error.message || "Payment failed");
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      toast.success("Payment successful");
      // Webhook handles finalize; small delay to let it land before we re-fetch.
      setTimeout(onDone, 1500);
    } else if (paymentIntent) {
      toast.message(`Payment ${paymentIntent.status}`);
      setTimeout(onDone, 1500);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing..." : "Charge card"}
      </Button>
    </form>
  );
}
