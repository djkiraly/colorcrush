"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const u = session?.user as
    | { email?: string | null; emailVerified?: string | null; isGuest?: boolean }
    | undefined;

  if (!u || u.emailVerified || u.isGuest || dismissed) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-yellow-900">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span>
            Please verify your email to receive order updates.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={resending}
            onClick={async () => {
              setResending(true);
              try {
                const r = await fetch("/api/auth/verify-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: u.email }),
                });
                if (r.ok) {
                  toast.success("Verification email sent! Check your inbox.");
                } else {
                  const data = await r.json().catch(() => ({}));
                  toast.error(data.error || "Failed to send");
                }
              } catch {
                toast.error("Failed to send");
              } finally {
                setResending(false);
              }
            }}
            className="font-semibold text-yellow-900 underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend email"}
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="text-yellow-700 hover:text-yellow-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
