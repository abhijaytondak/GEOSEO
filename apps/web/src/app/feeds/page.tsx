import type { Metadata } from "next";
import Link from "next/link";
import { Orbit, ArrowUpRight, FileText, Sparkles } from "lucide-react";
import type { GeneratedPage, SiteThemeProfile } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { themeStyle } from "@/lib/feed-theme";

/**
 * AI Feed — the dedicated, AI-optimized content section. A browsable library of
 * every published page, each targeting a specific buyer question, structured so
 * AI agents (ChatGPT / Claude / Gemini / Perplexity) can find, parse, and cite
 * them. Complements the per-page /feeds/[slug] renderer, sitemap.xml, and llms.txt.
 */
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  guide: "Guides & articles",
  service: "Service pages",
  landing: "Landing pages",
  comparison: "Comparisons",
  faq: "FAQs",
  resource: "Resources",
  local: "Local pages",
};

export async function generateMetadata(): Promise<Metadata> {
  const memory = await api.getBrandMemory().catch(() => null);
  const brand = memory?.profile.company?.trim() || "Your Brand";
  return {
    title: `${brand} · AI Feed`,
    description: `AI-optimized content from ${brand} — answers built for AI agents and human visitors. Structured, citation-ready pages for AI search.`,
    robots: { index: true, follow: true },
  };
}

export default async function AiFeedIndex() {
  const [pub, memory, themes] = await Promise.all([
    pageEngineApi.getPublishedPages().catch(() => ({ pages: [] as GeneratedPage[] })),
    api.getBrandMemory().catch(() => null),
    api.getSiteThemes().catch(() => [] as SiteThemeProfile[]),
  ]);
  const pages: GeneratedPage[] = Array.isArray(pub) ? pub : (pub?.pages ?? []);

  const theme = themes.find((t) => t.status === "confirmed") ?? themes[0] ?? null;
  const brandName = memory?.profile.company?.trim() || "Your Brand";
  const host = memory?.profile.domain?.trim() || "yourdomain.com";

  // Group by page type so the library reads as a structured directory.
  const groups = new Map<string, GeneratedPage[]>();
  for (const p of pages) {
    const k = p.pageType || "resource";
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(p);
  }

  // CollectionPage + ItemList JSON-LD — lets an AI agent ingest the whole feed in one parse.
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brandName} — AI Feed`,
    description: `AI-optimized content built for AI agents and human visitors.`,
    url: `https://${host}/feeds`,
    hasPart: {
      "@type": "ItemList",
      numberOfItems: pages.length,
      itemListElement: pages.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: p.publishedUrl ?? `https://${host}/feeds${p.slug}`,
        name: p.metaTitle || p.title,
      })),
    },
  };

  return (
    <div className="min-h-dvh bg-background text-foreground" style={themeStyle(theme)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-brand-foreground">
            <Orbit className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">{brandName}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            <Sparkles className="size-3" /> AI Feed
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* hero */}
        <section className="max-w-2xl">
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-foreground sm:text-[36px]">AI Feed</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            AI-optimized content from <span className="font-medium text-foreground">{brandName}</span>, built for AI
            agents <span className="font-medium text-foreground">and</span> human visitors. Each page answers a specific
            question buyers ask on ChatGPT, Claude, Gemini, and Perplexity — structured, citation-ready, and updated as
            AI search evolves.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
            <a href="/llms.txt" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted">
              llms.txt <ArrowUpRight className="size-3.5" />
            </a>
            <a href="/sitemap.xml" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted">
              sitemap.xml <ArrowUpRight className="size-3.5" />
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
              {pages.length} {pages.length === 1 ? "page" : "pages"} published
            </span>
          </div>
        </section>

        {/* library */}
        {pages.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border py-16 text-center">
            <FileText className="mx-auto mb-3 size-7 text-muted-foreground opacity-60" />
            <p className="text-[14px] font-semibold text-foreground">No published pages yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Published AI-optimized pages will appear here.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {[...groups.entries()].map(([type, items]) => (
              <section key={type}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    {TYPE_LABEL[type] ?? type}
                  </h2>
                  <span className="text-[12px] text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/feeds${p.slug}`}
                        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[14.5px] font-semibold leading-snug text-foreground group-hover:text-brand">
                            {p.title}
                          </h3>
                          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                        </div>
                        {p.metaDescription && (
                          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                            {p.metaDescription}
                          </p>
                        )}
                        <span className="mt-3 truncate text-[11.5px] text-muted-foreground/80">{`/feeds${p.slug}`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-label text-muted-foreground">
          © {new Date().getFullYear()} {brandName} · built for AI agents and humans
        </div>
      </footer>
    </div>
  );
}
