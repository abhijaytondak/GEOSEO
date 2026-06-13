import type { MetadataRoute } from "next";
import { pageEngineApi } from "@/lib/page-engine-client";

export const dynamic = "force-dynamic";

/** Sitemap of published /feeds pages (PRD §7.7). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await pageEngineApi.getPublishedPages();
  return pages.map((p) => ({
    url: p.publishedUrl ?? `https://northwindlabs.io/feeds${p.slug}`,
    lastModified: p.lastRefreshedAt ?? p.publishedAt ?? p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
