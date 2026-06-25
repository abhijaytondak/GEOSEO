"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, track } from "@/lib/analytics";

/**
 * Boots product analytics on the client and records a marketing page-view per route.
 * No-ops entirely unless `NEXT_PUBLIC_POSTHOG_KEY` is set (see lib/analytics.ts), so it's
 * safe to mount unconditionally. PostHog's own pageview capture covers SPA navigations;
 * this also emits an explicit `marketing_page_viewed` for funnel clarity.
 */
export function AnalyticsInit() {
  const pathname = usePathname();
  useEffect(() => {
    void initAnalytics();
  }, []);
  useEffect(() => {
    track("marketing_page_viewed", { path: pathname });
  }, [pathname]);
  return null;
}
