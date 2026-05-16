"use client";

import Script from "next/script";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

/**
 * Injects Google Ads (gtag.js) and Meta Pixel scripts when the corresponding
 * IDs are configured in Admin → Settings. Renders nothing when both are blank,
 * so a site without ad accounts has zero third-party JS.
 *
 * Conversion events live elsewhere (see `firePurchaseConversion` below + the
 * checkout success page). Keep this component focused on pixel installation.
 */
export function AdPixels() {
  const settings = useSiteSettings();
  const googleAdsId = settings.analytics?.googleAdsId?.trim() || "";
  const metaPixelId = settings.analytics?.metaPixelId?.trim() || "";

  return (
    <>
      {googleAdsId && (
        <>
          <Script
            id="gtag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `}
          </Script>
        </>
      )}

      {metaPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
            n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
            t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
