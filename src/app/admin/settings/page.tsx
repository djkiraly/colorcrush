"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, RotateCcw, Shield, Upload, CheckCircle, XCircle, Cloud, Mail, Eye, EyeOff, ImageIcon, Trash2, Construction, Megaphone } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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
                await saveKey("taxRate", parseFloat(business.taxRate));
                await saveKey(
                  "freeShippingThreshold",
                  parseFloat(business.freeShippingThreshold)
                );
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
              <div key={key} className="flex items-center justify-between">
                <Label className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
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
