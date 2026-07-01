import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";
import { getArticle, PUBLISHED_SLUGS } from "@/components/resources/content";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "GEOSEO resource";

export function generateStaticParams() {
  return PUBLISHED_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  // Card title = the article title without the " | GEOSEO" suffix (that's in the wordmark already).
  const title = (a?.metaTitle ?? "GEOSEO Resources").replace(/\s*\|\s*GEOSEO\s*$/i, "");
  return ogImage({ eyebrow: "GEO Resources", title });
}
