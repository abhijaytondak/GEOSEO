import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/marketing/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Citensity pricing — founding-customer plans";

export default function Image() {
  return ogImage({ eyebrow: "Founding-customer pricing", title: "Pricing that scales with your visibility." });
}
