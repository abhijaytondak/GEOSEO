import Link from "next/link";
import { BRAND } from "./data";
import { PLATFORM, SOLUTIONS, featureHref } from "./platform-data";

type Col = { title: string; links: { label: string; href: string }[] };

const COLUMNS: Col[] = [
  {
    title: "Platform",
    links: PLATFORM.map((p) => ({ label: p.label, href: featureHref(p) })),
  },
  {
    title: "Solutions",
    links: [
      ...SOLUTIONS.map((s) => ({ label: s.label, href: featureHref(s) })),
      { label: "Integrations", href: "/integrations" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/methodology" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Book a demo", href: "/demo" },
      { label: "Sign in", href: "/home" },
    ],
  },
  {
    title: "Trust & legal",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-info text-brand-foreground">
                <span className="size-3 rounded-full bg-brand-foreground/90" />
              </span>
              <span className="text-lg">{BRAND}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The growth engine for the AI search era — rank in Google and get cited by AI answer engines.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{col.title}</div>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-positive" /> This site is published &amp; optimized with {BRAND}.
          </span>
        </div>
      </div>
    </footer>
  );
}
