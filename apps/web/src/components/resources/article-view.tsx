import Link from "next/link";
import { ArrowRight, Check, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditForm } from "@/components/marketing/audit-form";
import type { Article } from "./content-types";
import { CLUSTERS, getTopic } from "./topics";
import { PUBLISHED_SLUGS } from "./content";

/** A related link is safe to show if it's an external/product path, or a published
 *  resource article (filters out links to planned-but-unpublished slugs → no 404s). */
function relatedIsLive(href: string): boolean {
  const m = href.match(/^\/resources\/([^/?#]+)/);
  return m ? PUBLISHED_SLUGS.includes(m[1]) : true;
}

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";

function anchor(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Scannable, GEO-optimized article: answer-first box, TOC, sections, FAQ, CTA. */
export function ArticleView({ article }: { article: Article }) {
  const topic = getTopic(article.slug);
  const cluster = CLUSTERS.find((c) => c.id === topic?.cluster);

  return (
    <article className="relative bg-background pb-20 pt-28 sm:pt-32">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70" />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/resources" className="hover:text-foreground">Resources</Link>
          {cluster && (
            <>
              <ChevronRight className="size-3.5" aria-hidden />
              <Link href={`/resources#${cluster.id}`} className="hover:text-foreground">{cluster.label}</Link>
            </>
          )}
        </nav>

        <header className="mt-5">
          {cluster && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand shadow-xs">
              <span className="size-1.5 rounded-full bg-brand" /> {cluster.label}
            </span>
          )}
          <h1 className={cn(DISPLAY, "mt-4 text-3xl leading-[1.1] text-foreground sm:text-4xl md:text-[2.75rem]")}>{topic?.title ?? article.metaTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Updated {new Date(article.updated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {article.readMins} min read</p>
        </header>

        {/* answer-first box (the citable opener) */}
        <div className="mt-7 rounded-2xl border border-brand/20 bg-brand/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
            <Sparkles className="size-3.5" /> The short answer
          </div>
          <p className="mt-3 text-lg leading-relaxed text-foreground">{article.answer}</p>
        </div>

        {/* key takeaways */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">Key takeaways</h2>
          <ul className="mt-3 space-y-2.5">
            {article.takeaways.map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-foreground">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Check className="size-3" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* table of contents */}
        {article.sections.length > 2 && (
          <nav aria-label="On this page" className="mt-6 rounded-2xl border border-border bg-surface-sunken p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">On this page</div>
            <ol className="mt-2.5 space-y-1.5">
              {article.sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${anchor(s.heading)}`} className="text-[15px] text-brand hover:underline">{s.heading}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* body */}
        <div className="mt-10 space-y-10">
          {article.sections.map((s) => (
            <section key={s.heading} id={anchor(s.heading)} className="scroll-mt-24">
              <h2 className={cn(DISPLAY, "text-2xl text-foreground")}>{s.heading}</h2>
              <div className="mt-3 space-y-4">
                {s.body.map((p, i) => (
                  <p key={i} className="text-[17px] leading-relaxed text-muted-foreground">{p}</p>
                ))}
              </div>
              {s.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[16px] leading-relaxed text-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* FAQ */}
        {article.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className={cn(DISPLAY, "text-2xl text-foreground")}>Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
              {article.faqs.map((f) => (
                <div key={f.q} className="p-5">
                  <h3 className="text-base font-semibold text-foreground">{f.q}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-foreground p-7 text-background sm:p-9">
          <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-60" />
          <h2 className={cn(DISPLAY, "relative text-2xl text-white sm:text-3xl")}>Put this into practice — <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">free.</span></h2>
          <p className="relative mt-2 max-w-md text-white/70">Get your free AI-visibility audit and see where engines find you today.</p>
          <div className="relative mt-5 max-w-md"><AuditForm tone="dark" /></div>
        </section>

        {/* related — only links to live destinations (no 404s) */}
        {(() => {
          const live = article.related.filter((r) => relatedIsLive(r.href));
          return live.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground">Keep reading</h2>
            <div className="mt-3 grid gap-2.5">
              {live.map((r) => (
                <Link key={r.href} href={r.href} className="ease-expo group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-raised">
                  <span className="text-[15px] font-medium text-foreground">{r.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
          ) : null;
        })()}
      </div>
    </article>
  );
}

/** Article + FAQPage + BreadcrumbList JSON-LD for rich results + GEO. */
export function ArticleJsonLd({ article, siteUrl }: { article: Article; siteUrl: string }) {
  const url = `${siteUrl}/resources/${article.slug}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.metaTitle,
        description: article.metaDescription,
        datePublished: article.updated,
        dateModified: article.updated,
        author: { "@type": "Organization", name: "GEOSEO", url: siteUrl },
        publisher: { "@type": "Organization", name: "GEOSEO", url: siteUrl },
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Resources", item: `${siteUrl}/resources` },
          { "@type": "ListItem", position: 2, name: article.metaTitle, item: url },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
