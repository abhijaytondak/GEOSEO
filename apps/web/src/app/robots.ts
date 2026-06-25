import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/marketing/data";

/**
 * robots.txt — lets crawlers (and AI crawlers like GPTBot, PerplexityBot) index the
 * public marketing surface and discover the sitemap, while keeping the gated product
 * app and API out of the index. The sitemap reference is how Google/Bing auto-discover
 * all 100+ resource pages without a manual Search Console submission.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/home",
          "/onboarding",
          "/pipeline",
          "/pages",
          "/authority",
          "/leads",
          "/analytics",
          "/brand",
          "/settings",
          "/dashboard",
          "/research",
          "/content",
          "/theme",
          "/opportunities",
          "/competitors",
          "/performance",
          "/ai-search",
          "/conversion-audit",
          "/search",
          "/alerts",
          "/admin",
          "/billing",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
