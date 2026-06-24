import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { ProductDemo } from "./product-demo";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";

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
    };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
      <span className="size-1.5 rounded-full bg-brand" /> {children}
    </span>
  );
}

function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn(DISPLAY, "text-3xl text-foreground sm:text-4xl", className)}>{children}</h2>;
}

/* ---------------------------------------------------------------- callout */
function Callout({ b }: { b: Extract<Block, { kind: "callout" }> }) {
  return (
    <section className="border-y border-border bg-surface-sunken py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
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
        <div className={cn("mt-12 grid gap-4 md:grid-cols-2", cols)}>
          {b.items.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
                <span className="grid size-9 place-items-center rounded-xl bg-brand/10 font-mono text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")}</span>
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
              <li key={it} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-3.5" /></span>
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
    <section className="border-y border-border bg-surface-sunken py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading>{b.title}</Heading>
            {b.subtitle && <p className="mt-4 text-lg text-muted-foreground">{b.subtitle}</p>}
          </div>
        </Reveal>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {b.steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <Reveal delay={i * 0.06}>
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
                  <span className="grid size-6 place-items-center rounded-full bg-brand/10 font-mono text-xs font-semibold text-brand">{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{s}</span>
                </div>
              </Reveal>
              {i < b.steps.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />}
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
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-50" />
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
                <div className={cn(DISPLAY, "text-3xl text-white sm:text-4xl")}>{m.value}</div>
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
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        <Reveal>
          <h2 className={cn(DISPLAY, "text-center text-3xl text-foreground sm:text-4xl")}>{b.title ?? "See it in the product"}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10"><ProductDemo initialTab={b.tab} /></div>
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
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((c, i) => (
            <Reveal key={c} delay={(i % 3) * 0.05}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-4" /></span>
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
            <div className="min-w-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="grid border-b border-border bg-surface-sunken text-sm font-semibold" style={{ gridTemplateColumns: gridCols }}>
                <div className="px-3 py-3.5 sm:px-5" />
                {b.columns.map((c, i) => (
                  <div key={c} className={cn("px-2 py-3.5 text-center sm:px-4", i === hi ? "text-brand" : "text-foreground")}>{c}</div>
                ))}
              </div>
              {b.rows.map((row, ri) => (
                <div key={row.label} className={cn("grid items-center text-sm", ri % 2 ? "bg-surface-sunken/40" : "")} style={{ gridTemplateColumns: gridCols }}>
                  <div className="px-3 py-3.5 font-medium text-foreground sm:px-5">{row.label}</div>
                  {row.cells.map((cell, ci) => (
                    <div key={ci} className={cn("px-2 py-3.5 text-center sm:px-4", ci === hi ? "font-semibold text-foreground" : "text-muted-foreground")}>
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
    default:
      return null;
  }
}
