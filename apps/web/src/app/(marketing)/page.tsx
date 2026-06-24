import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import {
  Hero,
  EnginesStrip,
  Problem,
  HowItWorks,
  ProductSection,
  PlatformGrid,
  SolutionsRow,
  MetricsBand,
  Comparison,
  ProofBand,
  CtaBand,
} from "@/components/marketing/sections";
import { Faq } from "@/components/marketing/faq";
import { FAQS, SITE_URL, BRAND, TAGLINE } from "@/components/marketing/data";

const DESCRIPTION =
  "GEOSEO is the Generative Engine Optimization platform that learns your brand and continuously creates and publishes pages engineered to rank in Google and get cited by ChatGPT, Perplexity, and AI Overviews — then captures the leads.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND} — ${TAGLINE}`,
  description: DESCRIPTION,
  keywords: [
    "generative engine optimization",
    "GEO platform",
    "AI SEO",
    "rank in ChatGPT",
    "rank in Perplexity",
    "Google AI Overviews",
    "AI answer engine optimization",
    "programmatic SEO",
    "AI search visibility",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND} — ${TAGLINE}`,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: `${BRAND} — ${TAGLINE}`, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";

/** Organization + SoftwareApplication + WebSite + FAQ structured data for rich results + GEO. */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: BRAND,
        url: SITE_URL,
        description: DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BRAND,
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "SoftwareApplication",
        name: BRAND,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: DESCRIPTION,
        offers: { "@type": "Offer", category: "SaaS" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}

export default function MarketingHome() {
  return (
    <>
      <StructuredData />
      <Hero />
      <EnginesStrip />
      <Problem />
      <PlatformGrid />
      <HowItWorks />
      <ProductSection />
      <SolutionsRow />
      <MetricsBand />
      <Comparison />
      <ProofBand />

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
                <span className="size-1.5 rounded-full bg-brand" /> Questions
              </span>
              <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Everything you might ask.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq />
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
