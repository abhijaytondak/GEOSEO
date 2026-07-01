import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";
const CARD =
  "rounded-2xl border border-border bg-card p-6 shadow-card";

const DESCRIPTION =
  "An honest guide to GEO, AEO, and AI-visibility tools in 2026 — how monitoring, content optimization, and publishing tools differ, how to choose, and where each category fits. Features and pricing change; verify on each vendor's site.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Best GEO & AI Visibility Tools (2026) — Honest Comparison | ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/compare/best-geo-tools" },
  openGraph: {
    title: `Best GEO & AI Visibility Tools in 2026 — ${BRAND}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/compare/best-geo-tools`,
    siteName: BRAND,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: `Best GEO & AI Visibility Tools (2026)`, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

// Compare by CATEGORY of tool, not by named product/price — honest and durable.
// Representative tools are named in prose factually (by what they're known for),
// with no pricing and no disparagement.
type Cell = "yes" | "partial" | "no";
interface Row {
  capability: string;
  monitoring: Cell;
  optimization: Cell;
  writers: Cell;
  geoseo: Cell;
}
const ROWS: Row[] = [
  { capability: "Track brand visibility in ChatGPT / Perplexity / AI Overviews", monitoring: "yes", optimization: "no", writers: "no", geoseo: "yes" },
  { capability: "Generate answer-first, citable content", monitoring: "no", optimization: "partial", writers: "yes", geoseo: "yes" },
  { capability: "Publish straight to your CMS (WordPress / Webflow / Shopify)", monitoring: "no", optimization: "no", writers: "partial", geoseo: "yes" },
  { capability: "Traditional Google SEO (rankings, on-page, structure)", monitoring: "no", optimization: "yes", writers: "partial", geoseo: "yes" },
  { capability: "Structured data / schema for AI citation", monitoring: "no", optimization: "partial", writers: "no", geoseo: "yes" },
  { capability: "Lead capture from the pages you publish", monitoring: "no", optimization: "no", writers: "no", geoseo: "yes" },
];

const COLS: { key: keyof Omit<Row, "capability">; label: string; note: string; brand?: boolean }[] = [
  { key: "monitoring", label: "AI-visibility monitors", note: "e.g. Profound, Peec, Otterly" },
  { key: "optimization", label: "Content optimizers", note: "e.g. Surfer, Clearscope" },
  { key: "writers", label: "AI writers", note: "e.g. Writesonic, Scalenut" },
  { key: "geoseo", label: BRAND, note: "monitor → create → publish → track", brand: true },
];

function CellMark({ v }: { v: Cell }) {
  if (v === "yes") return <span className="mx-auto grid size-5 place-items-center rounded-full bg-positive/15 text-positive"><Check className="size-3.5" /></span>;
  if (v === "partial") return <span className="mx-auto block text-center text-[11px] font-semibold uppercase tracking-wide text-warning">Partial</span>;
  return <span className="mx-auto grid size-5 place-items-center rounded-full bg-muted text-muted-foreground"><Minus className="size-3.5" /></span>;
}

const CRITERIA = [
  { h: "Monitoring or action?", b: "Some tools only tell you where you're invisible in AI answers. Others create and publish the content that fixes it. Decide whether you need reporting, execution, or both." },
  { h: "Engine coverage", b: "Check which answer engines a tool tracks — ChatGPT, Perplexity, Google AI Overviews, Gemini — and whether that matches where your buyers actually ask." },
  { h: "Does it publish?", b: "Reports don't move rankings. If a tool can't publish to your CMS, you still need a separate content and publishing workflow." },
  { h: "AI search AND Google?", b: "GEO is additive, not a replacement — you still need traditional SEO. Tools that do only one leave a gap you'll fill with another subscription." },
  { h: "Fits your stack", b: "Confirm it connects to where your site actually lives (WordPress, Webflow, Shopify) rather than exporting files you paste by hand." },
];

const FAQS = [
  { q: "What's the difference between GEO, AEO, and AI-visibility tools?", a: "In practice the terms are used interchangeably in 2026. GEO (generative engine optimization) and AEO (answer engine optimization) both mean making your content easy for AI answer engines to cite; \"AI-visibility\" tools usually refer to the monitoring side — tracking where your brand shows up in those answers." },
  { q: "Do I need a separate tool for monitoring versus publishing?", a: "Often, yes — most tools specialize. Monitoring tools track your AI visibility but don't create or publish content; content optimizers and writers help you produce it but don't track AI citations. A full-loop tool combines both so you don't stitch subscriptions together." },
  { q: "Which tools track ChatGPT, Perplexity, and Google AI Overviews?", a: "Dedicated AI-visibility monitors (such as Profound, Peec, and Otterly) focus on this, and some broader platforms include it. Coverage and engines change frequently, so confirm the current list on each vendor's site before buying." },
  { q: "Is GEO replacing traditional SEO?", a: "No. AI answers increasingly sit between a question and your site, but Google search still drives significant traffic. The durable strategy is to do both — which is why tools that only optimize for Google, or only track AI, leave a gap." },
  { q: "Where does GEOSEO fit?", a: "GEOSEO is built to close the full loop: track AI visibility, generate answer-first content grounded in your real brand facts, publish it to your CMS, and rank in Google too. We're early-stage and honest about it — the differentiator is that the publishing is real and demonstrable, not a roadmap promise." },
];

export default function BestGeoToolsPage() {
  const url = `${SITE_URL}/compare/best-geo-tools`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: "The Best GEO & AI Visibility Tools in 2026 (Honestly Compared)",
        description: DESCRIPTION,
        url,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        author: { "@id": `${SITE_URL}/#org` },
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/compare/best-geo-tools` },
          { "@type": "ListItem", position: 3, name: "Best GEO tools", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <span aria-hidden className="mx-1.5">›</span>
              <span className="text-foreground">Best GEO tools</span>
            </nav>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <span className="size-1.5 rounded-full bg-brand" /> Buyer&apos;s guide · 2026
            </span>
            <h1 className={cn(DISPLAY, "mt-5 text-4xl leading-[1.05] text-foreground sm:text-5xl")}>
              The best GEO &amp; AI visibility tools, <span className={GRAD}>honestly compared.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              GEO, AEO, AI-visibility — the labels blur together, and so do the tools. This guide cuts through it:
              what each category actually does, how to choose, and where the gaps are. No pricing games, no fake
              scores — just an honest map of the market.
            </p>
          </Reveal>
        </div>
      </section>

      {/* what are these tools */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>What are GEO / AEO tools?</h2>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                GEO (generative engine optimization) and AEO (answer engine optimization) tools help your brand get
                found and cited by AI answer engines like ChatGPT, Perplexity, and Google AI Overviews — the layer
                that increasingly sits between a buyer&apos;s question and your website. In practice the market splits
                into a few categories, and most tools do one of them well.
              </p>
              <p>
                The distinction that matters most: <strong>monitoring</strong> (telling you where you appear in AI
                answers) versus <strong>action</strong> (creating and publishing the content that earns those
                citations). Knowing which you need is the fastest way to shortlist.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* comparison table */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>Tool categories at a glance</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Compared by capability, not price. Representative tools are named as examples of each category.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border shadow-card">
              <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="bg-surface-sunken">
                    <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Capability</th>
                    {COLS.map((c) => (
                      <th key={c.key} scope="col" className={cn("px-3 py-3 text-center font-semibold", c.brand ? "text-brand" : "text-foreground")}>
                        <div>{c.label}</div>
                        <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">{c.note}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.capability} className="border-t border-border">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">{r.capability}</th>
                      {COLS.map((c) => (
                        <td key={c.key} className={cn("px-3 py-3", c.brand && "bg-brand/[0.04]")}>
                          <CellMark v={r[c.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Categories are generalizations and individual products vary. Features and pricing change frequently —
              always verify the current capabilities on each vendor&apos;s own site before buying.
            </p>
          </Reveal>
        </div>
      </section>

      {/* how to choose */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>How to choose: 5 questions</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {CRITERIA.map((c, i) => (
              <Reveal key={c.h} delay={Math.min(i * 0.05, 0.2)}>
                <div className={cn(CARD, "h-full")}>
                  <div className="font-semibold text-foreground">{c.h}</div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{c.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* where GEOSEO fits */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <div className={cn(CARD, "border-brand/30 ring-1 ring-brand/15")}>
              <h2 className={cn(DISPLAY, "text-2xl text-foreground")}>Where {BRAND} fits</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Most tools sit in one column of the table above. {BRAND} is built to close the full loop: track your
                AI visibility, generate answer-first content grounded in your real brand facts, <strong>publish it to
                your CMS</strong> (WordPress, Webflow, or Shopify), and cover traditional Google SEO too.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                We&apos;re honest about our stage: {BRAND} is early, with no logo wall to show off. The differentiator
                isn&apos;t a claim — the publishing integrations are real and demonstrable, which is exactly what
                monitoring-only tools can&apos;t do. If reporting is all you need, a specialized monitor may fit
                better; if you want to <em>act</em> on the data, that&apos;s what we built.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-positive/10 px-3 py-1.5 text-sm font-medium text-positive">
                <ShieldCheck className="size-4" /> See it on your own site — start with a free AI-visibility audit.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/#audit" className="ease-expo inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110">
                  Get your free audit <ArrowRight className="size-4" />
                </Link>
                <Link href="/integrations" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  See the integrations
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>FAQ</h2>
          </Reveal>
          <dl className="mt-6 space-y-4">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 0.04, 0.16)}>
                <div className={CARD}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
