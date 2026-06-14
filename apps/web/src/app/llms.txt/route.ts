import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";

export const dynamic = "force-dynamic";

/**
 * llms.txt — AI-crawler guidance listing published, citation-ready pages.
 * (PRD §7.7.) Built from the workspace's own Brand Memory — never a demo brand.
 */
export async function GET() {
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
