import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { siteConfig, type SiteConfig } from "../../site.config";

export type SiteSettingsOverrides = {
  name?: string;
  tagline?: string;
  description?: string;
  url?: string;
  taxRate?: number;
  freeShippingThreshold?: number;
  shippingRates?: {
    standard?: number;
    express?: number;
    overnight?: number;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
  };
  features?: {
    buildYourOwnBox?: boolean;
    giftMessages?: boolean;
    subscriptions?: boolean;
    reviews?: boolean;
    wishlist?: boolean;
    loyaltyPoints?: boolean;
    customerDeletion?: boolean;
  };
  shipping?: {
    flatRateThresholdOz?: number;
    flatRateCents?: number;
    carriersEnabled?: {
      usps?: boolean;
      ups?: boolean;
      fedex?: boolean;
    };
    origin?: {
      name?: string;
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      phone?: string;
      email?: string;
    };
  };
  maintenanceMode?: {
    enabled?: boolean;
    heading?: string;
    message?: string;
    imageUrl?: string;
  };
  analytics?: {
    googleAdsId?: string;
    googleAdsPurchaseLabel?: string;
    metaPixelId?: string;
  };
  ggsa?: {
    enabled?: boolean;
    tagline?: string;
    title?: string;
    description?: string;
    footer?: string;
    logoColorCrush?: string;
    logoGgsa?: string;
    productImages?: string[];
  };
  byob?: {
    enabled?: boolean;
    boxes?: {
      id: string;
      label: string;
      pieces: number;
      price: number;
      cols: number;
      rows: number;
      sortOrder: number;
    }[];
    tastes?: { slug: string; label: string; hex?: string }[];
    colors?: { slug: string; label: string; hex?: string }[];
    flavors?: { slug: string; label: string; hex?: string }[];
  };
  colors?: {
    primary?: string;
    primaryHover?: string;
    secondary?: string;
    accent?: {
      pink?: string;
      mint?: string;
      lavender?: string;
      peach?: string;
      sky?: string;
    };
    background?: string;
    surface?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  hero?: {
    enabled?: boolean;
    headline?: string;
    subheadline?: string;
    imageDesktopUrl?: string;
    imageMobileUrl?: string;
    imageAlt?: string;
    ctaLabel?: string;
    ctaHref?: string;
    textAlign?: "left" | "center" | "right";
    overlay?: "dark" | "light" | "none";
    hideHeaderLogoOnHome?: boolean;
    backgroundColor?: string;
    backgroundGradient?: {
      from?: string;
      to?: string;
      angle?: number;
    };
  };
};

/**
 * Load settings overrides from the database and merge with static defaults.
 */
export async function getSettings(): Promise<SiteConfig> {
  try {
    const rows = await db.select().from(siteSettings);

    const overrides: Record<string, unknown> = {};
    for (const row of rows) {
      overrides[row.key] = row.value;
    }

    return deepMerge(siteConfig, overrides) as SiteConfig;
  } catch {
    // If DB is unavailable, fall back to static config
    return siteConfig;
  }
}

/**
 * Save a single setting key to the database.
 */
export async function saveSetting(
  key: string,
  value: unknown,
  userId: string
): Promise<void> {
  await db
    .insert(siteSettings)
    .values({
      key,
      value,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get all setting overrides from the database (raw key-value pairs).
 */
export async function getSettingOverrides(): Promise<
  Record<string, unknown>
> {
  try {
    const rows = await db.select().from(siteSettings);
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  } catch {
    return {};
  }
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (
    typeof target !== "object" ||
    typeof source !== "object" ||
    target === null ||
    source === null
  ) {
    return source !== undefined ? source : target;
  }

  const result = { ...(target as Record<string, unknown>) };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const sourceVal = (source as Record<string, unknown>)[key];
    const targetVal = result[key];

    if (
      typeof targetVal === "object" &&
      typeof sourceVal === "object" &&
      targetVal !== null &&
      sourceVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}
