"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_sv_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_sv_sid", sid);
  }
  return sid;
}

/**
 * Extract product ID from a product page path if applicable.
 * Expects paths like /products/[slug] — the slug is NOT the product ID,
 * so we pass it as-is and let the API resolve if needed, or skip productId.
 */

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef("");

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // Don't double-track the same URL
    if (url === lastTracked.current) return;
    lastTracked.current = url;

    const sessionId = getSessionId();

    // Fire-and-forget
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId,
      }),
      // Use keepalive so the request survives navigation
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
