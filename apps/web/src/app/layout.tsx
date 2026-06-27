import type { Metadata } from "next";
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

export const metadata: Metadata = {
  // Resolves relative OG/Twitter image URLs during static generation (fixes the
  // "metadataBase not set, using http://localhost:3000" build warning).
  metadataBase: new URL(SITE_URL),
  title: "GEOSEO — Authority & SEO Optimization Engine",
  description:
    "Automated backlink acquisition, domain authority growth, and continuous SEO optimization — surfaced in a world-class dashboard.",
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
      <body className="min-h-full">
        <TooltipProvider delay={150}>{children}</TooltipProvider>
        {/* Real-user Core Web Vitals + page analytics (per-route RUM). Tiny client
            scripts that no-op off the Vercel platform; safe on every route. */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
