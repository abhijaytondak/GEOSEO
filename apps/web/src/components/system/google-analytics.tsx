"use client";

import Script from "next/script";

/**
 * GA4 (Google Analytics) loader. Renders the gtag scripts only when a Measurement ID
 * is provided (NEXT_PUBLIC_GA_ID, e.g. "G-XXXXXXXX"). No-op when unset, so nothing ships
 * until you create a GA4 property and configure the env var — no code change to activate.
 * Loaded `afterInteractive` so it never blocks paint.
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
