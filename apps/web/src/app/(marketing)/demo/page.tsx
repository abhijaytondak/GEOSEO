import type { Metadata } from "next";
import { Check, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { AuditForm } from "@/components/marketing/audit-form";
import { SITE_URL, BRAND } from "@/components/marketing/data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const GRAD = "bg-gradient-to-r from-brand to-info bg-clip-text text-transparent";

const DESCRIPTION =
  "See Citensity on your own site. Get a free AI-visibility audit and a walkthrough of how to get cited by AI engines, rank in Google, and capture the leads.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Book a demo — ${BRAND}`,
  description: DESCRIPTION,
  alternates: { canonical: "/demo" },
  openGraph: { title: `Book a demo — ${BRAND}`, description: DESCRIPTION, url: `${SITE_URL}/demo`, siteName: BRAND, type: "website" },
  robots: { index: true, follow: true },
};

const EXPECT = [
  { icon: Sparkles, title: "Your live AI-visibility audit", body: "We scan your site and show where AI engines find you today — and where they don't." },
  { icon: Check, title: "A tailored game plan", body: "The exact topics, pages, and fixes that move your brand into AI answers fastest." },
  { icon: Clock, title: "A 20-minute walkthrough", body: "See Brand Memory, the Page Engine, and the leads dashboard on your own data." },
];

export default function DemoPage() {
  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-8%] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-5 sm:px-6 lg:grid-cols-2">
        {/* left: pitch + expectations */}
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> Book a demo
            </span>
            <h1 className={cn(DISPLAY, "mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl")}>
              See Citensity on <span className={GRAD}>your own site.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Drop in your website and we&apos;ll run your free AI-visibility audit — then walk you through exactly how
              to get cited, rank, and capture leads.
            </p>
            <ul className="mt-8 space-y-4">
              {EXPECT.map((e) => (
                <li key={e.title} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-info text-white shadow-[0_8px_22px_-8px_rgba(108,76,241,0.65)]"><e.icon className="size-5" /></span>
                  <span>
                    <span className="block font-semibold text-foreground">{e.title}</span>
                    <span className="mt-0.5 block text-[15px] leading-relaxed text-muted-foreground">{e.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-brand" /> Public pages only · no credit card · no commitment
            </p>
          </div>
        </Reveal>

        {/* right: form */}
        <Reveal delay={0.1}>
          <div className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-card/70 p-1.5 shadow-float backdrop-blur-sm">
              <AuditForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
