"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useReducedMotion } from "motion/react";
import { Menu, X, ArrowRight, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "./data";
import { PLATFORM, SOLUTIONS, featureHref, type FeaturePageData } from "./platform-data";

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight" aria-label={`${BRAND} home`}>
      <span className="relative grid size-7 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-brand to-info text-brand-foreground">
        <span className="size-3 rounded-full bg-white/90 transition-transform duration-500 ease-out group-hover:scale-[1.7]" />
        <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </span>
      <span className="text-lg">{BRAND}</span>
    </Link>
  );
}

const MENUS: { id: string; label: string; items: FeaturePageData[] }[] = [
  { id: "platform", label: "Platform", items: PLATFORM },
  { id: "solutions", label: "Solutions", items: SOLUTIONS },
];
const LINKS: { id: string; label: string; href: string }[] = [
  { id: "pricing", label: "Pricing", href: "/pricing" },
  { id: "resources", label: "Resources", href: "/resources" },
  { id: "faq", label: "FAQ", href: "/#faq" },
];

/** Shimmer-sweep brand CTA — the header's primary action. */
function AuditCta({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/#audit"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-br from-brand to-info px-4 py-2 text-sm font-semibold text-brand-foreground shadow-[0_6px_18px_-6px_rgba(108,76,241,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-8px_rgba(108,76,241,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative">Free audit</span>
      <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

function MenuPanel({ items, reduce }: { items: FeaturePageData[]; reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.985 }}
      transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.7 }}
      className="absolute left-0 top-full pt-2.5"
    >
      <div className="w-[480px] origin-top overflow-hidden rounded-2xl border border-border bg-card/95 shadow-float backdrop-blur-xl">
        <div aria-hidden className="h-0.5 w-full bg-gradient-to-r from-brand via-info to-brand/0" />
        <div className="grid gap-1 p-2 sm:grid-cols-2">
          {items.map((it, i) => (
            <motion.div
              key={it.slug}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.03 + i * 0.035, type: "spring", stiffness: 500, damping: 36 }}
            >
              <Link
                href={featureHref(it)}
                className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-info text-white shadow-[0_6px_16px_-8px_rgba(108,76,241,0.7)] transition-transform duration-200 group-hover/item:scale-110">
                  <it.icon className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {it.label}
                    {it.comingSoon && <Clock className="size-3 text-warning" aria-label="Coming soon" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{it.tagline}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function MarketingHeader() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
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

  const elevated = scrolled || !!hovered;

  return (
    <motion.header
      initial={reduce ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        elevated ? "border-b border-border bg-card/80 shadow-[0_1px_0_rgba(20,22,26,0.03),0_8px_30px_-12px_rgba(20,22,26,0.12)] backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className={cn("mx-auto flex max-w-6xl items-center justify-between px-5 transition-[height] duration-300 sm:px-6", scrolled ? "h-14" : "h-16")}>
        <Logo />

        <nav className="hidden items-center md:flex" aria-label="Primary" onMouseLeave={() => setHovered(null)}>
          {MENUS.map((m) => (
            <div key={m.id} className="relative" onMouseEnter={() => setHovered(m.id)}>
              <button
                type="button"
                aria-expanded={hovered === m.id}
                onFocus={() => setHovered(m.id)}
                className="relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {hovered === m.id && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-muted" transition={{ type: "spring", stiffness: 520, damping: 38 }} />
                )}
                {m.label}
                <ChevronDown className={cn("size-4 transition-transform duration-200", hovered === m.id && "rotate-180")} />
              </button>
              <AnimatePresence>
                {hovered === m.id && <MenuPanel items={m.items} reduce={reduce} />}
              </AnimatePresence>
            </div>
          ))}
          {LINKS.map((l) => (
            <Link
              key={l.id}
              href={l.href}
              onMouseEnter={() => setHovered(l.id)}
              className="relative inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {hovered === l.id && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-muted" transition={{ type: "spring", stiffness: 520, damping: 38 }} />
              )}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link href="/home" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
          <AuditCta />
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

      {/* scroll progress bar */}
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress }}
        className="h-px origin-left bg-gradient-to-r from-brand via-info to-brand"
      />

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <nav className="mx-auto flex max-h-[calc(100dvh-4rem)] max-w-6xl flex-col overflow-y-auto px-5 py-3" aria-label="Mobile">
              {MENUS.map((m) => (
                <div key={m.id} className="border-b border-border py-1">
                  <button
                    type="button"
                    onClick={() => setMobileMenu(mobileMenu === m.id ? null : m.id)}
                    aria-expanded={mobileMenu === m.id}
                    className="flex min-h-[44px] w-full items-center justify-between text-base font-semibold text-foreground"
                  >
                    {m.label}
                    <ChevronDown className={cn("size-5 transition-transform duration-200", mobileMenu === m.id && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {mobileMenu === m.id && (
                      <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 460, damping: 40 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-2">
                          {m.items.map((it) => (
                            <Link key={it.slug} href={featureHref(it)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center gap-2.5 pl-1 text-[15px] text-muted-foreground">
                              <it.icon className="size-4 text-brand" /> {it.label}
                              {it.comingSoon && <Clock className="size-3 text-warning" />}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {LINKS.map((l) => (
                <Link key={l.id} href={l.href} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center border-b border-border text-base font-medium text-foreground">{l.label}</Link>
              ))}
              <div className="mt-3 grid gap-2">
                <Link href="/home" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center justify-center rounded-full border border-border text-base font-medium">Sign in</Link>
                <AuditCta className="justify-center py-3 text-base" onClick={() => setOpen(false)} />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
