import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SITE_URL, BRAND } from "./data";
import { INTEGRATIONS, type IntegrationData } from "./integrations-data";

const DISPLAY = "[font-family:var(--font-display)] font-semibold tracking-tight";
const CARD =
  "group relative rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-float";

function Schema({ data }: { data: IntegrationData }) {
  const url = `${SITE_URL}/integrations/${data.slug}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: data.metaTitle,
        description: data.metaDescription,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Integrations", item: `${SITE_URL}/integrations` },
          { "@type": "ListItem", position: 3, name: data.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: data.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}

export function IntegrationPage({ data }: { data: IntegrationData }) {
  const Icon = data.icon;
  const others = INTEGRATIONS.filter((i) => i.slug !== data.slug);

  return (
    <>
      <Schema data={data} />

      {/* hero */}
      <section className="relative overflow-hidden bg-background pt-28 sm:pt-36">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(75%_55%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <span aria-hidden className="mx-1.5">›</span>
              <Link href="/integrations" className="transition-colors hover:text-foreground">Integrations</Link>
              <span aria-hidden className="mx-1.5">›</span>
              <span className="text-foreground">{data.name}</span>
            </nav>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand shadow-xs">
              <Icon className="size-3.5" /> {data.eyebrow}
            </span>
            <h1 className={cn(DISPLAY, "mt-5 text-4xl leading-[1.05] text-foreground sm:text-5xl")}>{data.h1}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{data.subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/#audit" className="ease-expo inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110">
                Get your free audit <ArrowRight className="size-5" />
              </Link>
              <Link href="/demo" className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted">
                Book a demo
              </Link>
            </div>
            {/* Draft-first reassurance, above the fold — buyers' #1 fear is AI auto-posting live. */}
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-positive/10 px-3 py-1.5 text-sm font-medium text-positive">
              <ShieldCheck className="size-4" /> Draft-first — you review and approve every page before it publishes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* what publishes */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>What Citensity publishes to {data.name}</h2>
            <ul className="mt-6 space-y-3">
              {data.publishes.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-foreground">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-white"><Check className="size-3" /></span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* how to connect */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>How to connect {data.name}</h2>
          </Reveal>
          <ol className="mt-6 space-y-4">
            {data.steps.map((s, i) => (
              <Reveal key={s.title} delay={Math.min(i * 0.05, 0.2)}>
                <li className={cn(CARD, "flex gap-4 p-5")}>
                  <span className={cn(DISPLAY, "grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info text-sm text-white")}>{i + 1}</span>
                  <div>
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* platform notes */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.notes.map((n, i) => (
              <Reveal key={n.title} delay={Math.min(i * 0.05, 0.15)}>
                <div className={cn(CARD, "h-full p-5")}>
                  <div className="font-semibold text-foreground">{n.title}</div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{n.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background pt-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-2xl text-foreground sm:text-3xl")}>{data.name} integration FAQ</h2>
          </Reveal>
          <dl className="mt-6 space-y-4">
            {data.faqs.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 0.04, 0.16)}>
                <div className={cn(CARD, "p-5")}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* other integrations */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal>
            <h2 className={cn(DISPLAY, "text-xl text-foreground")}>Other integrations</h2>
          </Reveal>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {others.map((o) => {
              const OIcon = o.icon;
              return (
                <Reveal key={o.slug}>
                  <Link href={`/integrations/${o.slug}`} className={cn(CARD, "flex items-center gap-3 p-5")}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><OIcon className="size-4" /></span>
                    <span className="font-semibold text-foreground">{o.name}</span>
                    <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t see your platform? Every page can also publish to a managed {BRAND} feed — <Link href="/demo" className="font-semibold text-brand hover:underline">talk to us</Link> about your stack.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
