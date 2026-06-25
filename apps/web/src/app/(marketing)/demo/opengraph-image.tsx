import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Book a GEOSEO demo";

export default function Image() {
  return ogImage({ eyebrow: "Book a demo", title: "See GEOSEO on your own site." });
}
