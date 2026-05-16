"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SID_KEY = "_sv_sid";
const ATTR_KEY = "_sv_attr_last"; // last-touch attribution per session
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

type Attribution = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SID_KEY, sid);
  }
  return sid;
}

/**
 * Update last-touch attribution from the current URL. Any non-empty param
 * overwrites the stored value; missing params leave previous values intact, so
 * a visitor who arrived via `?utm_source=google` and then navigates internally
 * still has `google` recorded on every subsequent pageview.
 */
function refreshAttribution(searchParams: URLSearchParams): Attribution {
  if (typeof window === "undefined") return {};
  let stored: Attribution = {};
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = {};
  }

  const key2camel: Record<string, keyof Attribution> = {
    utm_source: "utmSource",
    utm_medium: "utmMedium",
    utm_campaign: "utmCampaign",
    utm_content: "utmContent",
    utm_term: "utmTerm",
    gclid: "gclid",
    fbclid: "fbclid",
  };

  let changed = false;
  for (const k of UTM_KEYS) {
    const v = searchParams.get(k);
    if (v && v.length > 0) {
      stored[key2camel[k]] = v.slice(0, 255);
      changed = true;
    }
  }
  if (changed) {
    try {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(stored));
    } catch {}
  }
  return stored;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef("");

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // Don't double-track the same URL within a session
    if (url === lastTracked.current) return;
    lastTracked.current = url;

    const sessionId = getSessionId();
    const attr = refreshAttribution(searchParams ?? new URLSearchParams());

    // /products/<slug> → send slug so the server can resolve productId.
    const productSlug = pathname?.startsWith("/products/")
      ? pathname.slice("/products/".length).split("/")[0] || null
      : null;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId,
        productSlug,
        ...attr,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
