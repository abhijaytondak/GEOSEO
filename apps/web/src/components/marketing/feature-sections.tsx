import { ArrowRight, Check, Sparkles, RotateCw, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { ProductDemo } from "./product-demo";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
/** Premium card: gradient-lit border on hover + float. */
const CARD = "group relative rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float";

export type DemoTab = "brand" | "discover" | "pages" | "leads";

/** A composable, product-specific page section. Each feature page declares its own
 *  ordered list of blocks, so structure varies per product (not one fixed template). */
export type Block =
  | { kind: "callout"; eyebrow?: string; title: string; body: string }
  | { kind: "steps"; title: string; subtitle?: string; items: { title: string; body: string }[] }
  | { kind: "split"; eyebrow?: string; title: string; body: string; bullets: string[]; flip?: boolean }
  | { kind: "pipeline"; title: string; subtitle?: string; steps: string[] }
  | { kind: "stats"; title?: string; items: { value: string; label: string }[] }
  | { kind: "demo"; title?: string; tab: DemoTab }
  | { kind: "checklist"; eyebrow?: string; title: string; items: string[] }
  | {
      kind: "compare";
      title: string;
      subtitle?: string;
      columns: string[];
      rows: { label: string; cells: string[] }[];
      highlight?: number;
    }
  // ---- purpose-specific signature sections (one per product) ----
  | { kind: "answerbox"; title: string; subtitle?: string; query: string; brand: string; answer: string; cited: string[] }
  | { kind: "schema"; title: string; subtitle?: string; lines: { k: string; v: string }[]; note?: string }
  | { kind: "funnel"; title: string; subtitle?: string; stages: { label: string; value: string; pct: number }[] }
  | { kind: "flywheel"; title: string; subtitle?: string; steps: string[]; center?: string };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
      <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> {children}
    </span>
  );
}

function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn(DISPLAY, "text-3xl text-foreground sm:text-4xl", className)}>{children}</h2>;
}

/** Soft blurred glow blob for atmospheric depth. */
function Glow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

/** Gradient check chip — signature accent for bullets/capabilities. */
function GradCheck({ className }: { className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white", className)}>
      <Check className="size-3.5" />
    </span>
  );
}

/* ---------------------------------------------------------------- callout */
function Callout({ b }: { b: Extract<Block, { kind: "callout" }> }) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface-sunken py-16 sm:py-20">
      <Glow className="left-1/2 top-[-30%] h-56 w-[560px] -translate-x-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
        <Reveal>
          {b.eyebrow && <div className="mb-5 flex justify-center"><Eyebrow>{b.eyebrow}</Eyebrow></div>}
          <Heading className="text-2xl sm:text-3xl">{b.title}</Heading>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{b.body}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ steps */
function Steps({ b }: { b: Extract<Block, { kind: "steps" }> }) {
  const cols = b.items.length >= 4 ? "lg:grid-cols-4" : b.items.length === 3 ? "lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <div className={cn("mt-14 grid gap-4 md:grid-cols-2", cols)}>
          {b.items.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className={cn(CARD, "flex h-full flex-col p-5")}>
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-info font-mono text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.65)]">{String(i + 1).padStart(2, "0")}</span>
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

/* ------------------------------------------------------------------ split */
function Split({ b, index }: { b: Extract<Block, { kind: "split" }>; index: number }) {
  const flip = b.flip ?? index % 2 === 1;
  return (
    <section className={cn("py-18 sm:py-24", index % 2 === 1 ? "border-y border-border bg-surface-sunken" : "bg-background")}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2">
        <Reveal className={cn(flip && "lg:order-2")}>
          <div>
            {b.eyebrow && <div className="mb-4"><Eyebrow>{b.eyebrow}</Eyebrow></div>}
            <Heading>{b.title}</Heading>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{b.body}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className={cn(flip && "lg:order-1")}>
          <ul className="grid gap-2.5">
            {b.bullets.map((it) => (
              <li key={it} className={cn(CARD, "flex items-start gap-3 p-4 hover:translate-y-0")}>
                <GradCheck className="mt-0.5 size-6" />
                <span className="text-[15px] leading-snug text-foreground">{it}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- pipeline */
function Pipeline({ b }: { b: Extract<Block, { kind: "pipeline" }> }) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface-sunken py-20 sm:py-24">
      <Glow className="left-1/2 top-1/3 h-56 w-[620px] -translate-x-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {b.steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <Reveal delay={i * 0.06}>
                <div className={cn(CARD, "flex items-center gap-2.5 px-4 py-3 hover:translate-y-0")}>
                  <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-brand to-info font-mono text-xs font-semibold text-white">{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{s}</span>
                </div>
              </Reveal>
              {i < b.steps.length - 1 && <ArrowRight className="size-4 shrink-0 text-brand/40" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ stats */
function Stats({ b }: { b: Extract<Block, { kind: "stats" }> }) {
  return (
    <section className="relative overflow-hidden bg-foreground py-16 text-background sm:py-20">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-60" />
      <Glow className="left-1/4 top-0 h-60 w-60 bg-brand/25" />
      <Glow className="right-1/4 bottom-0 h-60 w-60 bg-info/20" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        {b.title && (
          <Reveal>
            <h2 className={cn(DISPLAY, "mb-10 text-center text-2xl text-white sm:text-3xl")}>{b.title}</h2>
          </Reveal>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {b.items.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.06}>
              <div className="text-center sm:text-left">
                <div className={cn(DISPLAY, "bg-gradient-to-br from-white to-white/60 bg-clip-text text-3xl text-transparent sm:text-4xl")}>{m.value}</div>
                <div className="mt-1.5 text-sm text-white/65">{m.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- demo */
function Demo({ b }: { b: Extract<Block, { kind: "demo" }> }) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24">
      <Glow className="left-1/2 top-1/4 h-72 w-[640px] -translate-x-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-4xl px-5 sm:px-6">
        <Reveal>
          <h2 className={cn(DISPLAY, "text-center text-3xl text-foreground sm:text-4xl")}>{b.title ?? "See it in the product"}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative mt-12">
            <Glow className="inset-x-10 -bottom-6 top-8 bg-brand/15" />
            <div className="relative"><ProductDemo initialTab={b.tab} /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- checklist */
function Checklist({ b }: { b: Extract<Block, { kind: "checklist" }> }) {
  return (
    <section className="border-t border-border bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            {b.eyebrow && <div className="mb-5 flex justify-center"><Eyebrow>{b.eyebrow}</Eyebrow></div>}
            <Heading>{b.title}</Heading>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((c, i) => (
            <Reveal key={c} delay={(i % 3) * 0.05}>
              <div className={cn(CARD, "flex items-center gap-3 p-4 hover:translate-y-0")}>
                <GradCheck className="size-7" />
                <span className="text-[15px] font-medium text-foreground">{c}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- compare */
function Compare({ b }: { b: Extract<Block, { kind: "compare" }> }) {
  const hi = b.highlight ?? 0;
  const gridCols = `1.3fr repeat(${b.columns.length}, 1fr)`;
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12 overflow-x-auto">
            <div className="min-w-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-raised">
              <div className="grid border-b border-border bg-surface-sunken text-sm font-semibold" style={{ gridTemplateColumns: gridCols }}>
                <div className="px-3 py-4 sm:px-5" />
                {b.columns.map((c, i) => (
                  <div key={c} className={cn("px-2 py-4 text-center sm:px-4", i === hi ? "bg-brand/5 text-brand" : "text-foreground")}>{c}</div>
                ))}
              </div>
              {b.rows.map((row, ri) => (
                <div key={row.label} className={cn("grid items-center text-sm", ri % 2 ? "bg-surface-sunken/40" : "")} style={{ gridTemplateColumns: gridCols }}>
                  <div className="px-3 py-3.5 font-medium text-foreground sm:px-5">{row.label}</div>
                  {row.cells.map((cell, ci) => (
                    <div key={ci} className={cn("h-full px-2 py-3.5 text-center sm:px-4", ci === hi ? "bg-brand/5 font-semibold text-foreground" : "text-muted-foreground")}>
                      <span className="inline-flex items-center justify-center gap-1">
                        {ci === hi && <Check className="size-3.5 shrink-0 text-positive" />}
                        <span>{cell}</span>
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

/* --------------------------------------------------------------- answerbox
   Signature for AI Search: a mock AI-engine answer that cites the brand. */
function AnswerBox({ b }: { b: Extract<Block, { kind: "answerbox" }> }) {
  const parts = b.answer.split(b.brand);
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24">
      <Glow className="left-1/2 top-1/4 h-72 w-[640px] -translate-x-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-float">
            <div className="flex items-center gap-2 border-b border-border bg-surface-sunken px-4 py-3">
              <Sparkles className="size-4 text-brand" />
              <span className="text-sm font-medium text-muted-foreground">AI answer</span>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex justify-end">
                <span className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-brand-foreground">{b.query}</span>
              </div>
              <div className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Sparkles className="size-4" /></span>
                <div className="rounded-2xl rounded-tl-md bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-foreground">
                  {parts[0]}
                  <span className="rounded bg-brand/15 px-1 font-semibold text-brand">{b.brand}</span>
                  {parts.slice(1).join(b.brand)}
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                    {b.cited.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs text-muted-foreground shadow-xs">
                        <span className="size-1.5 rounded-full bg-positive" /> {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ schema
   Signature for AI Feed: a JSON-LD preview that proves the machine surface. */
function Schema({ b }: { b: Extract<Block, { kind: "schema" }> }) {
  return (
    <section className="border-y border-border bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <div>
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{b.subtitle}</p>}
            {b.note && <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-positive" /> {b.note}</p>}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-border bg-foreground shadow-float">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-2.5 rounded-full bg-negative/60" />
              <span className="size-2.5 rounded-full bg-warning/60" />
              <span className="size-2.5 rounded-full bg-positive/60" />
              <span className="ml-2 font-mono text-xs text-white/50">ld+json</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-white/85">
              <span className="text-white/40">{"{"}</span>
              {"\n"}
              {b.lines.map((l) => (
                <span key={l.k}>
                  {"  "}
                  <span className="text-info">&quot;{l.k}&quot;</span>
                  <span className="text-white/40">: </span>
                  <span className="text-[#9be7a0]">&quot;{l.v}&quot;</span>
                  <span className="text-white/40">,</span>
                  {"\n"}
                </span>
              ))}
              <span className="text-white/40">{"}"}</span>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ funnel
   Signature for Leads / Lead Conversion: a visitor→qualified funnel. */
function Funnel({ b }: { b: Extract<Block, { kind: "funnel" }> }) {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <div className="mt-12 space-y-2.5">
          {b.stages.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="mx-auto" style={{ width: `${s.pct}%`, minWidth: "min(100%, 16rem)" }}>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-gradient-to-r from-brand/10 to-info/10 px-5 py-4 shadow-card">
                  <span className="text-sm font-semibold text-foreground">{s.label}</span>
                  <span className={cn(DISPLAY, "text-xl text-brand")}>{s.value}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- flywheel
   Signature for Content & Authority: the compounding loop. */
function Flywheel({ b }: { b: Extract<Block, { kind: "flywheel" }> }) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface-sunken py-20 sm:py-24">
      <Glow className="left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 bg-brand/10" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {b.steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <Reveal delay={i * 0.07}>
                <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-3 shadow-card">
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand to-info font-mono text-xs font-semibold text-white">{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{s}</span>
                </div>
              </Reveal>
              <RotateCw className={cn("size-4 shrink-0 text-brand/40", i === b.steps.length - 1 && "rotate-90")} />
            </div>
          ))}
          <Reveal delay={b.steps.length * 0.07}>
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-info px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.7)]">
              <TrendingUp className="size-4" /> {b.center ?? "Compounding authority"}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Render one block by kind. `index` drives split alternation + section backgrounds. */
export function FeatureBlock({ block, index }: { block: Block; index: number }) {
  switch (block.kind) {
    case "callout":
      return <Callout b={block} />;
    case "steps":
      return <Steps b={block} />;
    case "split":
      return <Split b={block} index={index} />;
    case "pipeline":
      return <Pipeline b={block} />;
    case "stats":
      return <Stats b={block} />;
    case "demo":
      return <Demo b={block} />;
    case "checklist":
      return <Checklist b={block} />;
    case "compare":
      return <Compare b={block} />;
    case "answerbox":
      return <AnswerBox b={block} />;
    case "schema":
      return <Schema b={block} />;
    case "funnel":
      return <Funnel b={block} />;
    case "flywheel":
      return <Flywheel b={block} />;
    default:
      return null;
  }
}
