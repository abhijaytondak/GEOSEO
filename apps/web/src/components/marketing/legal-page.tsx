import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/components/marketing/data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/**
 * Shared prose layout for trust / E-E-A-T pages (About, Methodology, Security, Privacy, Terms).
 * Emits WebPage + BreadcrumbList JSON-LD (linked to the site's WebSite node) and a visible
 * breadcrumb, so each page is a real, crawlable, structured trust signal.
 */
export function LegalPage({
  title,
  kicker,
  intro,
  updated,
  sections,
  path,
}: {
  title: string;
  kicker?: string;
  intro: string;
  updated?: string;
  sections: LegalSection[];
  path: string;
}) {
  const url = `${SITE_URL}${path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: title,
        description: intro,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        ...(updated ? { dateModified: updated } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <span aria-hidden className="mx-1.5">›</span>
              <span className="text-foreground">{title}</span>
            </nav>
            {kicker && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
                <span className="size-1.5 rounded-full bg-brand" /> {kicker}
              </span>
            )}
            <h1 className={cn(DISPLAY, "mt-4 text-4xl leading-[1.05] text-foreground sm:text-5xl")}>{title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{intro}</p>
            {updated && <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>}
          </Reveal>
        </div>
      </section>

      <section className="bg-background pb-24 pt-12">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <Reveal key={s.heading} delay={Math.min(i * 0.04, 0.2)}>
                <div>
                  <h2 className={cn(DISPLAY, "text-xl text-foreground sm:text-2xl")}>{s.heading}</h2>
                  <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-brand [&_a:hover]:underline [&_li]:ml-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                    {s.body}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
