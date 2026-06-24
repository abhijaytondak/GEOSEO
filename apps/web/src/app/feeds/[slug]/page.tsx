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
import { jsonLdSafe } from "@/lib/utils";

/** Demo deployments serve sample feed content — noindex it so crawlers never see a demo identity. */
const DEMO_MODE = process.env.NEXT_PUBLIC_GEOSEO_MODE === "demo";
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
    // In demo mode the feed serves sample/demo content — keep it out of search indexes so
    // a demo deployment never publishes a demo identity to crawlers (audit critical #1).
    ...(DEMO_MODE ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      type: "article",
      ...(page.ogImageUrl ?? page.heroImageUrl
        ? { images: [{ url: page.ogImageUrl ?? page.heroImageUrl ?? "" }] }
        : {}),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(page.schemaJson) }} />

      {/* minimal public chrome */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-brand-foreground">
            <Orbit className="size-4" strokeWidth={2.25} />
          </span>
          <span className="font-heading text-[15px] font-semibold tracking-tight text-foreground">{brandName}</span>
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
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-foreground" style={{ fontFamily: "var(--font-heading, inherit)" }}>{page.title}</h1>
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
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground" style={{ fontFamily: "var(--font-heading, inherit)" }}>{s.heading}</h2>
                <div className="mt-2">
                  <RichText text={s.body} />
                </div>
              </section>
              {/* infographic sits after the first section, like a visual summary */}
              {i === 0 && page.infographic && <Infographic spec={page.infographic} />}
            </div>
          ))}

          {/* Phase 3 structured infographics — semantic HTML, AI-crawlable, no canvas */}
          {(page.infographics?.length ?? 0) > 0 && (
            <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              {page.infographics!.map((spec, idx) => (
                <section
                  key={idx}
                  className="infographic"
                  data-kind={spec.kind}
                  style={{
                    border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    background: "var(--card, #fff)",
                    pageBreakInside: "avoid",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--muted-foreground, #6b7280)",
                      marginBottom: "1rem",
                    }}
                  >
                    {spec.title}
                  </h2>

                  {/* comparison-table */}
                  {spec.kind === "comparison-table" && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <thead>
                          <tr>
                            {spec.columns.map((col, ci) => (
                              <th
                                key={ci}
                                style={{
                                  borderBottom: "2px solid var(--border, #e5e7eb)",
                                  padding: "0.5rem 0.75rem",
                                  textAlign: "left",
                                  fontWeight: 600,
                                  color: ci === 0 ? "var(--muted-foreground, #6b7280)" : "var(--foreground, #111)",
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {spec.rows.map((row, ri) => (
                            <tr key={ri}>
                              <td
                                style={{
                                  borderBottom: "1px solid var(--border, #e5e7eb)",
                                  padding: "0.5rem 0.75rem",
                                  fontWeight: 600,
                                  color: "var(--foreground, #111)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.label}
                              </td>
                              {row.values.map((val, vi) => (
                                <td
                                  key={vi}
                                  style={{
                                    borderBottom: "1px solid var(--border, #e5e7eb)",
                                    padding: "0.5rem 0.75rem",
                                    color: "var(--muted-foreground, #6b7280)",
                                  }}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* process-flow */}
                  {spec.kind === "process-flow" && (
                    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                      {spec.steps.map((step) => (
                        <li key={step.number} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                          <span
                            style={{
                              flexShrink: 0,
                              display: "inline-flex",
                              width: "1.75rem",
                              height: "1.75rem",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: "var(--brand, #6366f1)",
                              color: "var(--brand-foreground, #fff)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                            aria-hidden="true"
                          >
                            {step.number}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground, #111)", lineHeight: 1.4 }}>
                              {step.heading}
                            </div>
                            <div style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--muted-foreground, #6b7280)", lineHeight: 1.5 }}>
                              {step.detail}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* stat-grid */}
                  {spec.kind === "stat-grid" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {spec.stats.map((stat, si) => (
                        <figure
                          key={si}
                          style={{
                            margin: 0,
                            padding: "1rem",
                            border: "1px solid var(--border, #e5e7eb)",
                            borderRadius: "0.75rem",
                            background: "var(--background, #f9fafb)",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.625rem",
                              fontWeight: 700,
                              color: "var(--brand, #6366f1)",
                              lineHeight: 1.1,
                            }}
                          >
                            {stat.value}
                          </div>
                          <figcaption
                            style={{
                              marginTop: "0.375rem",
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground, #6b7280)",
                              lineHeight: 1.4,
                            }}
                          >
                            {stat.label}
                          </figcaption>
                          {stat.note && (
                            <p
                              style={{
                                marginTop: "0.375rem",
                                fontSize: "0.6875rem",
                                color: "var(--muted-foreground, #6b7280)",
                                opacity: 0.8,
                                lineHeight: 1.4,
                              }}
                            >
                              {stat.note}
                            </p>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}

                  {/* pros-cons */}
                  {spec.kind === "pros-cons" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--foreground, #111)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Pros
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {spec.pros.map((pro, pi) => (
                            <li key={pi} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--foreground, #111)", lineHeight: 1.45 }}>
                              <span style={{ color: "var(--brand, #6366f1)", fontWeight: 700, flexShrink: 0 }}>+</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--foreground, #111)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Considerations
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {spec.cons.map((con, ci) => (
                            <li key={ci} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--muted-foreground, #6b7280)", lineHeight: 1.45 }}>
                              <span style={{ flexShrink: 0 }}>−</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* timeline */}
                  {spec.kind === "timeline" && (
                    <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                      {spec.events.map((ev, ei) => (
                        <div key={ei} style={{ display: "grid", gridTemplateColumns: "5rem 1fr", gap: "0.75rem", alignItems: "flex-start" }}>
                          <dt
                            style={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              color: "var(--brand, #6366f1)",
                              paddingTop: "0.125rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {ev.date}
                          </dt>
                          <dd style={{ margin: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground, #111)", lineHeight: 1.4 }}>
                              {ev.heading}
                            </div>
                            <div style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--muted-foreground, #6b7280)", lineHeight: 1.5 }}>
                              {ev.detail}
                            </div>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
              ))}
            </div>
          )}

          {page.faqs.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground" style={{ fontFamily: "var(--font-heading, inherit)" }}>Frequently asked questions</h2>
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
        </article>

        {/* sticky lead capture */}
        <aside id="lead" className="lg:sticky lg:top-12 lg:self-start">
          <LeadForm slug={page.slug} sourceUrl={canonical} brandName={brandName} />
        </aside>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-label text-muted-foreground">
          <span>© {new Date().getFullYear()} {brandName}</span>
        </div>
      </footer>
    </div>
  );
}
