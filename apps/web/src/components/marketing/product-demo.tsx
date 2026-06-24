"use client";

import { useState } from "react";
import { BrainCircuit, Telescope, Files, Inbox, Check, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "brand" | "discover" | "pages" | "leads";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "brand", label: "Brand Memory", icon: BrainCircuit },
  { key: "discover", label: "Opportunities", icon: Telescope },
  { key: "pages", label: "Pages", icon: Files },
  { key: "leads", label: "Leads", icon: Inbox },
];

/**
 * Stylized in-page preview of the GEOSEO product — a browser-framed panel with a
 * tab per pipeline stage. Mock data, faithful to the real dashboard's tokens/layout
 * (honest representation, crisp at any resolution, no screenshot bitmaps).
 */
export function ProductDemo({ initialTab = "brand" }: { initialTab?: TabKey }) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-float">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-sunken px-4 py-3">
        <span className="size-2.5 rounded-full bg-negative/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-positive/60" />
        <span className="ml-3 hidden truncate rounded-md bg-card px-3 py-1 text-xs text-muted-foreground sm:block">
          app.geoseo.com/{tab === "discover" ? "research" : tab === "brand" ? "brand" : tab}
        </span>
      </div>

      {/* tab rail */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                on ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* panel body */}
      <div className="min-h-[300px] bg-background p-4 sm:p-5">
        {tab === "brand" && <BrandPanel />}
        {tab === "discover" && <DiscoverPanel />}
        {tab === "pages" && <PagesPanel />}
        {tab === "leads" && <LeadsPanel />}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-4 shadow-card", className)}>{children}</div>;
}

function BrandPanel() {
  const rows = ["Brand identity & value prop", "Core topics", "Audience & personas", "Competitors", "Contact for outreach"];
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memory strength</div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums text-foreground">92%</span>
          <span className="mb-1 text-xs text-positive">Excellent</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand" style={{ width: "92%" }} />
        </div>
      </Card>
      <Card>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coverage</div>
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm text-foreground">
              <span className="grid size-5 place-items-center rounded-full bg-positive/12 text-positive"><Check className="size-3" /></span>
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function DiscoverPanel() {
  const rows = [
    { q: "best analytics for product teams", intent: "Commercial", vol: "2.4k", diff: 38 },
    { q: "how to track activation metrics", intent: "Informational", vol: "1.1k", diff: 29 },
    { q: "product analytics vs amplitude", intent: "Comparison", vol: "880", diff: 41 },
    { q: "self-serve analytics for startups", intent: "Commercial", vol: "640", diff: 33 },
  ];
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Buyer-intent opportunities</span>
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">24 found</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.q} className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{r.q}</span>
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">{r.intent}</span>
            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{r.vol}</span>
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{r.diff}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PagesPanel() {
  const pages = [
    { t: "Best analytics for product teams", s: "Published", tone: "positive" as const },
    { t: "Product analytics vs Amplitude", s: "In review", tone: "warning" as const },
    { t: "How to track activation metrics", s: "Draft", tone: "muted" as const },
    { t: "Self-serve analytics for startups", s: "Published", tone: "positive" as const },
  ];
  const toneCls = { positive: "bg-positive/12 text-positive", warning: "bg-warning/12 text-warning", muted: "bg-muted text-muted-foreground" };
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {pages.map((p) => (
        <Card key={p.t} className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{p.t}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", toneCls[p.tone])}>{p.s}</span>
        </Card>
      ))}
    </div>
  );
}

function LeadsPanel() {
  const leads = [
    { n: "Priya N.", c: "Northvale", score: 84 },
    { n: "Marcus L.", c: "Upcurve", score: 72 },
    { n: "Dana W.", c: "BrightMetric", score: 61 },
  ];
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Captured leads</span>
        <span className="inline-flex items-center gap-1 text-xs text-positive"><TrendingUp className="size-3.5" /> scored & routed</span>
      </div>
      <ul className="divide-y divide-border">
        {leads.map((l) => (
          <li key={l.n} className="flex items-center gap-3 px-4 py-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              {l.n.split(" ").map((x) => x[0]).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{l.n}</span>
              <span className="block truncate text-xs text-muted-foreground">{l.c}</span>
            </span>
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", l.score >= 80 ? "bg-positive/12 text-positive" : l.score >= 70 ? "bg-warning/12 text-warning" : "bg-muted text-muted-foreground")}>
              {l.score}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
