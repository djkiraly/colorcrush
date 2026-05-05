"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function VerificationGate({ email }: { email: string }) {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        toast.success("Verification email sent. Check your inbox.");
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.error || "Failed to send verification email");
      }
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-3">
          Verify your email to continue
        </h1>
        <p className="text-brand-text-secondary mb-2">
          You&apos;ll need to verify <strong>{email}</strong> before accessing your account.
        </p>
        <p className="text-sm text-brand-text-muted mb-6">
          Check your inbox for the verification link. After clicking it, refresh this page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleResend}
            disabled={resending}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            {resending ? "Sending…" : "Resend verification email"}
          </Button>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
