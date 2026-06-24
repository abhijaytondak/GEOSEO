import type { MetadataRoute } from "next";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { SITE_URL } from "@/components/marketing/data";

export const dynamic = "force-dynamic";

/** Sitemap: the marketing landing (top priority) + published /feeds pages (PRD §7.7).
 *  Feed URLs use the workspace's own domain (Brand Memory), never a demo brand. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, brand] = await Promise.all([
    pageEngineApi.getPublishedPages().catch(() => []),
    api.getBrandMemory().then((b) => b.profile).catch(() => null),
  ]);
  const domain = (brand?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = domain ? `https://${domain}` : "";
  const marketing: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
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
