import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Orbit } from "lucide-react";
import type { SiteThemeProfile } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { LeadForm } from "@/components/feeds/lead-form";
import { FeedTracker } from "@/components/feeds/feed-tracker";

export const dynamic = "force-dynamic";

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex?: string): Rgb | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** WCAG relative luminance (0 = black, 1 = white) — used to pick readable foregrounds. */
function relLuminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
/** Blend a→b by t (0..1), returning a hex string. */
const mix = (a: Rgb, b: Rgb, t: number) =>
  `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(a.b + (b.b - a.b) * t)}`;

/**
 * Map a confirmed Site Theme Profile onto the design-system CSS variables so the
 * published page renders in the customer's own palette, radius, and font — native
 * to their brand, not the generic GEOSEO theme (PRD §7.3). The existing Tailwind
 * classes inherit these vars, so no per-element restyling is needed.
 *
 * Surface tokens (card/muted/border) are DERIVED from the background↔foreground
 * axis so contrast holds on BOTH light and dark customer themes — a dark site
 * previously got white cards/chips/borders (unreadable). We blend toward the text
 * color by small ratios to lift surfaces just off the background.
 */
function themeStyle(t: SiteThemeProfile | null): React.CSSProperties | undefined {
  if (!t) return undefined;
  const c = t.colors ?? ({} as SiteThemeProfile["colors"]);
  const v: Record<string, string> = {};
  const bg = hexToRgb(c.background);
  const fg = hexToRgb(c.foreground);

  if (bg && fg) {
    v["--background"] = c.background!;
    v["--canvas"] = c.background!;
    v["--foreground"] = c.foreground!;
    v["--card-foreground"] = c.foreground!;
    v["--body"] = c.foreground!;
    // Lift surfaces off the background toward the text color — works dark or light.
    v["--card"] = mix(bg, fg, 0.05);
    v["--muted"] = mix(bg, fg, 0.1);
    v["--muted-foreground"] = mix(bg, fg, 0.55);
    v["--border"] = mix(bg, fg, 0.14);
    v["--border-strong"] = mix(bg, fg, 0.22);
  } else {
    // Partial palette — set whatever single tokens we have (legacy behavior).
    if (c.background) {
      v["--background"] = c.background;
      v["--canvas"] = c.background;
    }
    if (c.foreground) {
      v["--foreground"] = c.foreground;
      v["--card-foreground"] = c.foreground;
      v["--body"] = c.foreground;
    }
    if (c.border) {
      v["--border"] = c.border;
      v["--border-strong"] = c.border;
    }
  }

  if (c.primary) {
    v["--brand"] = c.primary;
    const p = hexToRgb(c.primary);
    // Readable text/icon color on brand-filled chips & buttons.
    if (p) v["--brand-foreground"] = relLuminance(p) > 0.5 ? "#0a0a0a" : "#ffffff";
  }
  if (t.layout?.radius) v["--radius"] = `${t.layout.radius}px`;
  if (t.typography?.bodyFont) v["fontFamily"] = `'${t.typography.bodyFont}', system-ui, -apple-system, sans-serif`;
  return v as React.CSSProperties;
}

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
    <div className="min-h-dvh bg-canvas" style={themeStyle(theme)}>
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
