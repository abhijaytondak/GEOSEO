import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeaturePage } from "@/components/marketing/feature-page";
import { SOLUTIONS, getFeature } from "@/components/marketing/platform-data";
import { SITE_URL, BRAND } from "@/components/marketing/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getFeature("solutions", slug);
  if (!data) return { title: "Not found" };
  const url = `${SITE_URL}/solutions/${data.slug}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: `/solutions/${data.slug}` },
    openGraph: { title: data.metaTitle, description: data.metaDescription, url, siteName: BRAND, type: "website" },
    twitter: { card: "summary_large_image", title: data.metaTitle, description: data.metaDescription },
    robots: { index: true, follow: true },
  };
}

export default async function SolutionFeature({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getFeature("solutions", slug);
  if (!data) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.metaTitle,
    description: data.metaDescription,
    url: `${SITE_URL}/solutions/${data.slug}`,
    isPartOf: { "@type": "WebSite", name: BRAND, url: SITE_URL },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FeaturePage data={data} />
    </>
  );
}
