import Link from "next/link";
import { ArrowRight, Sparkles, Check, TrendingUp, Bot } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { ENGINES } from "./data";
import { PLATFORM, featureHref } from "./platform-data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";

function Glow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

/** Bento cell — rounded-XL app surface with depth + hover lift. */
function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float sm:p-6", className)}>
      {children}
    </div>
  );
}

/* ---- app-UI mini cards that populate bento cells (the "card ui" showcase) ---- */

function MiniAnswer() {
  return (
    <div className="rounded-2xl border border-border bg-surface-sunken p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5 text-brand" /> AI answer</div>
      <div className="mt-2.5 flex justify-end">
        <span className="rounded-xl rounded-br-sm bg-brand px-3 py-1.5 text-xs text-brand-foreground">Best analytics tool?</span>
      </div>
      <div className="mt-2 flex gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Sparkles className="size-3" /></span>
        <p className="rounded-xl rounded-tl-sm bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-xs">
          <span className="rounded bg-brand/15 px-1 font-semibold text-brand">your brand</span> is a top pick for product teams.
        </p>
      </div>
    </div>
  );
}

function MiniLead() {
  const leads = [
    { n: "PN", c: "Northvale", s: 84 },
    { n: "ML", c: "Upcurve", s: 72 },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface-sunken p-3.5">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Captured leads</span>
        <span className="inline-flex items-center gap-1 text-positive"><TrendingUp className="size-3" /> scored</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {leads.map((l) => (
          <div key={l.n} className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 shadow-xs">
            <span className="grid size-6 place-items-center rounded-full bg-brand/10 text-[10px] font-semibold text-brand">{l.n}</span>
            <span className="flex-1 truncate text-xs text-foreground">{l.c}</span>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", l.s >= 80 ? "bg-positive/12 text-positive" : "bg-warning/12 text-warning")}>{l.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- BENTO SHOWCASE
   Sits BELOW the hero — an app-UI card mosaic that makes the product tangible. */
export function BentoShowcase() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28">
      <Glow className="left-[-6%] top-1/4 h-72 w-72 bg-brand/10" />
      <Glow className="right-[-6%] bottom-10 h-72 w-72 bg-info/10" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> The product, at a glance
            </span>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>One engine, from <span className={GRAD}>cited to closed.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Get cited by AI, publish in minutes, and capture the leads it earns — all in one place.</p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-3.5 lg:grid-cols-3 lg:auto-rows-min">
          {/* live AI answer — tall */}
          <Reveal className="lg:row-span-2">
            <Cell className="flex h-full flex-col justify-center">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">When a buyer asks AI</div>
              <div className="mt-3"><MiniAnswer /></div>
              <p className="mt-3 text-sm text-muted-foreground">You&apos;re the brand it names — with your own pages cited as the source.</p>
            </Cell>
          </Reveal>

          {/* traffic -> pipeline — wide */}
          <Reveal delay={0.08} className="lg:col-span-2">
            <Cell className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className={cn(DISPLAY, "text-3xl text-foreground")}>Traffic → <span className={GRAD}>pipeline</span></div>
                <p className="mt-1.5 text-sm text-muted-foreground">Every page captures, scores, and routes the leads it earns — automatically.</p>
              </div>
              <div className="w-full sm:w-64"><MiniLead /></div>
            </Cell>
          </Reveal>

          {/* engines proof */}
          <Reveal delay={0.14}>
            <Cell className="flex h-full flex-col">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Get cited across</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ENGINES.map((e) => (
                  <span key={e} className="rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-foreground/75">{e}</span>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <Bot className="size-4 text-brand" /> Tracked across every major engine
              </div>
            </Cell>
          </Reveal>

          {/* minutes metric */}
          <Reveal delay={0.18}>
            <Cell className="flex h-full flex-col justify-center">
              <div className={cn(DISPLAY, "bg-gradient-to-br from-brand to-info bg-clip-text text-4xl text-transparent")}>Minutes</div>
              <div className="mt-1.5 text-sm text-muted-foreground">From a topic to a published, optimized page — with schema, sitemap &amp; llms.txt.</div>
              <Link href="#how-it-works" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">See how <ArrowRight className="size-4" /></Link>
            </Cell>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- BENTO PLATFORM */
export function BentoPlatform() {
  return (
    <section id="platform" className="relative scroll-mt-20 overflow-hidden border-t border-border bg-surface-sunken py-20 sm:py-28">
      <Glow className="left-[-8%] top-1/3 h-72 w-72 bg-brand/10" />
      <Glow className="right-[-8%] top-10 h-72 w-72 bg-info/10" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> The platform
            </span>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>Six engines. <span className={GRAD}>One workflow.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">Each does real work — from learning your brand to capturing the lead.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.06} className={cn(i === 0 && "sm:col-span-2")}>
              <Link href={featureHref(p)} className={cn("group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float", i === 0 && "sm:flex-row sm:items-center sm:gap-6")}>
                {i === 0 && <Glow className="right-[-6%] top-[-20%] h-48 w-48 bg-brand/10" />}
                <div className={cn(i === 0 && "sm:flex-1")}>
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-info text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.65)] transition-transform duration-300 group-hover:scale-110">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className={cn("mt-4 font-semibold text-foreground", i === 0 ? "text-xl" : "text-lg")}>{p.label}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
                {i === 0 && (
                  <div className="mt-5 w-full sm:mt-0 sm:w-72">
                    <div className="rounded-2xl border border-border bg-surface-sunken p-3.5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memory strength</div>
                      <div className="mt-1 flex items-end gap-2"><span className={cn(DISPLAY, "text-3xl text-foreground tabular-nums")}>92%</span><span className="mb-1 text-xs text-positive">Excellent</span></div>
                      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-brand to-info" style={{ width: "92%" }} /></div>
                      <div className="mt-3 space-y-1.5">
                        {["Brand & value prop", "Products & personas", "Proof points"].map((r) => (
                          <div key={r} className="flex items-center gap-2 text-xs text-foreground"><span className="grid size-4 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-2.5" /></span>{r}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
