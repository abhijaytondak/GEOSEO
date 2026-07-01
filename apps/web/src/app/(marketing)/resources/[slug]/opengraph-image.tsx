import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";
import { getArticle, PUBLISHED_SLUGS } from "@/components/resources/content";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Citensity resource";

export function generateStaticParams() {
  return PUBLISHED_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  // Card title = the article title without the " | Citensity" suffix (that's in the wordmark already).
  const title = (a?.metaTitle ?? "Citensity Resources").replace(/\s*\|\s*Citensity\s*$/i, "");
  return ogImage({ eyebrow: "GEO Resources", title });
}
