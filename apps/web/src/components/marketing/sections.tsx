import Link from "next/link";
import { ArrowRight, Check, X, Sparkles, Search, Bot, MessageSquareText, Clock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { AuditForm } from "./audit-form";
import { ProductDemo } from "./product-demo";
import { ENGINES, STEPS, METRICS, COMPARE } from "./data";
import { PLATFORM, SOLUTIONS, featureHref } from "./platform-data";

/** Marketing display face (Bricolage Grotesque var set on the (marketing) layout). */
const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
/** Brand→blue gradient text for headline accents. */
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";
/** Premium card: gradient-lit border on hover + float. */
const CARD = "group relative rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float";

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]", dark ? "border-white/15 bg-white/5 text-white/75" : "border-border bg-card text-brand shadow-xs")}>
      <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> {children}
    </span>
  );
}

/** Gradient icon tile — the signature accent across cards. */
function GlowIcon({ icon: Icon, className }: { icon: typeof Sparkles; className?: string }) {
  return (
    <span className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-info text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.65)]", className)}>
      <Icon className="size-5" />
    </span>
  );
}

/** Soft blurred glow blob for atmospheric depth. */
function Glow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

/* ----------------------------------------------------------------- HERO */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
      <Glow className="left-1/2 top-[-10%] h-[420px] w-[680px] -translate-x-1/2 bg-brand/15" />
      <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-28 text-center sm:px-6 sm:pt-36">
        <Reveal>
          <Eyebrow>Generative Engine Optimization</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className={cn(DISPLAY, "mx-auto mt-7 max-w-[14ch] text-5xl leading-[1.03] text-foreground sm:text-6xl md:text-[4.5rem]")}>
            Be the answer buyers find — in Google <span className={GRAD}>and AI.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Citensity learns your brand, then continuously creates and publishes pages engineered to rank in Google and get
            cited by ChatGPT, Perplexity, and AI Overviews — so qualified leads find you first.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div id="audit" className="relative mx-auto mt-10 max-w-md scroll-mt-24 text-left">
            <Glow className="inset-x-6 -bottom-6 top-2 bg-brand/15" />
            <div className="relative rounded-3xl border border-border bg-card/70 p-1.5 shadow-float backdrop-blur-sm">
              <AuditForm />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 text-sm text-muted-foreground">
            Free AI-visibility audit · public pages only · no credit card
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- ENGINES STRIP */
export function EnginesStrip() {
  return (
    <section className="border-y border-border bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Engineered to get you cited across
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
          {ENGINES.map((e) => (
            <span key={e} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold tracking-tight text-foreground/75 shadow-xs">
              {e}
            </span>
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
    <section className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>The shift</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Search moved to the <span className={GRAD}>answer box.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Traditional SEO optimizes for a results page buyers increasingly skip. Winning now means being the cited source.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className={cn(CARD, "h-full p-6")}>
                <GlowIcon icon={c.icon} />
                <h3 className="mt-5 text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ PLATFORM GRID */
export function PlatformGrid() {
  return (
    <section id="platform" className="relative scroll-mt-20 overflow-hidden border-t border-border bg-surface-sunken py-20 sm:py-28">
      <Glow className="left-[-8%] top-1/3 h-72 w-72 bg-brand/10" />
      <Glow className="right-[-8%] top-10 h-72 w-72 bg-info/10" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>The platform</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Six engines. <span className={GRAD}>One workflow.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Each does real work — from learning your brand to capturing the lead. Explore any piece.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3 sm:grid-cols-2">
          {PLATFORM.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.06}>
              <Link href={featureHref(p)} className={cn(CARD, "flex h-full flex-col p-6")}>
                <GlowIcon icon={p.icon} />
                <h3 className="mt-5 text-lg font-semibold text-foreground">{p.label}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{p.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
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
    <section id="how-it-works" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>One engine, from your site to <span className={GRAD}>cited.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Five steps that run continuously — not a one-off report.</p>
          </div>
        </Reveal>
        <div className="relative mt-14">
          {/* connecting gradient line (desktop) */}
          <div aria-hidden className="absolute inset-x-[10%] top-[34px] hidden h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:block" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <div className={cn(CARD, "flex h-full flex-col p-5")}>
                  <div className="flex items-center justify-between">
                    <GlowIcon icon={s.icon} className="size-10" />
                    <span className="font-mono text-sm font-semibold text-muted-foreground/50">{s.n}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ PRODUCT */
export function ProductSection() {
  return (
    <section id="product" className="relative scroll-mt-20 overflow-hidden border-t border-border bg-surface-sunken py-20 sm:py-28">
      <Glow className="left-1/2 top-1/4 h-80 w-[700px] -translate-x-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>The product</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Your whole growth engine, <span className={GRAD}>in one place.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Brand Memory, demand, pages, and leads — every stage of the pipeline, live.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-14 max-w-4xl">
            <Glow className="inset-x-10 -bottom-6 top-8 bg-brand/15" />
            <div className="relative">
              <ProductDemo />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- SOLUTIONS ROW */
export function SolutionsRow() {
  return (
    <section id="solutions" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Solutions</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Built around <span className={GRAD}>your outcome.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Whether you want AI citations, more conversations, or both — start from the goal.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {SOLUTIONS.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.08}>
              <Link href={featureHref(s)} className={cn(CARD, "flex h-full flex-col p-6")}>
                <div className="flex items-center gap-2">
                  <GlowIcon icon={s.icon} />
                  {s.comingSoon && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-warning">
                      <Clock className="size-3" /> Soon
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{s.label}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{s.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">{s.comingSoon ? "Join the waitlist" : "Explore"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
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
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-60" />
      <Glow className="left-1/4 top-0 h-64 w-64 bg-brand/25" />
      <Glow className="right-1/4 bottom-0 h-64 w-64 bg-info/20" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {METRICS.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06}>
            <div className="text-center sm:text-left">
              <div className={cn(DISPLAY, "bg-gradient-to-br from-white to-white/60 bg-clip-text text-3xl text-transparent sm:text-4xl")}>{m.value}</div>
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
    { key: "geoseo" as const, label: "Citensity", accent: true },
    { key: "agency" as const, label: "SEO agency", accent: false },
    { key: "diy" as const, label: "DIY tools", accent: false },
  ];
  return (
    <section id="why" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Why Citensity</Eyebrow>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Built for the way buyers <span className={GRAD}>search now.</span></h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-14 overflow-x-auto">
            <div className="min-w-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-raised">
              <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-border bg-surface-sunken text-sm font-semibold">
                <div className="px-3 py-4 sm:px-5" />
                {cols.map((c) => (
                  <div key={c.key} className={cn("px-2 py-4 text-center sm:px-4", c.accent ? "bg-brand/5 text-brand" : "text-foreground")}>{c.label}</div>
                ))}
              </div>
              {COMPARE.map((row, ri) => (
                <div key={row.label} className={cn("grid grid-cols-[1.4fr_repeat(3,1fr)] items-center text-sm", ri % 2 ? "bg-surface-sunken/40" : "")}>
                  <div className="px-3 py-3.5 font-medium text-foreground sm:px-5">{row.label}</div>
                  {cols.map((c) => (
                    <div key={c.key} className={cn("h-full px-2 py-3.5 text-center sm:px-4", c.accent ? "bg-brand/5 font-semibold text-foreground" : "text-muted-foreground")}>
                      <span className="inline-flex items-center justify-center gap-1">
                        {c.accent ? <Check className="size-3.5 shrink-0 text-positive" /> : <X className="size-3.5 shrink-0 text-muted-foreground/40" />}
                        <span>{row[c.key]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- PROOF */
export function ProofBand() {
  const points = ["Structured data on every page", "Entity & topic coverage by design", "Cited-ready, answer-shaped content", "Dogfooded — this site runs on Citensity"];
  return (
    <section className="border-y border-border bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>Built on method, not hype</Eyebrow>
              <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Proof you can <span className={GRAD}>inspect.</span></h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We&apos;re onboarding our founding customers now. Until those case studies are public, here&apos;s the
                honest proof: the GEO methodology this engine is built on — and the fact that this very site is created
                and optimized with Citensity.
              </p>
              <Link href="#audit" className="ease-expo mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110">
                Become a founding customer <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="grid gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Check className="size-4" /></span>
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
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-70" />
      <Glow className="left-1/3 top-[-20%] h-80 w-80 bg-brand/25" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-white/75">
              <Sparkles className="size-3.5 text-brand" /> Free AI-visibility audit
            </span>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-white sm:text-4xl md:text-5xl")}>
              See where AI engines find you — <span className="bg-gradient-to-r from-white to-white/55 bg-clip-text text-transparent">and where they don&apos;t.</span>
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
