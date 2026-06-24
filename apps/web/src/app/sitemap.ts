import type { MetadataRoute } from "next";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { SITE_URL } from "@/components/marketing/data";
import { ALL_FEATURE_PAGES, featureHref } from "@/components/marketing/platform-data";

export const dynamic = "force-dynamic";

/** Demo deployments serve sample feed content via the mock fallback; never list those
 *  demo/customer feed URLs in the production sitemap (audit critical #1). */
const DEMO = process.env.NEXT_PUBLIC_GEOSEO_MODE === "demo";

/** Sitemap: marketing landing + platform/solution pages (top priority) + published
 *  /feeds pages (PRD §7.7). Feed URLs use the workspace's own domain (Brand Memory).
 *  In demo mode only the GEOSEO marketing routes are emitted — no demo feed URLs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, brand] = await Promise.all([
    DEMO ? Promise.resolve([]) : pageEngineApi.getPublishedPages().catch(() => []),
    DEMO ? Promise.resolve(null) : api.getBrandMemory().then((b) => b.profile).catch(() => null),
  ]);
  const domain = (brand?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = domain ? `https://${domain}` : "";
  const marketing: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...ALL_FEATURE_PAGES.map((f) => ({
      url: `${SITE_URL}${featureHref(f)}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
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
