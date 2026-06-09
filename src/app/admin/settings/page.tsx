"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, RotateCcw, Shield, Upload, CheckCircle, XCircle, Cloud, Mail, Eye, EyeOff, ImageIcon, Trash2, Construction, Megaphone, Candy, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ShippingBoxesManager } from "@/components/admin/shipping-boxes-manager";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const [defaults, setDefaults] = useState<any>(null);
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [brand, setBrand] = useState({
    name: "",
    tagline: "",
    description: "",
    url: "",
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [business, setBusiness] = useState({
    taxRate: "",
    freeShippingThreshold: "",
  });
  const [shipping, setShipping] = useState({
    standard: "",
    express: "",
    overnight: "",
  });
  const [shippoSettings, setShippoSettings] = useState({
    flatRateCents: "699",
    flatRateThresholdOz: "32",
    carriersEnabled: { usps: true, ups: true, fedex: true },
    origin: {
      name: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      phone: "",
      email: "",
    },
  });
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
  });
  const [social, setSocial] = useState({
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter: "",
  });
  const [features, setFeatures] = useState({
    buildYourOwnBox: true,
    giftMessages: true,
    subscriptions: false,
    reviews: true,
    wishlist: true,
    loyaltyPoints: false,
    customerDeletion: false,
  });
  const [maintenanceMode, setMaintenanceMode] = useState({
    enabled: false,
    heading: "",
    message: "",
    videoEnabled: false,
    videoUrl: "",
  });
  const [announcementBar, setAnnouncementBar] = useState({
    enabled: true,
    text: "",
  });
  const [analytics, setAnalytics] = useState({
    googleAdsId: "",
    googleAdsPurchaseLabel: "",
    metaPixelId: "",
  });
  const [ggsa, setGgsa] = useState({
    enabled: false,
    logoColorCrush: "",
    logoGgsa: "",
    productImages: ["", "", ""] as string[],
  });
  // Which GGSA image slot is currently uploading: "logoColorCrush" | "logoGgsa"
  // | "img-0" | "img-1" | "img-2" | null.
  const [uploadingGgsa, setUploadingGgsa] = useState<string | null>(null);
  const [hero, setHero] = useState({
    enabled: false,
    headline: "",
    subheadline: "",
    imageDesktopUrl: "",
    imageMobileUrl: "",
    imageAlt: "",
    ctaLabel: "",
    ctaHref: "",
    textAlign: "center" as "left" | "center" | "right",
    overlay: "dark" as "dark" | "light" | "none",
    hideHeaderLogoOnHome: false,
    backgroundColor: "",
    backgroundGradient: { from: "", to: "", angle: 135 },
  });
  const [uploadingHeroDesktop, setUploadingHeroDesktop] = useState(false);
  const [uploadingHeroMobile, setUploadingHeroMobile] = useState(false);
  const [gcs, setGcs] = useState({
    projectId: "",
    bucketName: "",
    serviceAccountName: "",
    hasServiceAccount: false,
  });
  const [gcsTestResult, setGcsTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const [gcsTestLoading, setGcsTestLoading] = useState(false);
  const [gmail, setGmail] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    sendFrom: "",
  });
  const [gmailShowSecrets, setGmailShowSecrets] = useState(false);
  const [gmailTestResult, setGmailTestResult] = useState<{
    success: boolean;
    email?: string;
    error?: string;
  } | null>(null);
  const [gmailTestLoading, setGmailTestLoading] = useState(false);
  const [colors, setColors] = useState({
    primary: "",
    primaryHover: "",
    secondary: "",
    accent: { pink: "", mint: "", lavender: "", peach: "", sky: "" },
    background: "",
    surface: "",
    success: "",
    warning: "",
    error: "",
  });
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiShowKey, setOpenaiShowKey] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [openaiTestLoading, setOpenaiTestLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setDefaults(data.defaults);
        setOverrides(data.overrides || {});

        const m = data.merged;
        setBrand({
          name: m.name,
          tagline: m.tagline,
          description: m.description,
          url: m.url,
        });
        setBusiness({
          taxRate: String(m.taxRate),
          freeShippingThreshold: String(m.freeShippingThreshold),
        });
        setShipping({
          standard: String(m.shippingRates.standard),
          express: String(m.shippingRates.express),
          overnight: String(m.shippingRates.overnight),
        });
        if (m.shipping) {
          setShippoSettings({
            flatRateCents: String(m.shipping.flatRateCents),
            flatRateThresholdOz: String(m.shipping.flatRateThresholdOz),
            carriersEnabled: {
              usps: !!m.shipping.carriersEnabled?.usps,
              ups: !!m.shipping.carriersEnabled?.ups,
              fedex: !!m.shipping.carriersEnabled?.fedex,
            },
            origin: {
              name: m.shipping.origin?.name || "",
              street1: m.shipping.origin?.street1 || "",
              street2: m.shipping.origin?.street2 || "",
              city: m.shipping.origin?.city || "",
              state: m.shipping.origin?.state || "",
              zip: m.shipping.origin?.zip || "",
              country: m.shipping.origin?.country || "US",
              phone: m.shipping.origin?.phone || "",
              email: m.shipping.origin?.email || "",
            },
          });
        }
        setContact({ ...m.contact });
        setSocial({ ...m.social });
        setFeatures({ ...m.features });
        setColors({
          primary: m.colors.primary,
          primaryHover: m.colors.primaryHover,
          secondary: m.colors.secondary,
          accent: { ...m.colors.accent },
          background: m.colors.background,
          surface: m.colors.surface,
          success: m.colors.success,
          warning: m.colors.warning,
          error: m.colors.error,
        });

        // Load maintenance mode
        const maintenanceOverride = (data.overrides?.maintenanceMode || {}) as Record<string, unknown>;
        setMaintenanceMode({
          enabled: (maintenanceOverride.enabled as boolean) || false,
          heading: (maintenanceOverride.heading as string) || "",
          message: (maintenanceOverride.message as string) || "",
          videoEnabled: (maintenanceOverride.videoEnabled as boolean) || false,
          videoUrl: (maintenanceOverride.videoUrl as string) || "",
        });

        const announcementOverride = (data.overrides?.announcementBar || {}) as Record<string, unknown>;
        setAnnouncementBar({
          enabled:
            typeof announcementOverride.enabled === "boolean" ? (announcementOverride.enabled as boolean) : true,
          text: (announcementOverride.text as string) || "",
        });

        const analyticsOverride = (data.overrides?.analytics || {}) as Record<string, unknown>;
        const analyticsDefaults = (m.analytics || {}) as Record<string, string>;
        setAnalytics({
          googleAdsId:
            (analyticsOverride.googleAdsId as string) ?? analyticsDefaults.googleAdsId ?? "",
          googleAdsPurchaseLabel:
            (analyticsOverride.googleAdsPurchaseLabel as string) ??
            analyticsDefaults.googleAdsPurchaseLabel ??
            "",
          metaPixelId:
            (analyticsOverride.metaPixelId as string) ?? analyticsDefaults.metaPixelId ?? "",
        });

        const heroOverride = (data.overrides?.hero || {}) as Record<string, unknown>;
        const align = heroOverride.textAlign;
        const overlay = heroOverride.overlay;
        const gradientOverride = (heroOverride.backgroundGradient || {}) as Record<string, unknown>;
        setHero({
          enabled: (heroOverride.enabled as boolean) || false,
          headline: (heroOverride.headline as string) || "",
          subheadline: (heroOverride.subheadline as string) || "",
          imageDesktopUrl: (heroOverride.imageDesktopUrl as string) || "",
          imageMobileUrl: (heroOverride.imageMobileUrl as string) || "",
          imageAlt: (heroOverride.imageAlt as string) || "",
          ctaLabel: (heroOverride.ctaLabel as string) || "",
          ctaHref: (heroOverride.ctaHref as string) || "",
          textAlign:
            align === "left" || align === "center" || align === "right" ? align : "center",
          overlay:
            overlay === "dark" || overlay === "light" || overlay === "none" ? overlay : "dark",
          hideHeaderLogoOnHome: (heroOverride.hideHeaderLogoOnHome as boolean) || false,
          backgroundColor: (heroOverride.backgroundColor as string) || "",
          backgroundGradient: {
            from: (gradientOverride.from as string) || "",
            to: (gradientOverride.to as string) || "",
            angle:
              typeof gradientOverride.angle === "number" ? (gradientOverride.angle as number) : 135,
          },
        });

        // Load GGSA promo page settings (merged: defaults + overrides)
        const ggsaMerged = (m.ggsa || {}) as Record<string, unknown>;
        const ggsaImages = Array.isArray(ggsaMerged.productImages)
          ? (ggsaMerged.productImages as string[])
          : [];
        setGgsa({
          enabled: !!ggsaMerged.enabled,
          logoColorCrush: (ggsaMerged.logoColorCrush as string) || "",
          logoGgsa: (ggsaMerged.logoGgsa as string) || "",
          productImages: [0, 1, 2].map((i) => ggsaImages[i] || ""),
        });

        setLogoUrl((data.overrides?.logoUrl as string) || "");
        setFaviconUrl((data.overrides?.faviconUrl as string) || "");

        // Load GCS settings from overrides
        const gcsOverride = (data.overrides?.gcs || {}) as Record<string, unknown>;
        setGcs({
          projectId: (gcsOverride.projectId as string) || process.env.NEXT_PUBLIC_GCS_PROJECT_ID || "",
          bucketName: (gcsOverride.bucketName as string) || process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || "",
          serviceAccountName: gcsOverride.serviceAccount
            ? ((gcsOverride.serviceAccount as Record<string, unknown>).client_email as string) || "Service account configured"
            : "",
          hasServiceAccount: !!gcsOverride.serviceAccount,
        });

        // Load Gmail settings from overrides
        const gmailOverride = (data.overrides?.gmail || {}) as Record<string, unknown>;
        setGmail({
          clientId: (gmailOverride.clientId as string) || "",
          clientSecret: (gmailOverride.clientSecret as string) || "",
          refreshToken: (gmailOverride.refreshToken as string) || "",
          sendFrom: (gmailOverride.sendFrom as string) || "",
        });

        // Load OpenAI settings
        const openaiOverride = (data.overrides?.openai || {}) as Record<string, unknown>;
        setOpenaiKey((openaiOverride.apiKey as string) || "");
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const saveKey = async (key: string, value: unknown) => {
    setSaving(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        toast.success(`${key} updated! Changes take effect on next page load.`);
        setOverrides((prev) => ({ ...prev, [key]: value }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save setting");
    } finally {
      setSaving(null);
    }
  };

  const resetKey = async (key: string) => {
    if (!defaults) return;
    const defaultValue = defaults[key];
    if (defaultValue === undefined) return;

    switch (key) {
      case "name":
      case "tagline":
      case "description":
      case "url":
        setBrand((prev) => ({ ...prev, [key]: defaults[key] }));
        break;
      case "taxRate":
        setBusiness((prev) => ({
          ...prev,
          taxRate: String(defaults.taxRate),
        }));
        break;
      case "freeShippingThreshold":
        setBusiness((prev) => ({
          ...prev,
          freeShippingThreshold: String(defaults.freeShippingThreshold),
        }));
        break;
      case "shippingRates":
        setShipping({
          standard: String(defaults.shippingRates.standard),
          express: String(defaults.shippingRates.express),
          overnight: String(defaults.shippingRates.overnight),
        });
        break;
      case "shipping":
        if (defaults.shipping) {
          setShippoSettings({
            flatRateCents: String(defaults.shipping.flatRateCents),
            flatRateThresholdOz: String(defaults.shipping.flatRateThresholdOz),
            carriersEnabled: { ...defaults.shipping.carriersEnabled },
            origin: { ...defaults.shipping.origin },
          });
        }
        break;
      case "contact":
        setContact({ ...defaults.contact });
        break;
      case "social":
        setSocial({ ...defaults.social });
        break;
      case "features":
        setFeatures({ ...defaults.features });
        break;
    }

    await saveKey(key, defaultValue);
  };

  const uploadBrandingFile = async (
    file: File,
    settingKey: "logoUrl" | "faviconUrl",
    setUploading: (v: boolean) => void,
    setUrl: (v: string) => void
  ) => {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          pathPrefix: "branding",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      await saveKey(settingKey, publicUrl);
      setUrl(publicUrl);
    } catch {
      toast.error(`Failed to upload ${settingKey === "logoUrl" ? "logo" : "favicon"}`);
    } finally {
      setUploading(false);
    }
  };

  const uploadHeroImage = async (
    file: File,
    field: "imageDesktopUrl" | "imageMobileUrl",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          pathPrefix: "hero",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const next = { ...hero, [field]: publicUrl };
      setHero(next);
      await saveKey("hero", next);
    } catch {
      toast.error(`Failed to upload ${field === "imageDesktopUrl" ? "desktop" : "mobile"} image`);
    } finally {
      setUploading(false);
    }
  };

  // Upload a GGSA logo or product image to GCS and persist the returned URL
  // into the `ggsa` settings object. `target` is a logo field name or a
  // product-image slot index (0–2).
  const uploadGgsaImage = async (
    file: File,
    target: "logoColorCrush" | "logoGgsa" | number
  ) => {
    const slot = typeof target === "number" ? `img-${target}` : target;
    setUploadingGgsa(slot);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          pathPrefix: "ggsa",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const next =
        typeof target === "number"
          ? {
              ...ggsa,
              productImages: ggsa.productImages.map((u, i) =>
                i === target ? publicUrl : u
              ),
            }
          : { ...ggsa, [target]: publicUrl };
      setGgsa(next);
      await saveKey("ggsa", {
        enabled: next.enabled,
        logoColorCrush: next.logoColorCrush,
        logoGgsa: next.logoGgsa,
        // Keep slot positions stable; the page filters empties at render.
        productImages: next.productImages,
      });
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingGgsa(null);
    }
  };

  // Clear a GGSA logo/product image and persist the change.
  const clearGgsaImage = async (target: "logoColorCrush" | "logoGgsa" | number) => {
    const next =
      typeof target === "number"
        ? {
            ...ggsa,
            productImages: ggsa.productImages.map((u, i) =>
              i === target ? "" : u
            ),
          }
        : { ...ggsa, [target]: "" };
    setGgsa(next);
    await saveKey("ggsa", {
      enabled: next.enabled,
      logoColorCrush: next.logoColorCrush,
      logoGgsa: next.logoGgsa,
      productImages: next.productImages,
    });
  };

  const isOverridden = (key: string) => key in overrides;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
          Settings
        </h1>
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Shield className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-heading font-semibold mb-2">
            Super Admin Access Required
          </h2>
          <p className="text-brand-text-muted">
            Only super admins can view and edit site settings. Contact your
            administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Site Settings
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Edit your store configuration. Changes override{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              site.config.ts
            </code>{" "}
            defaults.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Maintenance Mode */}
        <section className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading font-semibold text-lg">
                Maintenance Mode
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isOverridden("maintenanceMode") && (
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                  Modified
                </span>
              )}
              {maintenanceMode.enabled && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                  Active
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            When enabled, all storefront pages will display a maintenance landing page. Admin access is unaffected.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Enable Maintenance Mode</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Visitors will see the maintenance page instead of the store
                </p>
              </div>
              <Switch
                checked={maintenanceMode.enabled}
                onCheckedChange={(checked) =>
                  setMaintenanceMode((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input
                value={maintenanceMode.heading}
                onChange={(e) =>
                  setMaintenanceMode((prev) => ({ ...prev, heading: e.target.value }))
                }
                placeholder="We'll Be Back Soon"
              />
            </div>
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <RichTextEditor
                value={maintenanceMode.message}
                onChange={(value) =>
                  setMaintenanceMode((prev) => ({ ...prev, message: value }))
                }
                placeholder="We're currently performing scheduled maintenance. We'll be back soon!"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Play Intro Video</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Shows an embedded YouTube video first, then transitions to the message
                </p>
              </div>
              <Switch
                checked={maintenanceMode.videoEnabled}
                onCheckedChange={(checked) =>
                  setMaintenanceMode((prev) => ({ ...prev, videoEnabled: checked }))
                }
              />
            </div>
            {maintenanceMode.videoEnabled && (
              <div className="space-y-2">
                <Label>YouTube URL or Video ID</Label>
                <Input
                  value={maintenanceMode.videoUrl}
                  onChange={(e) =>
                    setMaintenanceMode((prev) => ({ ...prev, videoUrl: e.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=... or dQw4w9WgXcQ"
                />
                <p className="text-xs text-brand-text-muted">
                  Plays muted on load (browsers require this). A mute/unmute button overlays the video.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("maintenanceMode", maintenanceMode)}
              disabled={saving !== null}
              className={
                maintenanceMode.enabled
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-brand-primary hover:bg-brand-primary-hover text-white"
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {maintenanceMode.enabled ? "Save & Activate" : "Save Maintenance Settings"}
            </Button>
            {isOverridden("maintenanceMode") && (
              <Button
                variant="outline"
                onClick={async () => {
                  const reset = { enabled: false, heading: "", message: "", videoEnabled: false, videoUrl: "" };
                  setMaintenanceMode(reset);
                  await saveKey("maintenanceMode", reset);
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* GGSA Promo Page */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Candy className="h-5 w-5 text-[#7B2D8E]" />
              <h2 className="font-heading font-semibold text-lg">GGSA Promo Page</h2>
            </div>
            <div className="flex items-center gap-3">
              {isOverridden("ggsa") && (
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                  Modified
                </span>
              )}
              {ggsa.enabled && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                  Live
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Co-branded Team Sweet Bag fundraiser page for the Gering Girls Softball
            Association at{" "}
            <a
              href="/ggsa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline inline-flex items-center gap-0.5"
            >
              /ggsa <ExternalLink className="h-3 w-3" />
            </a>
            . When disabled, the page returns a 404.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Enable GGSA Page</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Makes /ggsa publicly accessible and accepting orders
                </p>
              </div>
              <Switch
                checked={ggsa.enabled}
                onCheckedChange={(checked) =>
                  setGgsa((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
            {/* Logos */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color Crush logo</Label>
                {ggsa.logoColorCrush ? (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <Image
                      src={ggsa.logoColorCrush}
                      alt="Color Crush logo preview"
                      width={120}
                      height={64}
                      className="h-12 w-auto object-contain rounded"
                      unoptimized
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brand-error hover:text-brand-error ml-auto"
                      onClick={() => clearGgsaImage("logoColorCrush")}
                      disabled={saving !== null || uploadingGgsa !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                    <span className="text-sm text-brand-text-muted">
                      {uploadingGgsa === "logoColorCrush" ? "Uploading..." : "Upload logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingGgsa !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadGgsaImage(file, "logoColorCrush");
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <Label>GGSA logo</Label>
                {ggsa.logoGgsa ? (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <Image
                      src={ggsa.logoGgsa}
                      alt="GGSA logo preview"
                      width={120}
                      height={64}
                      className="h-12 w-auto object-contain rounded"
                      unoptimized
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brand-error hover:text-brand-error ml-auto"
                      onClick={() => clearGgsaImage("logoGgsa")}
                      disabled={saving !== null || uploadingGgsa !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                    <span className="text-sm text-brand-text-muted">
                      {uploadingGgsa === "logoGgsa" ? "Uploading..." : "Upload logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingGgsa !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadGgsaImage(file, "logoGgsa");
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product images */}
            <div className="space-y-2">
              <Label>Product images (up to 3)</Label>
              <p className="text-xs text-brand-text-muted">
                The first image is shown large on the page; the rest as thumbnails.
                JPG, PNG, or WebP.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => {
                  const img = ggsa.productImages[i] || "";
                  return (
                    <div key={i} className="space-y-1">
                      {img ? (
                        <div className="relative">
                          <Image
                            src={img}
                            alt={`Team Sweet Bag photo ${i + 1}`}
                            width={120}
                            height={120}
                            className="aspect-square w-full object-cover rounded-lg border border-gray-200"
                            unoptimized
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 bg-white/90 hover:bg-white text-brand-error hover:text-brand-error shadow"
                            onClick={() => clearGgsaImage(i)}
                            disabled={saving !== null || uploadingGgsa !== null}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                          <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                          <span className="text-[11px] text-brand-text-muted px-1">
                            {uploadingGgsa === `img-${i}` ? "Uploading..." : `Photo ${i + 1}`}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingGgsa !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadGgsaImage(file, i);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() =>
                saveKey("ggsa", {
                  enabled: ggsa.enabled,
                  logoColorCrush: ggsa.logoColorCrush,
                  logoGgsa: ggsa.logoGgsa,
                  productImages: ggsa.productImages,
                })
              }
              disabled={saving !== null}
              className={
                ggsa.enabled
                  ? "bg-[#7B2D8E] hover:bg-[#6A2479] text-white"
                  : "bg-brand-primary hover:bg-brand-primary-hover text-white"
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {ggsa.enabled ? "Save & Publish" : "Save GGSA Settings"}
            </Button>
            {isOverridden("ggsa") && (
              <Button
                variant="outline"
                onClick={async () => {
                  const reset = {
                    enabled: false,
                    logoColorCrush: "",
                    logoGgsa: "",
                    productImages: ["", "", ""],
                  };
                  setGgsa(reset);
                  await saveKey("ggsa", {
                    enabled: false,
                    logoColorCrush: "",
                    logoGgsa: "",
                    productImages: [],
                  });
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* Announcement Bar */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-brand-primary" />
              <h2 className="font-heading font-semibold text-lg">Announcement Bar</h2>
            </div>
            {isOverridden("announcementBar") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            The thin bar at the very top of every storefront page. Use{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">{"{freeShippingThreshold}"}</code> to insert the
            current free-shipping threshold.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Show Announcement Bar</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Hide the bar across the whole storefront
                </p>
              </div>
              <Switch
                checked={announcementBar.enabled}
                onCheckedChange={(checked) =>
                  setAnnouncementBar((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Text</Label>
              <Input
                value={announcementBar.text}
                onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="Free shipping on orders over ${freeShippingThreshold}!"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("announcementBar", announcementBar)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Announcement Bar
            </Button>
            {isOverridden("announcementBar") && (
              <Button
                variant="outline"
                onClick={async () => {
                  const reset = { enabled: true, text: "" };
                  setAnnouncementBar(reset);
                  await saveKey("announcementBar", reset);
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* Analytics / Ad pixels */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">
              Analytics & Ad Pixels
            </h2>
            {isOverridden("analytics") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Customized
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Conversion tracking IDs. Leave blank to disable that pixel. Inbound
            <code className="bg-gray-100 px-1 mx-1 rounded text-xs">gclid</code>/
            <code className="bg-gray-100 px-1 mx-1 rounded text-xs">fbclid</code> /
            <code className="bg-gray-100 px-1 mx-1 rounded text-xs">utm_*</code>{" "}
            params are captured automatically regardless of these settings.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Google Ads Tag ID</Label>
              <Input
                placeholder="AW-1234567890"
                value={analytics.googleAdsId}
                onChange={(e) =>
                  setAnalytics((prev) => ({ ...prev, googleAdsId: e.target.value }))
                }
              />
              <p className="text-xs text-brand-text-muted">
                Found in Google Ads → Tools → Conversions → Tag setup. Starts with{" "}
                <code>AW-</code>.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Google Ads Purchase Conversion Label</Label>
              <Input
                placeholder="abc123XYZ_456"
                value={analytics.googleAdsPurchaseLabel}
                onChange={(e) =>
                  setAnalytics((prev) => ({
                    ...prev,
                    googleAdsPurchaseLabel: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-brand-text-muted">
                The label portion only — not the full <code>send_to</code>. Required
                for purchase events to fire.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Meta Pixel ID</Label>
              <Input
                placeholder="1234567890123456"
                value={analytics.metaPixelId}
                onChange={(e) =>
                  setAnalytics((prev) => ({ ...prev, metaPixelId: e.target.value }))
                }
              />
              <p className="text-xs text-brand-text-muted">
                Numeric ID from Meta Events Manager. PageView + Purchase events
                fire automatically.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("analytics", analytics)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Analytics
            </Button>
            {isOverridden("analytics") && (
              <Button
                variant="outline"
                onClick={async () => {
                  const reset = {
                    googleAdsId: "",
                    googleAdsPurchaseLabel: "",
                    metaPixelId: "",
                  };
                  setAnalytics(reset);
                  await saveKey("analytics", reset);
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* Home Page Hero */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-primary" />
              <h2 className="font-heading font-semibold text-lg">Home Page Hero</h2>
            </div>
            {isOverridden("hero") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Replaces the default hero on the home page with a configurable image, headline, and CTA.
            When disabled, the original gradient hero is shown.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Enable hero section</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Turn on to show the configured hero on the storefront home page
                </p>
              </div>
              <Switch
                checked={hero.enabled}
                onCheckedChange={(checked) => setHero((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Desktop image */}
              <div className="space-y-2">
                <Label>Desktop image</Label>
                <p className="text-xs text-brand-text-muted">
                  Recommended: <strong>1920 × 600 px</strong> (16:5 banner ratio), JPG or WebP, under 400&nbsp;KB. Hero height auto-caps at ~520&nbsp;px so taller uploads still display fully — they just letterbox on wide screens.
                </p>
                <div className="flex items-center gap-4">
                  {hero.imageDesktopUrl ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 flex-1">
                      <Image
                        src={hero.imageDesktopUrl}
                        alt="Hero desktop preview"
                        width={160}
                        height={67}
                        className="h-16 w-auto object-cover rounded"
                        unoptimized
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-brand-error hover:text-brand-error ml-auto"
                        onClick={async () => {
                          const next = { ...hero, imageDesktopUrl: "" };
                          setHero(next);
                          await saveKey("hero", next);
                        }}
                        disabled={saving !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 flex-1 hover:bg-gray-100 transition-colors">
                      <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                      <span className="text-sm text-brand-text-muted">
                        {uploadingHeroDesktop ? "Uploading..." : "Upload desktop image"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingHeroDesktop}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadHeroImage(file, "imageDesktopUrl", setUploadingHeroDesktop);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Mobile image */}
              <div className="space-y-2">
                <Label>Mobile image</Label>
                <p className="text-xs text-brand-text-muted">
                  Recommended: <strong>750 × 1000 px</strong> (3:4 portrait), JPG or WebP, under 200&nbsp;KB. Falls back to desktop image if not set.
                </p>
                <div className="flex items-center gap-4">
                  {hero.imageMobileUrl ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 flex-1">
                      <Image
                        src={hero.imageMobileUrl}
                        alt="Hero mobile preview"
                        width={60}
                        height={80}
                        className="h-16 w-auto object-cover rounded"
                        unoptimized
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-brand-error hover:text-brand-error ml-auto"
                        onClick={async () => {
                          const next = { ...hero, imageMobileUrl: "" };
                          setHero(next);
                          await saveKey("hero", next);
                        }}
                        disabled={saving !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 flex-1 hover:bg-gray-100 transition-colors">
                      <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                      <span className="text-sm text-brand-text-muted">
                        {uploadingHeroMobile ? "Uploading..." : "Upload mobile image"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingHeroMobile}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadHeroImage(file, "imageMobileUrl", setUploadingHeroMobile);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image alt text</Label>
              <p className="text-xs text-brand-text-muted">
                Describes the image for screen readers and when images fail to load.
              </p>
              <Input
                value={hero.imageAlt}
                onChange={(e) => setHero((prev) => ({ ...prev, imageAlt: e.target.value }))}
                placeholder="A spread of handcrafted candy and chocolates"
              />
            </div>

            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={hero.headline}
                onChange={(e) => setHero((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="Handcrafted Candy, Chocolate & Gift Boxes"
              />
            </div>

            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={hero.subheadline}
                onChange={(e) => setHero((prev) => ({ ...prev, subheadline: e.target.value }))}
                placeholder="Handcrafted Sweetness, Delivered to Your Door."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button label</Label>
                <Input
                  value={hero.ctaLabel}
                  onChange={(e) => setHero((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  placeholder="Shop All Candy"
                />
              </div>
              <div className="space-y-2">
                <Label>Button link</Label>
                <Input
                  value={hero.ctaHref}
                  onChange={(e) => setHero((prev) => ({ ...prev, ctaHref: e.target.value }))}
                  placeholder="/products"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text alignment</Label>
              <select
                value={hero.textAlign}
                onChange={(e) =>
                  setHero((prev) => ({
                    ...prev,
                    textAlign: e.target.value as "left" | "center" | "right",
                  }))
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Darken image for text readability</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Adds a dark overlay so light text stays legible. Turn off to show the image untouched.
                </p>
              </div>
              <Switch
                checked={hero.overlay === "dark"}
                onCheckedChange={(checked) =>
                  setHero((prev) => ({ ...prev, overlay: checked ? "dark" : "none" }))
                }
              />
            </div>

            {/* Background behind the hero image (visible in pillar boxes on viewports wider
                than 1440px, or behind transparent regions of the hero image). */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Background behind hero image</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Shown beside the 1440&times;900 hero on wider screens. Pick a solid color or a two-stop gradient.
                </p>
              </div>
              {(() => {
                const bgMode: "none" | "color" | "gradient" =
                  hero.backgroundGradient.from && hero.backgroundGradient.to
                    ? "gradient"
                    : hero.backgroundColor
                      ? "color"
                      : "none";
                return (
                  <>
                    <select
                      value={bgMode}
                      onChange={(e) => {
                        const next = e.target.value as "none" | "color" | "gradient";
                        if (next === "none") {
                          setHero((prev) => ({
                            ...prev,
                            backgroundColor: "",
                            backgroundGradient: { from: "", to: "", angle: 135 },
                          }));
                        } else if (next === "color") {
                          setHero((prev) => ({
                            ...prev,
                            backgroundColor: prev.backgroundColor || "#fce4ec",
                            backgroundGradient: { from: "", to: "", angle: 135 },
                          }));
                        } else {
                          setHero((prev) => ({
                            ...prev,
                            backgroundColor: "",
                            backgroundGradient: {
                              from: prev.backgroundGradient.from || "#fce4ec",
                              to: prev.backgroundGradient.to || "#fff5e6",
                              angle: prev.backgroundGradient.angle || 135,
                            },
                          }));
                        }
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="none">Default (brand pink tint)</option>
                      <option value="color">Solid color</option>
                      <option value="gradient">Gradient</option>
                    </select>

                    {bgMode === "color" && (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={hero.backgroundColor || "#fce4ec"}
                          onChange={(e) =>
                            setHero((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="h-10 w-14 rounded-md border border-input cursor-pointer"
                        />
                        <Input
                          value={hero.backgroundColor}
                          onChange={(e) =>
                            setHero((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          placeholder="#fce4ec"
                          className="flex-1"
                        />
                      </div>
                    )}

                    {bgMode === "gradient" && (
                      <div className="space-y-3">
                        <div
                          className="h-12 w-full rounded-md border border-input"
                          style={{
                            background: `linear-gradient(${hero.backgroundGradient.angle}deg, ${hero.backgroundGradient.from || "#fce4ec"}, ${hero.backgroundGradient.to || "#fff5e6"})`,
                          }}
                          aria-hidden="true"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">From</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={hero.backgroundGradient.from || "#fce4ec"}
                                onChange={(e) =>
                                  setHero((prev) => ({
                                    ...prev,
                                    backgroundGradient: {
                                      ...prev.backgroundGradient,
                                      from: e.target.value,
                                    },
                                  }))
                                }
                                className="h-10 w-14 rounded-md border border-input cursor-pointer"
                              />
                              <Input
                                value={hero.backgroundGradient.from}
                                onChange={(e) =>
                                  setHero((prev) => ({
                                    ...prev,
                                    backgroundGradient: {
                                      ...prev.backgroundGradient,
                                      from: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="#fce4ec"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">To</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={hero.backgroundGradient.to || "#fff5e6"}
                                onChange={(e) =>
                                  setHero((prev) => ({
                                    ...prev,
                                    backgroundGradient: {
                                      ...prev.backgroundGradient,
                                      to: e.target.value,
                                    },
                                  }))
                                }
                                className="h-10 w-14 rounded-md border border-input cursor-pointer"
                              />
                              <Input
                                value={hero.backgroundGradient.to}
                                onChange={(e) =>
                                  setHero((prev) => ({
                                    ...prev,
                                    backgroundGradient: {
                                      ...prev.backgroundGradient,
                                      to: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="#fff5e6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Angle: {hero.backgroundGradient.angle}&deg;
                          </Label>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            step={5}
                            value={hero.backgroundGradient.angle}
                            onChange={(e) =>
                              setHero((prev) => ({
                                ...prev,
                                backgroundGradient: {
                                  ...prev.backgroundGradient,
                                  angle: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Hide header logo on home page</Label>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Turn on if your hero image already includes the logo. Other pages still show the header logo normally.
                </p>
              </div>
              <Switch
                checked={hero.hideHeaderLogoOnHome}
                onCheckedChange={(checked) =>
                  setHero((prev) => ({ ...prev, hideHeaderLogoOnHome: checked }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("hero", hero)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Hero
            </Button>
            {isOverridden("hero") && (
              <Button
                variant="outline"
                onClick={async () => {
                  const reset = {
                    enabled: false,
                    headline: "",
                    subheadline: "",
                    imageDesktopUrl: "",
                    imageMobileUrl: "",
                    imageAlt: "",
                    ctaLabel: "",
                    ctaHref: "",
                    textAlign: "center" as const,
                    overlay: "dark" as const,
                    hideHeaderLogoOnHome: false,
                    backgroundColor: "",
                    backgroundGradient: { from: "", to: "", angle: 135 },
                  };
                  setHero(reset);
                  await saveKey("hero", reset);
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* Brand */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Brand</h2>
            {(isOverridden("name") ||
              isOverridden("tagline") ||
              isOverridden("description") ||
              isOverridden("url")) && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={brand.tagline}
                onChange={(e) =>
                  setBrand({ ...brand, tagline: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={brand.description}
                onChange={(e) =>
                  setBrand({ ...brand, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Site URL</Label>
              <Input
                value={brand.url}
                onChange={(e) => setBrand({ ...brand, url: e.target.value })}
              />
            </div>
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <p className="text-xs text-brand-text-muted">
                Replaces the site name text across all pages. Recommended: SVG or PNG with transparent background.
              </p>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 flex-1">
                    <Image
                      src={logoUrl}
                      alt="Logo preview"
                      width={120}
                      height={40}
                      className="h-10 w-auto object-contain"
                      unoptimized
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brand-error hover:text-brand-error ml-auto"
                      onClick={async () => {
                        await saveKey("logoUrl", "");
                        setLogoUrl("");
                      }}
                      disabled={saving !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 flex-1 hover:bg-gray-100 transition-colors">
                    <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                    <span className="text-sm text-brand-text-muted">
                      {uploadingLogo ? "Uploading..." : "Upload logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/svg+xml,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBrandingFile(file, "logoUrl", setUploadingLogo, setLogoUrl);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>Favicon</Label>
              <p className="text-xs text-brand-text-muted">
                Browser tab icon. Recommended: 32x32 or 64x64 PNG, ICO, or SVG.
              </p>
              <div className="flex items-center gap-4">
                {faviconUrl ? (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 flex-1">
                    <Image
                      src={faviconUrl}
                      alt="Favicon preview"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                    <span className="text-sm text-brand-text-secondary truncate flex-1">Favicon configured</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brand-error hover:text-brand-error ml-auto"
                      onClick={async () => {
                        await saveKey("faviconUrl", "");
                        setFaviconUrl("");
                      }}
                      disabled={saving !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3 flex-1 hover:bg-gray-100 transition-colors">
                    <ImageIcon className="h-5 w-5 text-brand-text-muted" />
                    <span className="text-sm text-brand-text-muted">
                      {uploadingFavicon ? "Uploading..." : "Upload favicon"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon"
                      className="hidden"
                      disabled={uploadingFavicon}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBrandingFile(file, "faviconUrl", setUploadingFavicon, setFaviconUrl);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await saveKey("name", brand.name);
                  await saveKey("tagline", brand.tagline);
                  await saveKey("description", brand.description);
                  await saveKey("url", brand.url);
                }}
                disabled={saving !== null}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Brand
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await resetKey("name");
                  await resetKey("tagline");
                  await resetKey("description");
                  await resetKey("url");
                }}
                disabled={saving !== null}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </section>

        {/* Business */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">
              Business Settings
            </h2>
            {(isOverridden("taxRate") ||
              isOverridden("freeShippingThreshold")) && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate (decimal, e.g. 0.08 = 8%)</Label>
              <Input
                type="number"
                step="0.01"
                value={business.taxRate}
                onChange={(e) =>
                  setBusiness({ ...business, taxRate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Free Shipping Threshold ($)</Label>
              <Input
                type="number"
                step="1"
                value={business.freeShippingThreshold}
                onChange={(e) =>
                  setBusiness({
                    ...business,
                    freeShippingThreshold: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={async () => {
                const taxRate = parseFloat(business.taxRate);
                if (!Number.isFinite(taxRate)) {
                  toast.error("Tax rate must be a number");
                  return;
                }
                // Empty / non-numeric threshold means "no free shipping" — store
                // a sentinel large number so the `subtotal >= threshold` check
                // in the storefront never trips.
                const rawThreshold = business.freeShippingThreshold.trim();
                const parsedThreshold = parseFloat(rawThreshold);
                const threshold =
                  rawThreshold === "" || !Number.isFinite(parsedThreshold)
                    ? Number.MAX_SAFE_INTEGER
                    : parsedThreshold;
                await saveKey("taxRate", taxRate);
                await saveKey("freeShippingThreshold", threshold);
              }}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Business Settings
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await resetKey("taxRate");
                await resetKey("freeShippingThreshold");
              }}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* Shipping Rates */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">
              Shipping Rates
            </h2>
            {isOverridden("shippingRates") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Standard ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={shipping.standard}
                onChange={(e) =>
                  setShipping({ ...shipping, standard: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Express ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={shipping.express}
                onChange={(e) =>
                  setShipping({ ...shipping, express: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Overnight ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={shipping.overnight}
                onChange={(e) =>
                  setShipping({ ...shipping, overnight: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() =>
                saveKey("shippingRates", {
                  standard: parseFloat(shipping.standard),
                  express: parseFloat(shipping.express),
                  overnight: parseFloat(shipping.overnight),
                })
              }
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Shipping
            </Button>
            <Button
              variant="outline"
              onClick={() => resetKey("shippingRates")}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* Shipping (Shippo) */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Shipping (Shippo)</h2>
            {isOverridden("shipping") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Live carrier rates and flat-rate fallback. The Shippo API key and test-mode flag stay in
            environment variables — they are never read from the database.
          </p>

          {/* Flat-rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Flat-rate threshold (oz)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={shippoSettings.flatRateThresholdOz}
                onChange={(e) =>
                  setShippoSettings({ ...shippoSettings, flatRateThresholdOz: e.target.value })
                }
              />
              <p className="text-xs text-brand-text-muted">
                Carts at or below this weight skip the carrier API and use the flat rate.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Flat-rate price ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={(parseInt(shippoSettings.flatRateCents || "0", 10) / 100).toFixed(2)}
                onChange={(e) =>
                  setShippoSettings({
                    ...shippoSettings,
                    flatRateCents: String(Math.round((parseFloat(e.target.value) || 0) * 100)),
                  })
                }
              />
            </div>
          </div>

          {/* Carriers */}
          <div className="mb-6">
            <Label className="mb-3 block">Carriers shown for live rates</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["usps", "ups", "fedex"] as const).map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="text-sm font-medium uppercase">{key}</span>
                  <Switch
                    checked={shippoSettings.carriersEnabled[key]}
                    onCheckedChange={(checked) =>
                      setShippoSettings({
                        ...shippoSettings,
                        carriersEnabled: {
                          ...shippoSettings.carriersEnabled,
                          [key]: checked,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Origin address */}
          <div>
            <Label className="mb-3 block">Origin (ship-from address)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Business name</Label>
                <Input
                  value={shippoSettings.origin.name}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Street address</Label>
                <Input
                  value={shippoSettings.origin.street1}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, street1: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Suite / unit (optional)</Label>
                <Input
                  value={shippoSettings.origin.street2}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, street2: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={shippoSettings.origin.city}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  maxLength={2}
                  value={shippoSettings.origin.state}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: {
                        ...shippoSettings.origin,
                        state: e.target.value.toUpperCase(),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input
                  value={shippoSettings.origin.zip}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, zip: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={shippoSettings.origin.country}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, country: e.target.value.toUpperCase() },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={shippoSettings.origin.phone}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, phone: e.target.value },
                    })
                  }
                  placeholder="Required for some carriers (e.g. FedEx)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={shippoSettings.origin.email}
                  onChange={(e) =>
                    setShippoSettings({
                      ...shippoSettings,
                      origin: { ...shippoSettings.origin, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() =>
                saveKey("shipping", {
                  flatRateCents: parseInt(shippoSettings.flatRateCents, 10) || 0,
                  flatRateThresholdOz: parseInt(shippoSettings.flatRateThresholdOz, 10) || 0,
                  carriersEnabled: shippoSettings.carriersEnabled,
                  origin: shippoSettings.origin,
                })
              }
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Shipping
            </Button>
            <Button
              variant="outline"
              onClick={() => resetKey("shipping")}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* Shipping Boxes */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Shipping Boxes</h2>
          </div>
          <ShippingBoxesManager />
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">
              Contact Information
            </h2>
            {isOverridden("contact") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={contact.address}
                onChange={(e) =>
                  setContact({ ...contact, address: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("contact", contact)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Contact
            </Button>
            <Button
              variant="outline"
              onClick={() => resetKey("contact")}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Social Media</h2>
            {isOverridden("social") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={social.instagram}
                onChange={(e) =>
                  setSocial({ ...social, instagram: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={social.facebook}
                onChange={(e) =>
                  setSocial({ ...social, facebook: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input
                value={social.tiktok}
                onChange={(e) =>
                  setSocial({ ...social, tiktok: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X</Label>
              <Input
                value={social.twitter}
                onChange={(e) =>
                  setSocial({ ...social, twitter: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("social", social)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Social
            </Button>
            <Button
              variant="outline"
              onClick={() => resetKey("social")}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* OpenAI Integration */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">OpenAI Integration</h2>
            {isOverridden("openai") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">Configured</span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Powers AI-generated product descriptions on the add/edit product pages. Uses GPT-4o-mini.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={openaiShowKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenaiShowKey(!openaiShowKey)}
                >
                  {openaiShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await saveKey("openai", { apiKey: openaiKey });
                }}
                disabled={saving !== null}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                disabled={openaiTestLoading || !openaiKey}
                onClick={async () => {
                  setOpenaiTestLoading(true);
                  setOpenaiTestResult(null);
                  // Save first so the test uses the latest key
                  await saveKey("openai", { apiKey: openaiKey });
                  try {
                    const res = await fetch("/api/settings/openai-test", { method: "POST" });
                    setOpenaiTestResult(await res.json());
                  } catch {
                    setOpenaiTestResult({ success: false, error: "Request failed" });
                  } finally {
                    setOpenaiTestLoading(false);
                  }
                }}
              >
                {openaiTestLoading ? "Testing..." : "Test Connection"}
              </Button>
            </div>
            {openaiTestResult && (
              <div className={`flex items-center gap-2 text-sm ${openaiTestResult.success ? "text-green-600" : "text-red-600"}`}>
                {openaiTestResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {openaiTestResult.success ? "Connected successfully" : openaiTestResult.error}
              </div>
            )}
          </div>
        </section>

        {/* Feature Flags */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">
              Feature Flags
            </h2>
            {isOverridden("features") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="space-y-4">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  {key === "customerDeletion" && (
                    <p className="text-xs text-red-700 mt-1">
                      ⚠️ Dev only. When on, admins can permanently delete customers and all their
                      orders. No audit trail, no recovery.
                    </p>
                  )}
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) =>
                    setFeatures((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => saveKey("features", features)}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Features
            </Button>
            <Button
              variant="outline"
              onClick={() => resetKey("features")}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </section>

        {/* Google Cloud Storage */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-brand-text-muted" />
              <h2 className="font-heading font-semibold text-lg">
                Google Cloud Storage
              </h2>
            </div>
            {isOverridden("gcs") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Configure GCS for product image storage. Upload a service account
            JSON key file to authenticate.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input
                  value={gcs.projectId}
                  onChange={(e) =>
                    setGcs({ ...gcs, projectId: e.target.value })
                  }
                  placeholder="my-gcp-project"
                />
              </div>
              <div className="space-y-2">
                <Label>Bucket Name</Label>
                <Input
                  value={gcs.bucketName}
                  onChange={(e) =>
                    setGcs({ ...gcs, bucketName: e.target.value })
                  }
                  placeholder="sweethaven-images"
                />
              </div>
            </div>

            {/* Service Account Upload */}
            <div className="space-y-2">
              <Label>Service Account Key (JSON)</Label>
              {gcs.hasServiceAccount ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">
                      Service account configured
                    </p>
                    <p className="text-xs text-green-600 truncate">
                      {gcs.serviceAccountName}
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-brand-primary hover:underline">
                      Replace
                    </span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          const json = JSON.parse(text);
                          if (!json.client_email || !json.private_key) {
                            toast.error(
                              "Invalid service account JSON: missing client_email or private_key"
                            );
                            return;
                          }
                          await saveKey("gcs", {
                            projectId:
                              gcs.projectId || json.project_id || "",
                            bucketName: gcs.bucketName,
                            serviceAccount: json,
                          });
                          setGcs({
                            ...gcs,
                            projectId:
                              gcs.projectId || json.project_id || "",
                            serviceAccountName: json.client_email,
                            hasServiceAccount: true,
                          });
                        } catch {
                          toast.error(
                            "Failed to parse JSON file"
                          );
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-colors">
                  <Upload className="h-8 w-8 text-brand-text-muted mb-2" />
                  <span className="text-sm text-brand-text-muted">
                    Click to upload service account JSON
                  </span>
                  <span className="text-xs text-brand-text-muted mt-1">
                    .json file from Google Cloud Console
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const json = JSON.parse(text);
                        if (!json.client_email || !json.private_key) {
                          toast.error(
                            "Invalid service account JSON: missing client_email or private_key"
                          );
                          return;
                        }
                        await saveKey("gcs", {
                          projectId:
                            gcs.projectId || json.project_id || "",
                          bucketName: gcs.bucketName,
                          serviceAccount: json,
                        });
                        setGcs({
                          ...gcs,
                          projectId:
                            gcs.projectId || json.project_id || "",
                          serviceAccountName: json.client_email,
                          hasServiceAccount: true,
                        });
                      } catch {
                        toast.error("Failed to parse JSON file");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {/* Test Connection */}
            {gcsTestResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  gcsTestResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {gcsTestResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`text-sm ${
                    gcsTestResult.success
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {gcsTestResult.success
                    ? "Connection successful! Bucket is accessible."
                    : `Connection failed: ${gcsTestResult.error}`}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  // Save project/bucket (without overwriting service account)
                  const currentOverrides =
                    (overrides.gcs as Record<string, unknown>) || {};
                  await saveKey("gcs", {
                    ...currentOverrides,
                    projectId: gcs.projectId,
                    bucketName: gcs.bucketName,
                  });
                }}
                disabled={saving !== null}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save GCS Settings
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setGcsTestLoading(true);
                  setGcsTestResult(null);
                  try {
                    const res = await fetch("/api/settings/gcs-test", {
                      method: "POST",
                    });
                    const result = await res.json();
                    setGcsTestResult(result);
                  } catch {
                    setGcsTestResult({
                      success: false,
                      error: "Request failed",
                    });
                  } finally {
                    setGcsTestLoading(false);
                  }
                }}
                disabled={gcsTestLoading || saving !== null}
              >
                {gcsTestLoading ? "Testing..." : "Test Connection"}
              </Button>
              {isOverridden("gcs") && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await saveKey("gcs", {
                      projectId: "",
                      bucketName: "",
                      serviceAccount: null,
                    });
                    setGcs({
                      projectId: "",
                      bucketName: "",
                      serviceAccountName: "",
                      hasServiceAccount: false,
                    });
                    setGcsTestResult(null);
                  }}
                  disabled={saving !== null}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Gmail API */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-text-muted" />
              <h2 className="font-heading font-semibold text-lg">
                Gmail API
              </h2>
            </div>
            {isOverridden("gmail") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Configure Gmail OAuth2 credentials for transactional emails (order confirmations, shipping notifications, etc.).
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send From Email</Label>
              <Input
                value={gmail.sendFrom}
                onChange={(e) =>
                  setGmail({ ...gmail, sendFrom: e.target.value })
                }
                placeholder="hello@sweethaven.com"
              />
            </div>
            <div className="space-y-2">
              <Label>OAuth2 Client ID</Label>
              <Input
                value={gmail.clientId}
                onChange={(e) =>
                  setGmail({ ...gmail, clientId: e.target.value })
                }
                placeholder="123456789-abc.apps.googleusercontent.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>OAuth2 Client Secret</Label>
                <button
                  type="button"
                  onClick={() => setGmailShowSecrets(!gmailShowSecrets)}
                  className="text-xs text-brand-text-muted hover:text-brand-text flex items-center gap-1"
                >
                  {gmailShowSecrets ? (
                    <><EyeOff className="h-3 w-3" /> Hide</>
                  ) : (
                    <><Eye className="h-3 w-3" /> Show</>
                  )}
                </button>
              </div>
              <Input
                type={gmailShowSecrets ? "text" : "password"}
                value={gmail.clientSecret}
                onChange={(e) =>
                  setGmail({ ...gmail, clientSecret: e.target.value })
                }
                placeholder="GOCSPX-..."
              />
            </div>
            <div className="space-y-2">
              <Label>OAuth2 Refresh Token</Label>
              <Input
                type={gmailShowSecrets ? "text" : "password"}
                value={gmail.refreshToken}
                onChange={(e) =>
                  setGmail({ ...gmail, refreshToken: e.target.value })
                }
                placeholder="1//0abc..."
              />
            </div>

            {/* Test Result */}
            {gmailTestResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  gmailTestResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {gmailTestResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    gmailTestResult.success
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {gmailTestResult.success
                    ? `Connected as ${gmailTestResult.email}`
                    : `Connection failed: ${gmailTestResult.error}`}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => saveKey("gmail", gmail)}
                disabled={saving !== null}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Gmail Settings
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setGmailTestLoading(true);
                  setGmailTestResult(null);
                  try {
                    const res = await fetch("/api/settings/gmail-test", {
                      method: "POST",
                    });
                    const result = await res.json();
                    setGmailTestResult(result);
                  } catch {
                    setGmailTestResult({
                      success: false,
                      error: "Request failed",
                    });
                  } finally {
                    setGmailTestLoading(false);
                  }
                }}
                disabled={gmailTestLoading || saving !== null}
              >
                {gmailTestLoading ? "Testing..." : "Test Connection"}
              </Button>
              {isOverridden("gmail") && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await saveKey("gmail", {
                      clientId: "",
                      clientSecret: "",
                      refreshToken: "",
                      sendFrom: "",
                    });
                    setGmail({
                      clientId: "",
                      clientSecret: "",
                      refreshToken: "",
                      sendFrom: "",
                    });
                    setGmailTestResult(null);
                  }}
                  disabled={saving !== null}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Theme Colors (editable) */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Theme Colors</h2>
            {isOverridden("colors") && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">
                Modified
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Click any swatch to pick a new color. Changes apply to all public pages after saving.
          </p>
          {(() => {
            const swatches: { key: string; label: string; value: string; onChange: (v: string) => void }[] = [
              { key: "primary", label: "Primary", value: colors.primary, onChange: (v) => setColors((p) => ({ ...p, primary: v })) },
              { key: "primaryHover", label: "Primary Hover", value: colors.primaryHover, onChange: (v) => setColors((p) => ({ ...p, primaryHover: v })) },
              { key: "secondary", label: "Secondary", value: colors.secondary, onChange: (v) => setColors((p) => ({ ...p, secondary: v })) },
              { key: "accent.pink", label: "Pink", value: colors.accent.pink, onChange: (v) => setColors((p) => ({ ...p, accent: { ...p.accent, pink: v } })) },
              { key: "accent.mint", label: "Mint", value: colors.accent.mint, onChange: (v) => setColors((p) => ({ ...p, accent: { ...p.accent, mint: v } })) },
              { key: "accent.lavender", label: "Lavender", value: colors.accent.lavender, onChange: (v) => setColors((p) => ({ ...p, accent: { ...p.accent, lavender: v } })) },
              { key: "accent.peach", label: "Peach", value: colors.accent.peach, onChange: (v) => setColors((p) => ({ ...p, accent: { ...p.accent, peach: v } })) },
              { key: "accent.sky", label: "Sky", value: colors.accent.sky, onChange: (v) => setColors((p) => ({ ...p, accent: { ...p.accent, sky: v } })) },
              { key: "background", label: "Background", value: colors.background, onChange: (v) => setColors((p) => ({ ...p, background: v })) },
              { key: "surface", label: "Surface", value: colors.surface, onChange: (v) => setColors((p) => ({ ...p, surface: v })) },
              { key: "success", label: "Success", value: colors.success, onChange: (v) => setColors((p) => ({ ...p, success: v })) },
              { key: "warning", label: "Warning", value: colors.warning, onChange: (v) => setColors((p) => ({ ...p, warning: v })) },
              { key: "error", label: "Error", value: colors.error, onChange: (v) => setColors((p) => ({ ...p, error: v })) },
            ];
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {swatches.map((s) => (
                  <div key={s.key} className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50">
                    <label className="relative cursor-pointer" title="Click to change">
                      <span
                        className="block w-10 h-10 rounded-md shadow-sm border"
                        style={{ backgroundColor: s.value || "#FFFFFF" }}
                      />
                      <input
                        type="color"
                        value={s.value || "#000000"}
                        onChange={(e) => {
                          s.onChange(e.target.value);
                          setPickerKey(s.key);
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.label}</p>
                      <Input
                        value={s.value}
                        onChange={(e) => s.onChange(e.target.value)}
                        className="h-7 text-xs font-mono px-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={async () => {
                await saveKey("colors", colors);
                toast.success("Theme colors updated! Reload the storefront to see the change.");
              }}
              disabled={saving !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Theme Colors
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!defaults) return;
                const reset = {
                  primary: defaults.colors.primary,
                  primaryHover: defaults.colors.primaryHover,
                  secondary: defaults.colors.secondary,
                  accent: { ...defaults.colors.accent },
                  background: defaults.colors.background,
                  surface: defaults.colors.surface,
                  success: defaults.colors.success,
                  warning: defaults.colors.warning,
                  error: defaults.colors.error,
                };
                setColors(reset);
                await saveKey("colors", reset);
                toast.success("Theme colors reset to defaults.");
              }}
              disabled={saving !== null}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
          {pickerKey && (
            <p className="text-xs text-brand-text-muted mt-2">
              Preview updated. Click <strong>Save Theme Colors</strong> to apply on the storefront.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
