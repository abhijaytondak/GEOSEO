import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { INTEGRATIONS } from "@/components/marketing/integrations-data";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";
const CARD =
  "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float";

const DESCRIPTION =
  "Publish GEOSEO's optimized, schema-rich content straight to your stack — WordPress, Webflow, or Shopify — or to a managed feed. Draft-first: you review every page before it goes live.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Integrations — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/integrations" },
  openGraph: { title: `Integrations — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/integrations`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function IntegrationsIndex() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/integrations#page`,
        url: `${SITE_URL}/integrations`,
        name: `Integrations — ${BRAND}`,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Integrations", item: `${SITE_URL}/integrations` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
                <span className="size-1.5 rounded-full bg-brand" /> Integrations
              </span>
              <h1 className={cn(DISPLAY, "mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl")}>
                Publish where your site already <span className={GRAD}>lives.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{DESCRIPTION}</p>
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-positive/10 px-3 py-1.5 text-sm font-medium text-positive">
                <ShieldCheck className="size-4" /> Draft-first — review and approve every page before it publishes.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((i, idx) => {
              const Icon = i.icon;
              return (
                <Reveal key={i.slug} delay={idx * 0.08}>
                  <Link href={`/integrations/${i.slug}`} className={CARD}>
                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-info text-white"><Icon className="size-5" /></span>
                    <h2 className={cn(DISPLAY, "mt-4 text-lg text-foreground")}>{i.name}</h2>
                    <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-muted-foreground">{i.subtitle.split(".")[0]}.</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                      See the {i.name} integration <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
