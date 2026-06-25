import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";
import { PLATFORM, getFeature } from "@/components/marketing/platform-data";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "GEOSEO platform";

export function generateStaticParams() {
  return PLATFORM.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getFeature("platform", slug);
  return ogImage({ eyebrow: d?.eyebrow ?? "GEOSEO Platform", title: d?.title ?? "GEOSEO" });
}
