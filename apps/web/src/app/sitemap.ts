import type { MetadataRoute } from "next";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { SITE_URL } from "@/components/marketing/data";
import { ALL_FEATURE_PAGES, featureHref } from "@/components/marketing/platform-data";
// Body-free metadata index (slug + lastModified) — no article bodies in the sitemap graph.
import { RESOURCE_INDEX, PUBLISHED_SLUGS } from "@/components/resources/resource-index";

// ISR so the public sitemap becomes a Vercel cache HIT. In demo mode the route does
// no API fetch (pure static marketing output) → fully cached + revalidated every 5 min.
// In a real deployment the no-store feed/brand fetches keep it fresh per request.
export const revalidate = 300;

/** Demo deployments serve sample feed content via the mock fallback; never list those
 *  demo/customer feed URLs in the production sitemap (audit critical #1). */
const DEMO = process.env.NEXT_PUBLIC_GEOSEO_MODE === "demo";

/** Sitemap: marketing landing + platform/solution pages (top priority) + published
 *  /feeds pages (PRD §7.7). Feed URLs use the workspace's own domain (Brand Memory).
 *  In demo mode only the Citensity marketing routes are emitted — no demo feed URLs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, brand] = await Promise.all([
    DEMO ? Promise.resolve([]) : pageEngineApi.getPublishedPages().catch(() => []),
    DEMO ? Promise.resolve(null) : api.getBrandMemory().then((b) => b.profile).catch(() => null),
  ]);
  const domain = (brand?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = domain ? `https://${domain}` : "";
  const marketing: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/demo`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/resources`, changeFrequency: "weekly", priority: 0.8 },
    // Integrations hub + per-platform pages (BOFU)
    { url: `${SITE_URL}/integrations`, changeFrequency: "monthly", priority: 0.8 },
    ...["wordpress", "webflow", "shopify"].map((s) => ({
      url: `${SITE_URL}/integrations/${s}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Comparison / buyer's-guide (BOFU)
    { url: `${SITE_URL}/compare/best-geo-tools`, changeFrequency: "monthly", priority: 0.8 },
    // Trust / E-E-A-T pages
    ...["about", "methodology", "security", "privacy", "terms"].map((p) => ({
      url: `${SITE_URL}/${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "about" || p === "methodology" ? 0.6 : 0.4,
    })),
    ...ALL_FEATURE_PAGES.map((f) => ({
      url: `${SITE_URL}${featureHref(f)}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...PUBLISHED_SLUGS.map((slug) => ({
      url: `${SITE_URL}/resources/${slug}`,
      lastModified: RESOURCE_INDEX[slug].updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return [
    ...marketing,
    ...pages.map((p) => ({
      url: p.publishedUrl ?? `${base}/feeds${p.slug}`,
      lastModified: p.lastRefreshedAt ?? p.publishedAt ?? p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
