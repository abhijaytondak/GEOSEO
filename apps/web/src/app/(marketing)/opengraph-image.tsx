import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "GEOSEO — Be the answer buyers find, in Google and AI.";

export default function Image() {
  return ogImage({ eyebrow: "Generative Engine Optimization", title: "Be the answer buyers find — in Google and AI." });
}
