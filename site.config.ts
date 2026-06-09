export const siteConfig = {
  // ═══ BRAND (edit to rebrand) ═══
  name: "Sweet Haven",
  tagline: "Handcrafted Sweetness, Delivered to Your Door.",
  description:
    "Premium handcrafted candies, chocolates, and gift boxes. Order online for delivery or pickup.",
  url: "https://sweethaven.com",
  logo: "/images/logo.svg",
  favicon: "/images/favicon.ico",

  // ═══ THEME COLORS ═══
  colors: {
    primary: "#F43F5E",
    primaryHover: "#E11D48",
    secondary: "#581C87",
    accent: {
      pink: "#F9A8D4",
      mint: "#A7F3D0",
      lavender: "#C4B5FD",
      peach: "#FDBA74",
      sky: "#7DD3FC",
    },
    background: "#FAFAFA",
    surface: "#FFFFFF",
    text: { primary: "#1E1B2E", secondary: "#6B7280", muted: "#9CA3AF" },
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },

  // ═══ TYPOGRAPHY ═══
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },

  // ═══ BUSINESS ═══
  currency: "USD",
  locale: "en-US",
  taxRate: 0.08,
  // Disabled — Shippo provides live rates per shipment. The sentinel makes any
  // `subtotal >= threshold` check fail so "free shipping" UI never triggers.
  freeShippingThreshold: Number.MAX_SAFE_INTEGER,

  shippingRates: { standard: 5.99, express: 12.99, overnight: 24.99 },

  // ═══ SHIPPING (Shippo) ═══
  shipping: {
    flatRateThresholdOz: 32,
    flatRateCents: 699,
    flatRateLabel: "Standard Shipping",
    defaultProductWeightOz: 4,
    carriersEnabled: { usps: true, ups: true, fedex: true },
    origin: {
      name: "Color Crush Candy Co.",
      street1: "1605 Gentry Blvd",
      street2: "",
      city: "Gering",
      state: "NE",
      zip: "69341",
      country: "US",
      phone: "", // TODO: fill in business phone
      email: "hello@colorcrushcandy.com",
    },
  },

  // ═══ SOCIAL ═══
  social: {
    instagram: "https://instagram.com/sweethaven",
    facebook: "https://facebook.com/sweethaven",
    tiktok: "https://tiktok.com/@sweethaven",
    twitter: "https://twitter.com/sweethaven",
  },

  // ═══ CONTACT ═══
  // Empty by default. Email templates derive contact info from
  // shipping.origin when these aren't set in Admin → Settings → Contact.
  contact: {
    email: "",
    phone: "",
    address: "",
  },

  // ═══ FEATURE FLAGS ═══
  features: {
    buildYourOwnBox: true,
    giftMessages: true,
    subscriptions: false,
    reviews: true,
    wishlist: true,
    loyaltyPoints: false,
    // Dev-only escape hatch. When true, admins gain a "Delete customer + all
    // their orders" action. Keep false in production — no audit trail, no
    // recovery.
    customerDeletion: false,
  },

  // ═══ ANALYTICS / AD TRACKING ═══
  // Pixel/conversion tracking. Defaults are empty so no tags fire until admins
  // configure them in /admin/settings.
  analytics: {
    // Google Ads conversion tracking. Format: "AW-XXXXXXXXXX" (the tag ID).
    googleAdsId: "",
    // Conversion label for purchase events. Combine with id: "AW-123/abcDEF".
    googleAdsPurchaseLabel: "",
    // Meta Pixel ID — a numeric string like "1234567890123456".
    metaPixelId: "",
  },

  // ═══ GGSA PROMO LANDING PAGE (/ggsa) ═══
  // Co-branded Team Sweet Bag fundraiser page for the Gering Girls Softball
  // Association. Disabled by default — flip `enabled` in Admin → Settings.
  // Logo + product image paths are static files under /public (admin can
  // override the paths). Drop the real artwork into /public/images/ggsa/.
  ggsa: {
    enabled: false,
    // Hero copy — editable in Admin → Settings → GGSA Promo Page.
    tagline: "Fundraiser",
    title: "Team Sweet Bags",
    description:
      "Grab a 3 oz bag of Color Crush candy at the field — every bag supports the Gering Girls Softball Association. Just $3 each.",
    // Logos + product images are uploaded from Admin → Settings → GGSA Promo
    // Page (stored as GCS URLs). Empty until uploaded.
    logoColorCrush: "",
    logoGgsa: "",
    productImages: [] as string[],
  },
} as const;

export type ShippingConfig = {
  flatRateThresholdOz: number;
  flatRateCents: number;
  flatRateLabel: string;
  defaultProductWeightOz: number;
  carriersEnabled: { usps: boolean; ups: boolean; fedex: boolean };
  origin: {
    name: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
  };
};

export type GgsaConfig = {
  enabled: boolean;
  tagline: string;
  title: string;
  description: string;
  logoColorCrush: string;
  logoGgsa: string;
  productImages: readonly string[];
};

export type SiteConfig = Omit<typeof siteConfig, "shipping" | "ggsa"> & {
  shipping: ShippingConfig;
  ggsa: GgsaConfig;
  logoUrl?: string;
  faviconUrl?: string;
  maintenanceMode?: {
    enabled: boolean;
    heading: string;
    message: string;
    videoEnabled?: boolean;
    videoUrl?: string;
  };
  announcementBar?: {
    enabled: boolean;
    text: string;
  };
  hero?: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    imageDesktopUrl: string;
    imageMobileUrl: string;
    imageAlt: string;
    ctaLabel: string;
    ctaHref: string;
    textAlign: "left" | "center" | "right";
    overlay: "dark" | "light" | "none";
    hideHeaderLogoOnHome: boolean;
    backgroundColor?: string;
    backgroundGradient?: {
      from?: string;
      to?: string;
      angle?: number;
    };
  };
};
