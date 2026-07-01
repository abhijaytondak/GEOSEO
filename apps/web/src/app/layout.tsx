import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_URL } from "@/components/marketing/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Google Search Console site verification — set GOOGLE_SITE_VERIFICATION on the Vercel
// project (the token GSC gives you) + redeploy, and the verification meta tag renders.
// Omitted entirely when unset, so no empty/placeholder tag ships. No code change needed
// to activate — just the env var.
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

// Google Tag Manager container. Overridable via NEXT_PUBLIC_GTM_ID; defaults to the
// production container so it's live everywhere. Rendered on every route (marketing,
// resources, feeds, and the app) via the root layout.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-KJVR8PFQ";

export const metadata: Metadata = {
  // Resolves relative OG/Twitter image URLs during static generation (fixes the
  // "metadataBase not set, using http://localhost:3000" build warning).
  metadataBase: new URL(SITE_URL),
  title: "Citensity — Authority & SEO Optimization Engine",
  description:
    "Automated backlink acquisition, domain authority growth, and continuous SEO optimization — surfaced in a world-class dashboard.",
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE: ClerkProvider lives in (app)/layout.tsx and the sign-in/sign-up layouts —
  // NOT here — so public marketing/feeds/resources pages ship zero Clerk client JS and
  // skip the auth-handshake redirect. Puter (browser AI) is loaded on demand by
  // lib/puter-ai.ts only when a draft/extract/discover call runs, not on every route.
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      {GTM_ID ? (
        <head>
          {/* Google Tag Manager — loads as high as possible via next/script. */}
          <Script id="gtm-base" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        </head>
      ) : null}
      <body className="min-h-full">
        {/* Google Tag Manager (noscript) — must be immediately after <body>. */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <TooltipProvider delay={150}>{children}</TooltipProvider>
        {/* Real-user Core Web Vitals + page analytics (per-route RUM). Tiny client
            scripts that no-op off the Vercel platform; safe on every route. */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
