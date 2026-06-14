import type { MetadataRoute } from "next";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/** Sitemap of published /feeds pages (PRD §7.7). URLs use the workspace's own
 *  domain (Brand Memory), never a demo brand. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, brand] = await Promise.all([
    pageEngineApi.getPublishedPages(),
    api.getBrandMemory().then((b) => b.profile).catch(() => null),
  ]);
  const domain = (brand?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = domain ? `https://${domain}` : "";
  return pages.map((p) => ({
    url: p.publishedUrl ?? `${base}/feeds${p.slug}`,
    lastModified: p.lastRefreshedAt ?? p.publishedAt ?? p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
