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

export type SiteConfig = Omit<typeof siteConfig, "shipping"> & {
  shipping: ShippingConfig;
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
