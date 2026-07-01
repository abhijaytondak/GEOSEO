import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { Faq } from "@/components/marketing/faq";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";

const DESCRIPTION =
  "Citensity pricing — founding-customer plans for getting cited by AI engines, ranking in Google, and capturing the leads. Start with a free AI-visibility audit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Pricing — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { title: `Pricing — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/pricing`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

interface Tier {
  name: string;
  tagline: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    tagline: "Get cited, fast.",
    cta: "Start free audit",
    href: "/#audit",
    features: [
      "Brand Memory — your grounded source of truth",
      "Page Engine — generate & publish optimized pages",
      "AI Feed — JSON-LD + llms.txt on every page",
      "1 site · managed subdirectory publishing",
      "Search ranking + AI-citation tracking",
    ],
  },
  {
    name: "Growth",
    tagline: "Turn visibility into pipeline.",
    cta: "Start free audit",
    href: "/#audit",
    featured: true,
    features: [
      "Everything in Starter",
      "Leads — capture, score & route inbound",
      "AI follow-up drafts + CRM sync",
      "Native publishing (WordPress, Webflow, Shopify)",
      "Higher page volume + content refreshes",
      "Competitor & backlink intelligence",
    ],
  },
  {
    name: "Scale",
    tagline: "For teams going all-in on GEO.",
    cta: "Book a demo",
    href: "/demo",
    features: [
      "Everything in Growth",
      "Multiple sites & workspaces",
      "Priority generation + higher limits",
      "Advanced analytics & ROI attribution",
      "Dedicated onboarding + support",
      "Custom integrations",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
                <Sparkles className="size-3.5" /> Founding-customer pricing
              </span>
              <h1 className={cn(DISPLAY, "mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl")}>
                Pricing that scales with <span className={GRAD}>your visibility.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                We&apos;re onboarding founding customers at preferential rates — your plan is tailored during onboarding.
                Every plan starts with a free AI-visibility audit, no credit card.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-3">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <div
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float",
                    t.featured ? "border-brand/40 ring-1 ring-brand/20" : "border-border",
                  )}
                >
                  {t.featured && (
                    <>
                      <div aria-hidden className="pointer-events-none absolute right-[-12%] top-[-18%] size-48 rounded-full bg-brand/10 blur-3xl" />
                      <span className="absolute right-5 top-5 rounded-full bg-gradient-to-br from-brand to-info px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_6px_16px_-8px_rgba(108,76,241,0.7)]">Most popular</span>
                    </>
                  )}
                  <h2 className={cn(DISPLAY, "relative text-xl text-foreground")}>{t.name}</h2>
                  <p className="relative mt-1 text-[15px] text-muted-foreground">{t.tagline}</p>
                  <Link
                    href={t.href}
                    className={cn(
                      "ease-expo relative mt-6 inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5",
                      t.featured
                        ? "bg-gradient-to-br from-brand to-info text-brand-foreground shadow-[0_8px_22px_-8px_rgba(108,76,241,0.7)] hover:brightness-110"
                        : "border border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {t.cta} <ArrowRight className="size-4" />
                  </Link>
                  <ul className="relative mt-7 space-y-3 border-t border-border pt-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] text-foreground">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Check className="size-3" /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Not sure which plan fits? <Link href="/demo" className="font-semibold text-brand hover:underline">Book a demo</Link> and we&apos;ll map it to your goals.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
                <span className="size-1.5 rounded-full bg-brand" /> Questions
              </span>
              <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Pricing &amp; product FAQ.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}><Faq /></Reveal>
        </div>
      </section>
    </>
  );
}
