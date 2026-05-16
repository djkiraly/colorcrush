export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import { AdPixels } from "@/components/storefront/AdPixels";
import { EmailVerificationBanner } from "@/components/storefront/EmailVerificationBanner";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";

// Paths that must remain reachable during maintenance so an admin can sign in
// and turn it off. Anything under /login or the NextAuth API endpoints.
const MAINTENANCE_BYPASS_PATHS = ["/login", "/api/auth"];

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  if (settings.maintenanceMode?.enabled) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const isAuthFlow = MAINTENANCE_BYPASS_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    const session = await auth();
    if (!isAuthFlow && !isAdmin(session)) {
      redirect("/maintenance");
    }
  }

  return (
    <SessionProvider>
      <SiteSettingsProvider settings={settings}>
        <Header />
        <EmailVerificationBanner />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
        <PageViewTracker />
        <AdPixels />
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
