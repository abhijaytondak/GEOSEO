import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "GEOSEO — Authority & SEO Optimization Engine",
  description:
    "Automated backlink acquisition, domain authority growth, and continuous SEO optimization — surfaced in a world-class dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Puter.js — browser AI (user-pays), used for page content generation */}
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
        <TooltipProvider delay={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
