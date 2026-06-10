export const dynamic = "force-dynamic";

import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import { AdPixels } from "@/components/storefront/AdPixels";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { getSettings } from "@/lib/settings";

/**
 * The GGSA promo lives outside the (storefront) route group, so it doesn't get
 * that layout's analytics wiring. This thin layout adds pageview tracking
 * (internal /api/track + UTM/gclid/fbclid attribution) and the ad pixels —
 * without the storefront Header/Footer/cart chrome the promo intentionally omits.
 */
export default async function GgsaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <SiteSettingsProvider settings={settings}>
      {children}
      <PageViewTracker />
      <AdPixels />
    </SiteSettingsProvider>
  );
}
