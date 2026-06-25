import { Bricolage_Grotesque } from "next/font/google";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { AnalyticsInit } from "@/components/marketing/analytics-init";

// Distinctive display face for marketing headlines — scoped to this route group via
// the CSS var, so the gated product app keeps its Inter UI type. Body stays Inter.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Public marketing shell — NO app sidebar/topbar and NO onboarding gate (that lives in
 * the (app) group). This route group owns the root `/` so the landing page can rank and
 * capture leads; the product app stays gated under its own routes.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} min-h-dvh bg-background`}>
      <AnalyticsInit />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
