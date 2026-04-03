import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { getSettings } from "@/lib/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <SessionProvider>
      <SiteSettingsProvider settings={settings}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
