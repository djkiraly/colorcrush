"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  CreditCard,
  Loader2,
  Trash2,
  ExternalLink,
  Webhook,
  Key,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdminStripePage() {
  const { data: session } = useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);

  const [config, setConfig] = useState({
    secretKey: "",
    publishableKey: "",
    webhookSecret: "",
  });

  // Test connection state
  const [testResult, setTestResult] = useState<{
    success: boolean;
    accountName?: string;
    error?: string;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Env var presence indicators
  const [envHints, setEnvHints] = useState({
    hasSecretKey: false,
    hasPublishableKey: false,
    hasWebhookSecret: false,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const stripeOverride = (data.overrides?.stripe || {}) as Record<
          string,
          unknown
        >;

        setConfig({
          secretKey: (stripeOverride.secretKey as string) || "",
          publishableKey: (stripeOverride.publishableKey as string) || "",
          webhookSecret: (stripeOverride.webhookSecret as string) || "",
        });
        setHasOverride(!!data.overrides?.stripe);

        // Check if env vars are set (we can't read them client-side,
        // but we can infer from the test endpoint later)
        setEnvHints({
          hasSecretKey: !!stripeOverride.secretKey,
          hasPublishableKey: !!stripeOverride.publishableKey,
          hasWebhookSecret: !!stripeOverride.webhookSecret,
        });
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "stripe",
          value: {
            secretKey: config.secretKey || undefined,
            publishableKey: config.publishableKey || undefined,
            webhookSecret: config.webhookSecret || undefined,
          },
        }),
      });
      if (res.ok) {
        toast.success(
          "Stripe settings saved! The client will reload with new keys."
        );
        setHasOverride(true);
        setTestResult(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "stripe", value: {} }),
      });
      if (res.ok) {
        toast.success("Stripe settings removed. Falling back to environment variables.");
        setConfig({ secretKey: "", publishableKey: "", webhookSecret: "" });
        setHasOverride(false);
        setTestResult(null);
      } else {
        toast.error("Failed to remove settings");
      }
    } catch {
      toast.error("Failed to remove settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/stripe-test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: "Failed to connect" });
    } finally {
      setTestLoading(false);
    }
  };

  function maskKey(key: string): string {
    if (!key) return "";
    if (key.length <= 12) return "••••••••";
    return key.slice(0, 7) + "••••••••" + key.slice(-4);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldCheck className="h-12 w-12 text-brand-text-muted mb-4" />
        <h2 className="text-xl font-heading font-bold text-brand-secondary mb-2">
          Super Admin Access Required
        </h2>
        <p className="text-brand-text-muted text-sm">
          Only super admins can configure payment integrations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Stripe Configuration
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Configure your Stripe payment integration. Values saved here override
            environment variables.
          </p>
        </div>
        {hasOverride && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <CheckCircle className="h-3 w-3" />
            Configured
          </span>
        )}
      </div>

      {/* API Keys Section */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-lavender/20">
            <Key className="h-5 w-5 text-brand-secondary" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-brand-secondary">
              API Keys
            </h2>
            <p className="text-xs text-brand-text-muted">
              Find these in your{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline inline-flex items-center gap-0.5"
              >
                Stripe Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Secret Key */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Secret Key
            <span className="text-xs text-brand-text-muted font-normal">
              (sk_live_... or sk_test_...)
            </span>
          </Label>
          <div className="relative">
            <Input
              type={showSecrets ? "text" : "password"}
              value={config.secretKey}
              onChange={(e) =>
                setConfig({ ...config, secretKey: e.target.value })
              }
              placeholder={
                hasOverride ? maskKey(config.secretKey) : "Uses STRIPE_SECRET_KEY env var"
              }
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowSecrets(!showSecrets)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
            >
              {showSecrets ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Publishable Key */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Publishable Key
            <span className="text-xs text-brand-text-muted font-normal">
              (pk_live_... or pk_test_...)
            </span>
          </Label>
          <Input
            type={showSecrets ? "text" : "password"}
            value={config.publishableKey}
            onChange={(e) =>
              setConfig({ ...config, publishableKey: e.target.value })
            }
            placeholder="Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY env var"
            className="font-mono text-sm"
          />
        </div>
      </div>

      {/* Webhook Section */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-mint/20">
            <Webhook className="h-5 w-5 text-brand-success" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-brand-secondary">
              Webhook
            </h2>
            <p className="text-xs text-brand-text-muted">
              Configure your webhook endpoint at{" "}
              <a
                href="https://dashboard.stripe.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline inline-flex items-center gap-0.5"
              >
                Stripe Webhooks <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Webhook Signing Secret
            <span className="text-xs text-brand-text-muted font-normal">
              (whsec_...)
            </span>
          </Label>
          <Input
            type={showSecrets ? "text" : "password"}
            value={config.webhookSecret}
            onChange={(e) =>
              setConfig({ ...config, webhookSecret: e.target.value })
            }
            placeholder="Uses STRIPE_WEBHOOK_SECRET env var"
            className="font-mono text-sm"
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-brand-text-secondary space-y-2">
          <p className="font-medium text-brand-text">Webhook Endpoint URL:</p>
          <code className="block bg-card rounded px-3 py-2 font-mono text-xs border">
            {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}
            /api/webhooks/stripe
          </code>
          <p className="text-xs text-brand-text-muted">
            Set this as your endpoint URL in Stripe. Listen for the{" "}
            <code className="bg-card px-1 py-0.5 rounded text-xs border">
              checkout.session.completed
            </code>{" "}
            event.
          </p>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-pink/20">
            <CreditCard className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-brand-secondary">
              Connection Status
            </h2>
            <p className="text-xs text-brand-text-muted">
              Test your Stripe integration
            </p>
          </div>
        </div>

        {/* Key mode indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand-text-muted">Mode:</span>
          {config.secretKey ? (
            config.secretKey.startsWith("sk_live") ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Test
              </span>
            )
          ) : (
            <span className="text-brand-text-muted text-xs">
              Determined by environment variable
            </span>
          )}
        </div>

        {/* Test Connection */}
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testLoading}
          className="w-full sm:w-auto"
        >
          {testLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>

        {/* Test Result */}
        {testResult && (
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${
              testResult.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              {testResult.success ? (
                <>
                  <p className="font-medium">Connected successfully!</p>
                  {testResult.accountName && (
                    <p className="mt-1">
                      Account: <strong>{testResult.accountName}</strong>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">Connection failed</p>
                  {testResult.error && (
                    <p className="mt-1 text-xs opacity-80">{testResult.error}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Configuration
        </Button>

        {hasOverride && (
          <Button variant="outline" onClick={handleRemove} disabled={saving}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remove &amp; Use Env Vars
          </Button>
        )}
      </div>

      {/* Info box */}
      <div className="bg-muted/30 rounded-lg p-4 text-xs text-brand-text-muted space-y-1 border border-border/30">
        <p>
          <strong>Priority:</strong> Settings saved here take precedence over
          environment variables. If removed, the system falls back to{" "}
          <code className="bg-card px-1 py-0.5 rounded border">STRIPE_SECRET_KEY</code>,{" "}
          <code className="bg-card px-1 py-0.5 rounded border">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, and{" "}
          <code className="bg-card px-1 py-0.5 rounded border">STRIPE_WEBHOOK_SECRET</code>.
        </p>
        <p>
          <strong>Security:</strong> Keys are stored encrypted in the database and
          are only accessible to super admins.
        </p>
      </div>
    </div>
  );
}
