"use client";

import Script from "next/script";

/**
 * GA4 (Google Analytics) loader — direct gtag.js. Renders only when a Measurement ID
 * (NEXT_PUBLIC_GA_ID, e.g. "G-XXXXXXXX") is set. No-op when unset. Use this OR GoogleTagManager,
 * not both (loading GA4 twice double-counts). Loaded `afterInteractive` so it never blocks paint.
 */
export function GoogleAnalytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}

/**
 * Google Tag Manager loader. Renders the GTM container only when NEXT_PUBLIC_GTM_ID
 * (e.g. "GTM-XXXXXXX") is set; no-op otherwise. GTM is a tag container — you configure
 * GA4 and any other tags inside the GTM dashboard, so no code change is needed to add
 * future tags. (Configure a GA4 tag in GTM + publish for analytics data to actually flow.)
 */
export function GoogleTagManager({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}

/** GTM <noscript> fallback iframe — fires the container for no-JS clients/crawlers. Mount in <body>. */
export function GoogleTagManagerNoScript({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}
