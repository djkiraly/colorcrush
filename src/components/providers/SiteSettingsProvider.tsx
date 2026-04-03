"use client";

import { createContext, useContext } from "react";
import type { SiteConfig } from "../../../site.config";

const SiteSettingsContext = createContext<SiteConfig | null>(null);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteConfig;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteConfig {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}
