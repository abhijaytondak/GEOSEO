import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Orbit } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { LeadForm } from "@/components/feeds/lead-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await pageEngineApi.getPublishedBySlug(slug);
  if (!page) return { title: "Not found" };
  const canonical = page.publishedUrl ?? `https://northwindlabs.io/feeds${page.slug}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      type: "article",
    },
  };
}

export default async function FeedPage({ params }: Params) {
  const { slug } = await params;
  const page = await pageEngineApi.getPublishedBySlug(slug);
  if (!page) notFound();

  const canonical = page.publishedUrl ?? `https://northwindlabs.io/feeds${page.slug}`;

  return (
    <div className="min-h-dvh bg-canvas">
      {/* schema for traditional + AI crawlers */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.schemaJson }} />

      {/* minimal public chrome */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-brand-foreground">
            <Orbit className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">Northwind Labs</span>
          <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
            {page.pageType}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_340px]">
        {/* article */}
        <article>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {page.targetKeywords.map((k) => (
              <span key={k} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {k}
              </span>
            ))}
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-foreground">{page.title}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-body">{page.heroCopy}</p>

          {page.sections.map((s) => (
            <section key={s.heading} className="mt-8">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">{s.heading}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-body">{s.body}</p>
            </section>
          ))}

          {page.faqs.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Frequently asked questions</h2>
              <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                {page.faqs.map((f) => (
                  <div key={f.q} className="px-4 py-3.5">
                    <dt className="text-[14px] font-semibold text-foreground">{f.q}</dt>
                    <dd className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <p className="mt-10 text-[11.5px] text-muted-foreground">
            Canonical: <span className="font-mono">{canonical}</span>
          </p>
        </article>

        {/* sticky lead capture */}
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <LeadForm slug={page.slug} sourceUrl={canonical} />
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-[12px] text-muted-foreground">
          <span>© Northwind Labs</span>
          <a href="https://developer.puter.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Powered by Puter
          </a>
        </div>
      </footer>
    </div>
  );
}
