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
  freeShippingThreshold: 50,
  shippingRates: { standard: 5.99, express: 12.99, overnight: 24.99 },

  // ═══ SOCIAL ═══
  social: {
    instagram: "https://instagram.com/sweethaven",
    facebook: "https://facebook.com/sweethaven",
    tiktok: "https://tiktok.com/@sweethaven",
    twitter: "https://twitter.com/sweethaven",
  },

  // ═══ CONTACT ═══
  contact: {
    email: "hello@sweethaven.com",
    phone: "(555) 123-4567",
    address: "123 Candy Lane, Sweet City, SC 29401",
  },

  // ═══ FEATURE FLAGS ═══
  features: {
    buildYourOwnBox: true,
    giftMessages: true,
    subscriptions: false,
    reviews: true,
    wishlist: true,
    loyaltyPoints: false,
  },
} as const;

export type SiteConfig = typeof siteConfig & {
  logoUrl?: string;
  faviconUrl?: string;
};
