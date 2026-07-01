import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Book a Citensity demo";

export default function Image() {
  return ogImage({ eyebrow: "Book a demo", title: "See Citensity on your own site." });
}
