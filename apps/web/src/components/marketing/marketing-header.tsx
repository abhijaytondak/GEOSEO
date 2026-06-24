"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "./data";
import { PLATFORM, SOLUTIONS, featureHref, type FeaturePageData } from "./platform-data";

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)} aria-label={`${BRAND} home`}>
      <span className="grid size-7 place-items-center rounded-lg bg-brand text-brand-foreground">
        <span className="size-3 rounded-full bg-brand-foreground/90" />
      </span>
      <span className="text-lg">{BRAND}</span>
    </Link>
  );
}

const MENUS: { id: string; label: string; items: FeaturePageData[] }[] = [
  { id: "platform", label: "Platform", items: PLATFORM },
  { id: "solutions", label: "Solutions", items: SOLUTIONS },
];

function MenuPanel({ items, onNavigate }: { items: FeaturePageData[]; onNavigate?: () => void }) {
  return (
    <div className="grid gap-1 p-2 sm:grid-cols-2">
      {items.map((it) => (
        <Link
          key={it.slug}
          href={featureHref(it)}
          onClick={onNavigate}
          className="ease-expo group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
        >
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><it.icon className="size-[18px]" /></span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {it.label}
              {it.comingSoon && <Clock className="size-3 text-warning" aria-label="Coming soon" />}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{it.tagline}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={cn(
        "ease-expo fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || hovered ? "border-b border-border bg-card/85 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {MENUS.map((m) => (
            <div key={m.id} className="relative" onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
              <button
                type="button"
                aria-expanded={hovered === m.id}
                onFocus={() => setHovered(m.id)}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {m.label}
                <ChevronDown className={cn("size-4 transition-transform", hovered === m.id && "rotate-180")} />
              </button>
              {hovered === m.id && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[460px] rounded-2xl border border-border bg-card shadow-float">
                    <MenuPanel items={m.items} />
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link href="/feeds" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Resources</Link>
          <Link href="/#faq" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/home" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
          <Link
            href="/#audit"
            className="ease-expo inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Free audit <ArrowRight className="size-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-11 items-center justify-center rounded-lg text-foreground md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-card md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3" aria-label="Mobile">
            {MENUS.map((m) => (
              <div key={m.id} className="border-b border-border py-1">
                <button
                  type="button"
                  onClick={() => setMobileMenu(mobileMenu === m.id ? null : m.id)}
                  aria-expanded={mobileMenu === m.id}
                  className="flex min-h-[44px] w-full items-center justify-between text-base font-semibold text-foreground"
                >
                  {m.label}
                  <ChevronDown className={cn("size-5 transition-transform", mobileMenu === m.id && "rotate-180")} />
                </button>
                {mobileMenu === m.id && (
                  <div className="pb-2">
                    {m.items.map((it) => (
                      <Link
                        key={it.slug}
                        href={featureHref(it)}
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center gap-2.5 pl-1 text-[15px] text-muted-foreground"
                      >
                        <it.icon className="size-4 text-brand" /> {it.label}
                        {it.comingSoon && <Clock className="size-3 text-warning" />}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link href="/feeds" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center border-b border-border text-base font-medium text-foreground">Resources</Link>
            <Link href="/#faq" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center border-b border-border text-base font-medium text-foreground">FAQ</Link>
            <div className="mt-3 grid gap-2">
              <Link href="/home" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center justify-center rounded-full border border-border text-base font-medium">Sign in</Link>
              <Link href="/#audit" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-brand text-base font-semibold text-brand-foreground">
                Free audit <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
