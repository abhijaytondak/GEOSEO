import type { GeneratedPage } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/** Standard XML sitemap for all published pages — used by Google/Bing crawlers. */
export async function GET() {
  const [pages, settings] = await Promise.all([
    pageEngineApi.getPublishedPages() as Promise<GeneratedPage[]>,
    api.getSettings().catch(() => null),
  ]);

  const rawDomain = (settings?.profile?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = rawDomain ? `https://${rawDomain}` : "https://example.com";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const urls = pages
    .map((p) => {
      const loc = esc(p.publishedUrl ?? `${base}/feeds${p.slug}`);
      const mod = (p.updatedAt || p.createdAt || "").split("T")[0];
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        ...(mod ? [`    <lastmod>${mod}</lastmod>`] : []),
        "    <changefreq>monthly</changefreq>",
        "    <priority>0.8</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
