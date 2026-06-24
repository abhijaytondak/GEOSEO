import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { AuditForm } from "./audit-form";
import { FeatureBlock } from "./feature-sections";
import { type FeaturePageData, resolveRelated, featureHref } from "./platform-data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const CARD = "group relative rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float";

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]", dark ? "border-white/15 bg-white/5 text-white/75" : "border-border bg-card text-brand shadow-xs")}>
      <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> {children}
    </span>
  );
}

function Glow({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />;
}

/** Shared template for every Platform / Solution page — data-driven, statically prerendered. */
export function FeaturePage({ data }: { data: FeaturePageData }) {
  const related = data.related.map(resolveRelated).filter(Boolean) as FeaturePageData[];
  const ctaHref = "/#audit";

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <Glow className="left-1/2 top-[-10%] h-[380px] w-[620px] -translate-x-1/2 bg-brand/15" />
        <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-28 text-center sm:px-6 sm:pt-36">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Eyebrow>{data.eyebrow}</Eyebrow>
              {data.comingSoon && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-warning">
                  <Clock className="size-3.5" /> Coming soon
                </span>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className={cn(DISPLAY, "mt-6 text-4xl leading-[1.06] text-foreground sm:text-5xl md:text-6xl")}>{data.title}</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{data.subtitle}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={ctaHref} className="ease-expo inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110">
                {data.comingSoon ? "Join the waitlist" : "Get your free audit"} <ArrowRight className="size-5" />
              </Link>
              <Link href="/feeds" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:bg-muted">
                See it in action
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* product-specific sections — order + content vary per product */}
      {data.sections.map((block, i) => (
        <FeatureBlock key={`${block.kind}-${i}`} block={block} index={i} />
      ))}

      {/* related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-surface-sunken py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <Reveal>
              <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>Explore more of the platform</h2>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.06}>
                  <Link href={featureHref(r)} className={cn(CARD, "flex h-full flex-col p-5")}>
                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-info text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.65)]"><r.icon className="size-5" /></span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{r.label}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{r.tagline}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-24">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 opacity-70" />
        <Glow className="left-1/3 top-[-20%] h-72 w-72 bg-brand/25" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div>
              <Eyebrow dark>{data.comingSoon ? "Join the waitlist" : "Free AI-visibility audit"}</Eyebrow>
              <h2 className={cn(DISPLAY, "mt-5 text-3xl text-white sm:text-4xl")}>
                {data.comingSoon ? (
                  <>Be first when <span className="bg-gradient-to-r from-white to-white/55 bg-clip-text text-transparent">Paid Boost ships.</span></>
                ) : (
                  <>See where AI engines find you — <span className="bg-gradient-to-r from-white to-white/55 bg-clip-text text-transparent">and where they don&apos;t.</span></>
                )}
              </h2>
              <p className="mt-4 max-w-md text-lg text-white/70">
                {data.comingSoon
                  ? "Drop in your details and we'll let you know the moment it's ready — plus run your free organic audit now."
                  : "Drop in your website and we'll show you what to fix first to start getting cited and capturing leads."}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <AuditForm tone="dark" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
