import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "GEOSEO resource library";

export default function Image() {
  return ogImage({ eyebrow: "GEO Resources", title: "GEO & AI-search guides" });
}
