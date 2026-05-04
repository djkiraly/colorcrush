"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Printer } from "lucide-react";

interface Props {
  orderId: string;
  hasLabel: boolean;
  labelUrl?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export function PrintLabelButton({
  orderId,
  hasLabel,
  labelUrl,
  trackingNumber,
  trackingUrl,
}: Props) {
  const [busy, setBusy] = useState(false);

  if (hasLabel) {
    return (
      <div className="space-y-2 rounded-lg border bg-emerald-50 p-3 text-sm">
        <div className="font-medium text-emerald-900">Label purchased</div>
        {trackingNumber && (
          <div className="text-emerald-800">
            Tracking:{" "}
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono"
              >
                {trackingNumber}
              </a>
            ) : (
              <span className="font-mono">{trackingNumber}</span>
            )}
          </div>
        )}
        {labelUrl && (
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-800 underline"
          >
            <ExternalLink className="h-3 w-3" /> View label PDF
          </a>
        )}
      </div>
    );
  }

  async function buy() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/label`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error ||
          (Array.isArray(data.messages) && data.messages.length
            ? data.messages.map((m: { text?: string }) => m.text).filter(Boolean).join("; ")
            : "Failed to purchase label");
        toast.error(msg);
        return;
      }
      toast.success("Label purchased");
      if (data.labelUrl) window.open(data.labelUrl, "_blank", "noopener,noreferrer");
      // Reload to surface the new tracking + label state
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={buy} disabled={busy} className="justify-start">
      <Printer className="h-4 w-4" /> {busy ? "Purchasing…" : "Buy & Print Label"}
    </Button>
  );
}
