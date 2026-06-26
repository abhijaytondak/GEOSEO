import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Two-letter avatar initials. */
  initials: string;
  /** Marks an unverified/illustrative placeholder so we never imply a fake customer. */
  placeholder?: boolean;
}

/**
 * Social proof. GEOSEO is onboarding founding customers, so these are clearly-labelled
 * ILLUSTRATIVE placeholders, not fabricated customer claims. Swap in real, attributed
 * quotes (with name + company) as they come in and drop the `placeholder` flag — the
 * "Illustrative" chip and disclaimer disappear automatically once none remain.
 */
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We went from invisible in AI answers to being named alongside the category leaders. The pages GEOSEO publishes are the ones getting cited.",
    name: "Head of Growth",
    role: "B2B SaaS (founding customer)",
    initials: "HG",
    placeholder: true,
  },
  {
    quote:
      "It connected the dots we never could — what AI engines say about us, which pages earn citations, and the leads that follow. One workflow instead of five tools.",
    name: "Demand Gen Lead",
    role: "Marketing platform (founding customer)",
    initials: "DG",
    placeholder: true,
  },
  {
    quote:
      "The Brand Memory layer is the difference. The content is grounded in what we actually do, so the engines describe us accurately instead of guessing.",
    name: "Founder",
    role: "Developer tools (founding customer)",
    initials: "FD",
    placeholder: true,
  },
];

export function Testimonials() {
  const allPlaceholder = TESTIMONIALS.every((t) => t.placeholder);
  return (
    <section className="border-y border-border bg-surface-sunken py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <Star className="size-3.5" /> Early signal
            </span>
            <h2 className={cn(DISPLAY, "mt-5 text-3xl text-foreground sm:text-4xl")}>
              What founding customers <span className={GRAD}>are seeing.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We&apos;re onboarding our first cohort now. Here&apos;s the kind of outcome GEOSEO is built to deliver.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name + i} delay={(i % 3) * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                <Quote className="size-7 text-brand/30" aria-hidden />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-foreground">{t.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-xs font-semibold text-white">{t.initials}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                  {t.placeholder && (
                    <span className="ml-auto rounded-full border border-border bg-surface-sunken px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground" title="Illustrative example, not a verified customer quote">
                      Illustrative
                    </span>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {allPlaceholder && (
          <Reveal delay={0.1}>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Illustrative examples of intended outcomes — verified customer stories land here as our founding cohort ships.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
