import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntegrationPage } from "@/components/marketing/integration-page";
import { INTEGRATIONS, getIntegration } from "@/components/marketing/integrations-data";
import { SITE_URL, BRAND } from "@/components/marketing/data";

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getIntegration(slug);
  if (!data) return { title: "Not found" };
  return {
    metadataBase: new URL(SITE_URL),
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: `/integrations/${data.slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${SITE_URL}/integrations/${data.slug}`,
      siteName: BRAND,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: data.metaTitle, description: data.metaDescription },
    robots: { index: true, follow: true },
  };
}

export default async function IntegrationSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getIntegration(slug);
  if (!data) notFound();
  return <IntegrationPage data={data} />;
}
