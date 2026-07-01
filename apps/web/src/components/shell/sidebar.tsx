"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowUpRight, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared nav body — reused by the desktop `Sidebar` and the mobile drawer.
 *  `onNavigate` lets the mobile sheet close itself when a link is tapped. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-brand-foreground shadow-sm">
          <Orbit className="size-[18px]" strokeWidth={2.25} />
        </div>
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-foreground">Citensity</div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">Authority Engine</div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {navSections.map((section, i) => (
          <div key={i} className="space-y-1">
            {section.label && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                  )}
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={2}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* upgrade card */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl bg-foreground p-4 text-background">
          <div className="absolute -right-6 -top-8 size-24 rounded-full bg-brand/40 blur-2xl" />
          <Sparkles className="size-4 text-background/90" />
          <div className="mt-2 text-[13px] font-semibold leading-snug">Autopilot your backlinks</div>
          <div className="mt-1 text-[11.5px] leading-relaxed text-background/65">
            Let agents acquire links and refresh pages automatically.
          </div>
          <Link
            href="/settings"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-transform hover:scale-[1.02]"
          >
            Upgrade to Pro
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <a
          href="https://developer.puter.com"
          target="_blank"
          rel="noreferrer"
          className="mt-2 block px-1 text-center text-[11px] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          Powered by Puter
        </a>
      </div>
    </>
  );
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex h-full w-[232px] flex-col border-r border-border bg-sidebar",
        className,
      )}
    >
      <SidebarContent />
    </aside>
  );
}
