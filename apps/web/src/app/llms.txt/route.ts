import { pageEngineApi } from "@/lib/page-engine-client";

export const dynamic = "force-dynamic";

/**
 * llms.txt — AI-crawler guidance listing published, citation-ready pages.
 * (PRD §7.7: expose structured guidance for AI answer engines.)
 */
export async function GET() {
  const pages = await pageEngineApi.getPublishedPages();
  const lines = [
    "# Northwind Labs",
    "> Warehouse-native product analytics with AI that explains why metrics move.",
    "",
    "## Pages",
    ...pages.map((p) => {
      const url = p.publishedUrl ?? `https://northwindlabs.io/feeds${p.slug}`;
      return `- [${p.title}](${url}): ${p.metaDescription}`;
    }),
    "",
    "## Contact",
    "- Demo: https://northwindlabs.io/demo",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
