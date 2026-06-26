import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SITE_URL, BRAND } from "@/components/marketing/data";
import { CLUSTERS, getTopic } from "@/components/resources/topics";
// Body-free metadata index — keeps the authored article bodies out of the hub's module
// graph (the /resources/[slug] route is the only thing that imports the full CONTENT).
import { RESOURCE_INDEX, PUBLISHED_SLUGS } from "@/components/resources/resource-index";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";

const DESCRIPTION =
  "Guides on Generative Engine Optimization (GEO), AI-search visibility, and the SEO that still matters — from the team building the GEO platform.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Resources — GEO & AI-search guides | ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/resources" },
  openGraph: { title: `Resources — GEO & AI-search guides | ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/resources`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

export default function ResourcesHub() {
  // Group published articles by cluster (only clusters that have content show).
  const published = PUBLISHED_SLUGS.map((s) => getTopic(s)).filter(Boolean);
  const clustersWithContent = CLUSTERS.filter((c) => published.some((t) => t!.cluster === c.id));

  return (
    <>
      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <BookOpen className="size-3.5" /> Resources
            </span>
            <h1 className={cn(DISPLAY, "mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl")}>
              The <span className={GRAD}>GEO</span> playbook.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Practical guides on getting cited by AI engines, ranking in Google, and turning visibility into pipeline — answer-first, like the engines prefer.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20">
        {clustersWithContent.map((c) => {
          const items = published.filter((t) => t!.cluster === c.id);
          return (
            <section key={c.id} id={c.id} className="scroll-mt-24 border-t border-border py-10 first:border-t-0 first:pt-0">
              <div className="mb-6">
                <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>{c.label}</h2>
                <p className="mt-1.5 text-muted-foreground">{c.blurb}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((t) => {
                  const a = RESOURCE_INDEX[t!.slug];
                  return (
                    <Link
                      key={t!.slug}
                      href={`/resources/${t!.slug}`}
                      className="reveal-scroll ease-expo group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-raised"
                    >
                      <h3 className="text-lg font-semibold text-foreground">{t!.title}</h3>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{a.metaDescription}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
