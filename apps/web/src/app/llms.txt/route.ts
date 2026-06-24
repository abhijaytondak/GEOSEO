import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { BRAND, TAGLINE, SITE_URL } from "@/components/marketing/data";
import { ALL_FEATURE_PAGES, featureHref } from "@/components/marketing/platform-data";

export const dynamic = "force-dynamic";

/** Demo deployments have no real tenant — expose the GEOSEO product identity + marketing
 *  pages, never the demo workspace's brand or sample feed URLs (audit critical #1). */
const DEMO = process.env.NEXT_PUBLIC_GEOSEO_MODE === "demo";

/**
 * llms.txt — AI-crawler guidance listing citation-ready pages. (PRD §7.7.)
 * In demo mode it presents the GEOSEO product + marketing pages. In a real deployment it
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
    ];
    return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
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
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
