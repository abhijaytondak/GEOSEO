import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView, ArticleJsonLd } from "@/components/resources/article-view";
import { getArticle, PUBLISHED_SLUGS } from "@/components/resources/content";
import { SITE_URL, BRAND } from "@/components/marketing/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLISHED_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Not found" };
  const url = `${SITE_URL}/resources/${a.slug}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: `/resources/${a.slug}` },
    openGraph: { title: a.metaTitle, description: a.metaDescription, url, siteName: BRAND, type: "article", publishedTime: a.updated },
    twitter: { card: "summary_large_image", title: a.metaTitle, description: a.metaDescription },
    robots: { index: true, follow: true },
  };
}

export default async function ResourceArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return (
    <>
      <ArticleJsonLd article={article} siteUrl={SITE_URL} />
      <ArticleView article={article} />
    </>
  );
}
