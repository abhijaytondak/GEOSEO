import Link from "next/link";
import { ArrowRight, Check, X, Sparkles, Search, Bot, MessageSquareText } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { AuditForm } from "./audit-form";
import { ProductDemo } from "./product-demo";
import { ENGINES, STEPS, FEATURES, METRICS, COMPARE } from "./data";

/** Marketing display face (Bricolage Grotesque var set on the (marketing) layout). */
const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]", dark ? "border-white/15 bg-white/5 text-white/70" : "border-border bg-card text-brand")}>
      <span className="size-1.5 rounded-full bg-brand" /> {children}
    </span>
  );
}

/* ----------------------------------------------------------------- HERO */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
      <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-28 text-center sm:px-6 sm:pt-36">
        <Reveal>
          <Eyebrow>Generative Engine Optimization</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className={cn(DISPLAY, "mt-6 text-5xl leading-[1.04] text-foreground sm:text-6xl md:text-7xl")}>
            Be the answer buyers find — in Google <span className="text-brand">and AI.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            GEOSEO learns your brand, then continuously creates and publishes pages engineered to rank in Google and get
            cited by ChatGPT, Perplexity, and AI Overviews — so qualified leads find you first.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div id="audit" className="mx-auto mt-9 max-w-md scroll-mt-24 text-left">
            <AuditForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- ENGINES STRIP */
export function EnginesStrip() {
  return (
    <section className="border-y border-border bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Engineered to get you cited across
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {ENGINES.map((e) => (
            <span key={e} className="text-base font-semibold tracking-tight text-foreground/70">{e}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ PROBLEM */
export function Problem() {
  const cards = [
    { icon: MessageSquareText, title: "Buyers ask AI first", body: "Your next customer is asking ChatGPT and Perplexity before they ever open a search results page." },
    { icon: Search, title: "Ten blue links → one answer", body: "AI Overviews collapse the page into a single cited answer. Ranking #4 no longer wins the click." },
    { icon: Bot, title: "Not the source = invisible", body: "If the engine doesn't cite you, you don't exist in the conversation — no matter how good your product is." },
  ];
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>The shift</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Search moved to the answer box.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Traditional SEO optimizes for a results page buyers increasingly skip. Winning now means being the cited source.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><c.icon className="size-5" /></span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- HOW IT WORKS */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-surface-sunken py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>One engine, from your site to cited.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Five steps that run continuously — not a one-off report.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-5 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand"><s.icon className="size-5" /></span>
                  <span className="font-mono text-sm font-semibold text-muted-foreground/60">{s.n}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ PRODUCT */
export function ProductSection() {
  return (
    <section id="product" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>The product</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>See your whole growth engine in one place.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Brand Memory, demand, pages, and leads — every stage of the pipeline, live.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-4xl">
            <ProductDemo />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ FEATURES */
export function FeatureGrid() {
  return (
    <section className="border-t border-border bg-surface-sunken py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Everything you need to win the answer.</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-raised">
                <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><f.icon className="size-5" /></span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- METRICS BAND */
export function MetricsBand() {
  return (
    <section className="relative overflow-hidden bg-foreground py-16 text-background sm:py-20">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {METRICS.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06}>
            <div className="text-center sm:text-left">
              <div className={cn(DISPLAY, "text-3xl text-white sm:text-4xl")}>{m.value}</div>
              <div className="mt-1.5 text-sm text-white/65">{m.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- COMPARISON */
export function Comparison() {
  const cols = [
    { key: "geoseo" as const, label: "GEOSEO", accent: true },
    { key: "agency" as const, label: "SEO agency", accent: false },
    { key: "diy" as const, label: "DIY tools", accent: false },
  ];
  return (
    <section id="why" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Why GEOSEO</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Built for the way buyers search now.</h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {/* header row */}
            <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-border bg-surface-sunken text-sm font-semibold">
              <div className="px-3 py-3.5 text-muted-foreground sm:px-5" />
              {cols.map((c) => (
                <div key={c.key} className={cn("px-2 py-3.5 text-center sm:px-4", c.accent ? "text-brand" : "text-foreground")}>{c.label}</div>
              ))}
            </div>
            {COMPARE.map((row, ri) => (
              <div key={row.label} className={cn("grid grid-cols-[1.4fr_repeat(3,1fr)] items-center text-sm", ri % 2 ? "bg-surface-sunken/40" : "")}>
                <div className="px-3 py-3.5 font-medium text-foreground sm:px-5">{row.label}</div>
                {cols.map((c) => (
                  <div key={c.key} className={cn("px-2 py-3.5 text-center sm:px-4", c.accent ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    <span className="inline-flex items-center justify-center gap-1">
                      {c.accent ? <Check className="size-3.5 shrink-0 text-positive" /> : <X className="size-3.5 shrink-0 text-muted-foreground/50" />}
                      <span>{row[c.key]}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- PROOF */
export function ProofBand() {
  const points = ["Structured data on every page", "Entity & topic coverage by design", "Cited-ready, answer-shaped content", "Dogfooded — this site runs on GEOSEO"];
  return (
    <section className="border-y border-border bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>Built on method, not hype</Eyebrow>
              <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Proof you can inspect.</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We&apos;re onboarding our founding customers now. Until those case studies are public, here&apos;s the
                honest proof: the GEO methodology this engine is built on — and the fact that this very site is created
                and optimized with GEOSEO.
              </p>
              <Link href="#audit" className="ease-expo mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110">
                Become a founding customer <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="grid gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-4" /></span>
                  <span className="text-[15px] font-medium text-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ CTA BAND */
export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-28">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
              <Sparkles className="size-3.5 text-brand" /> Free AI-visibility audit
            </span>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-white sm:text-4xl md:text-5xl")}>
              See where AI engines find you — and where they don&apos;t.
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/70">
              Drop in your website and we&apos;ll show you what to fix first to start getting cited and capturing leads.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <AuditForm tone="dark" />
        </Reveal>
      </div>
    </section>
  );
}
