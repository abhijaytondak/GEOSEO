import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { BRAND, TAGLINE, SITE_URL } from "@/components/marketing/data";
import { ALL_FEATURE_PAGES, featureHref } from "@/components/marketing/platform-data";
import { RESOURCE_INDEX, PUBLISHED_SLUGS } from "@/components/resources/resource-index";
import { getTopic } from "@/components/resources/topics";

// ISR so this AI-crawler guidance becomes a Vercel cache HIT (it was a force-dynamic
// MISS). In demo mode the route returns before any fetch → fully cacheable.
export const revalidate = 300;

/** Demo deployments have no real tenant — expose the Citensity product identity + marketing
 *  pages, never the demo workspace's brand or sample feed URLs (audit critical #1). */
const DEMO = process.env.NEXT_PUBLIC_GEOSEO_MODE === "demo";

/**
 * llms.txt — AI-crawler guidance listing citation-ready pages. (PRD §7.7.)
 * In demo mode it presents the Citensity product + marketing pages. In a real deployment it
 * is built from the workspace's own Brand Memory and published /feeds pages.
 */
export async function GET() {
  if (DEMO) {
    const lines = [
      `# ${BRAND}`,
      `> ${TAGLINE}`,
      "",
      "## Pages",
      `- [${BRAND}](${SITE_URL}/): ${TAGLINE}`,
      ...ALL_FEATURE_PAGES.map((f) => `- [${f.label}](${SITE_URL}${featureHref(f)}): ${f.tagline}`),
      "",
      "## Guides & resources (GEO and AI-search)",
      `- [${BRAND} resource library](${SITE_URL}/resources): Answer-first guides on generative engine optimization, AI-search visibility, and SEO.`,
      ...PUBLISHED_SLUGS.map((slug) => {
        const title = getTopic(slug)?.title ?? slug;
        const desc = RESOURCE_INDEX[slug]?.metaDescription ?? "";
        return `- [${title}](${SITE_URL}/resources/${slug}): ${desc}`;
      }),
    ];
    return new Response(lines.join("\n"), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  }

  const [pages, brand] = await Promise.all([
    pageEngineApi.getPublishedPages(),
    api.getBrandMemory().then((b) => b.profile).catch(() => null),
  ]);

  const company = brand?.company?.trim() || "Our company";
  const domain = (brand?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const base = domain ? `https://${domain}` : "";
  const tagline = brand?.valueProp?.trim();

  const lines = [
    `# ${company}`,
    ...(tagline ? [`> ${tagline}`] : []),
    "",
    "## Pages",
    ...pages.map((p) => {
      const url = p.publishedUrl ?? `${base}/feeds${p.slug}`;
      return `- [${p.title}](${url}): ${p.metaDescription}`;
    }),
    ...(brand?.contactEmail ? ["", "## Contact", `- ${brand.contactEmail}`] : []),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
