import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";
import { SOLUTIONS, getFeature } from "@/components/marketing/platform-data";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "GEOSEO solution";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getFeature("solutions", slug);
  return ogImage({ eyebrow: d?.eyebrow ?? "GEOSEO Solution", title: d?.title ?? "GEOSEO" });
}
