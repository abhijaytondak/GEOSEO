import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Orbit } from "lucide-react";
import type { SiteThemeProfile } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { LeadForm } from "@/components/feeds/lead-form";
import { FeedTracker } from "@/components/feeds/feed-tracker";
import { BrandHero } from "@/components/feeds/brand-hero";
import { Infographic } from "@/components/feeds/infographic";
import { RichText } from "@/components/feeds/rich-text";
import { themeStyle } from "@/lib/feed-theme";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [page, memory] = await Promise.all([
    pageEngineApi.getPublishedBySlug(slug),
    api.getBrandMemory().catch(() => null),
  ]);
  if (!page) return { title: "Not found" };
  const host = memory?.profile.domain?.trim() || "yourdomain.com";
  const canonical = page.publishedUrl ?? `https://${host}/feeds${page.slug}`;
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
  const [page, memory, themes] = await Promise.all([
    pageEngineApi.getPublishedBySlug(slug),
    api.getBrandMemory().catch(() => null),
    api.getSiteThemes().catch(() => [] as SiteThemeProfile[]),
  ]);
  if (!page) notFound();

  // Render in the workspace's confirmed site theme (falls back to the latest scan).
  const theme = themes.find((t) => t.status === "confirmed") ?? themes[0] ?? null;

  // Auto-capture AI-crawler visits (AI Search bot analytics). Only fires the
  // record for crawler-like agents; the API classifies + no-ops for humans.
  const ua = (await headers()).get("user-agent") ?? "";
  if (/bot|crawler|spider|gptbot|oai-searchbot|perplexity|claudebot|claude-web|google-extended|bingbot/i.test(ua)) {
    await api.recordBotHit(page.slug.replace(/^\//, ""), ua).catch(() => {});
  }

  const brandName = memory?.profile.company?.trim() || "Your Brand";
  const host = memory?.profile.domain?.trim() || "yourdomain.com";
  const canonical = page.publishedUrl ?? `https://${host}/feeds${page.slug}`;

  return (
    <div className="min-h-dvh bg-background text-foreground" style={themeStyle(theme)}>
      {/* visitor journey tracking — fires a page_view so the lead-journey timeline is real */}
      <FeedTracker slug={page.slug} pageId={page.id} title={page.title} />
      {/* schema for traditional + AI crawlers */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.schemaJson }} />

      {/* minimal public chrome */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-brand-foreground">
            <Orbit className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">{brandName}</span>
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
          <p className="mt-3 mb-6 text-[17px] leading-relaxed text-foreground/80">{page.heroCopy}</p>

          {/* branded hero — generated image if present, else a theme-matched SVG (no stock) */}
          <BrandHero
            title={page.title}
            primary={theme?.colors?.primary}
            imageUrl={page.heroImageUrl}
            imageAlt={page.heroImageAlt}
          />

          {page.sections.map((s, i) => (
            <div key={s.heading}>
              <section className="mt-8">
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">{s.heading}</h2>
                <div className="mt-2">
                  <RichText text={s.body} />
                </div>
              </section>
              {/* infographic sits after the first section, like a visual summary */}
              {i === 0 && page.infographic && <Infographic spec={page.infographic} />}
            </div>
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

          {/* type-specific call to action (label varies by page type) */}
          <section className="mt-10 rounded-2xl border border-border bg-brand/5 p-6 text-center">
            <p className="text-[16px] font-semibold text-foreground">Ready to take the next step?</p>
            <a
              href="#lead"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              {page.cta.label}
            </a>
          </section>

          <p className="mt-10 text-[11.5px] text-muted-foreground">
            Canonical: <span className="font-mono">{canonical}</span>
          </p>
        </article>

        {/* sticky lead capture */}
        <aside id="lead" className="lg:sticky lg:top-12 lg:self-start">
          <LeadForm slug={page.slug} sourceUrl={canonical} brandName={brandName} />
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-[12px] text-muted-foreground">
          <span>© {brandName}</span>
          <a href="https://developer.puter.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Powered by Puter
          </a>
        </div>
      </footer>
    </div>
  );
}
