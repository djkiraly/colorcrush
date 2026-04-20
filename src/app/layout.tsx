export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.name,
      template: `%s | ${settings.name}`,
    },
    description: settings.description,
    icons: settings.faviconUrl
      ? { icon: settings.faviconUrl }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const c = settings.colors;
  const safe = (v: string | undefined) => (v && /^#[0-9A-Fa-f]{3,8}$/.test(v) ? v : "");
  const themeCss = `:root{
    ${safe(c.primary) && `--brand-primary:${c.primary};--primary:${c.primary};--ring:${c.primary};--chart-1:${c.primary};--sidebar-primary:${c.primary};--sidebar-ring:${c.primary};`}
    ${safe(c.primaryHover) && `--brand-primary-hover:${c.primaryHover};`}
    ${safe(c.secondary) && `--brand-secondary:${c.secondary};--secondary:${c.secondary};--chart-2:${c.secondary};`}
    ${safe(c.accent.pink) && `--brand-pink:${c.accent.pink};--accent:${c.accent.pink};`}
    ${safe(c.accent.mint) && `--brand-mint:${c.accent.mint};`}
    ${safe(c.accent.lavender) && `--brand-lavender:${c.accent.lavender};`}
    ${safe(c.accent.peach) && `--brand-peach:${c.accent.peach};`}
    ${safe(c.accent.sky) && `--brand-sky:${c.accent.sky};`}
    ${safe(c.background) && `--brand-bg:${c.background};--background:${c.background};`}
    ${safe(c.surface) && `--brand-surface:${c.surface};--card:${c.surface};--popover:${c.surface};--sidebar:${c.surface};`}
    ${safe(c.success) && `--brand-success:${c.success};`}
    ${safe(c.warning) && `--brand-warning:${c.warning};`}
    ${safe(c.error) && `--brand-error:${c.error};--destructive:${c.error};`}
  }`;
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
