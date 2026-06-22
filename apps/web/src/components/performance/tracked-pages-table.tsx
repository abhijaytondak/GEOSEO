"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  MousePointerClick,
  RefreshCw,
  Workflow,
  AlertTriangle,
} from "lucide-react";
import type { TrackedPage } from "@geoseo/types";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RankChart } from "./rank-chart";
import { TrafficChart } from "./traffic-chart";

/** Inline rank-movement indicator. For SERP rank, a LOWER number is better,
 *  so a drop in position is good (green). */
function RankMove({ current, prev }: { current: number; prev: number }) {
  const change = prev - current; // positive = improved (moved up the page)
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-muted-foreground tabular-nums">
        <Minus className="size-3" strokeWidth={2.5} />0
      </span>
    );
  }
  const improved = change > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums",
        improved ? "text-positive" : "text-negative",
      )}
    >
      {improved ? (
        <ArrowUp className="size-3" strokeWidth={2.5} />
      ) : (
        <ArrowDown className="size-3" strokeWidth={2.5} />
      )}
      {Math.abs(change)}
    </span>
  );
}

type PageStatus = "gaining" | "stable" | "slipping" | "needs-refresh";

function pageStatus(p: TrackedPage): PageStatus {
  const change = p.prevRank - p.currentRank; // positive = improved (moved up)
  if (change >= 1) return "gaining";
  if (change <= -3) return "needs-refresh";
  if (change < 0) return "slipping";
  return "stable";
}

const STATUS_BADGE: Record<
  PageStatus,
  { label: string; variant: "positive" | "muted" | "warning" | "negative" }
> = {
  gaining: { label: "Gaining", variant: "positive" },
  stable: { label: "Stable", variant: "muted" },
  slipping: { label: "Slipping", variant: "warning" },
  "needs-refresh": { label: "Needs refresh", variant: "negative" },
};

type Filter = "all" | PageStatus;
const FILTERS: Filter[] = ["all", "gaining", "slipping", "needs-refresh"];
const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  gaining: "Gaining",
  stable: "Stable",
  slipping: "Slipping",
  "needs-refresh": "Needs refresh",
};

export function TrackedPagesTable({ pages, siteHost }: { pages: TrackedPage[]; siteHost?: string }) {
  const [selected, setSelected] = useState<TrackedPage | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const open = selected !== null;

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: pages.length };
    for (const p of pages) {
      const s = pageStatus(p);
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [pages]);

  const filtered = useMemo(
    () => (filter === "all" ? pages : pages.filter((p) => pageStatus(p) === filter)),
    [pages, filter],
  );

  return (
    <>
      {/* status filters (§12) */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {FILTER_LABEL[f]}
            <span className={cn("tnum text-micro", filter === f ? "text-background/70" : "text-muted-foreground")}>
              {counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-label text-muted-foreground">
          No tracked pages match this filter.{" "}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="rounded-md font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            Reset
          </button>
        </div>
      )}

      {/* desktop table */}
      <div className="hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {["Page", "Rank", "Change", "Impressions", "Clicks", ""].map((h, i) => (
                <th
                  key={h || "spacer"}
                  className={cn(
                    "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    i >= 1 && i <= 4 && "text-right",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelected(p)}
                className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/60"
              >
                <td className="max-w-0 px-3 py-3">
                  <div className="truncate text-[13.5px] font-medium text-foreground">
                    {p.title}
                  </div>
                  <div className="truncate font-mono text-[11.5px] text-muted-foreground">
                    {p.path}
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="tnum text-[14px] font-semibold text-foreground">
                    #{p.currentRank}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <RankMove current={p.currentRank} prev={p.prevRank} />
                </td>
                <td className="tnum px-3 py-3 text-right text-[13px] text-foreground">
                  {compact(p.impressions)}
                </td>
                <td className="tnum px-3 py-3 text-right text-[13px] text-foreground">
                  {compact(p.clicks)}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Drilldown
                    <MousePointerClick className="size-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards — same drilldown on tap */}
      <div className="space-y-2.5 p-1.5 md:hidden">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-foreground">{p.title}</div>
                <div className="truncate font-mono text-[11.5px] text-muted-foreground">{p.path}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="tnum text-[15px] font-semibold text-foreground">#{p.currentRank}</span>
                <RankMove current={p.currentRank} prev={p.prevRank} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="tnum">{compact(p.impressions)} impressions</span>
              <span className="tnum">{compact(p.clicks)} clicks</span>
              <span className="ml-auto inline-flex items-center gap-1 font-medium text-brand">
                Drilldown
                <MousePointerClick className="size-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b border-border bg-surface-sunken p-5">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[pageStatus(selected)].variant}>
                    {STATUS_BADGE[pageStatus(selected)].label}
                  </Badge>
                </div>
                <SheetTitle className="mt-1 text-base leading-snug">
                  {selected.title}
                </SheetTitle>
                <SheetDescription className="font-mono text-[12px]">
                  {selected.path}
                </SheetDescription>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    { label: "Rank", value: `#${selected.currentRank}` },
                    {
                      label: "Change",
                      value: (
                        <RankMove
                          current={selected.currentRank}
                          prev={selected.prevRank}
                        />
                      ),
                    },
                    { label: "Impr.", value: compact(selected.impressions) },
                    { label: "Clicks", value: compact(selected.clicks) },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-micro uppercase text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="tnum mt-0.5 text-h-card text-foreground">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetHeader>

              <div className="space-y-6 p-5">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-h-card text-foreground">
                      Ranking history
                    </h4>
                    <span className="text-micro text-muted-foreground">
                      Last {selected.ranks.length} points
                    </span>
                  </div>
                  <RankChart data={selected.ranks} />
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-h-card text-foreground">
                      Impressions &amp; clicks
                    </h4>
                  </div>
                  <TrafficChart data={selected.impressionsSeries} />
                </section>

                {/* recommended actions (§13) */}
                <section>
                  <h4 className="mb-2 text-h-card text-foreground">Recommended actions</h4>
                  <div className="space-y-2">
                    <Link
                      href="/content"
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-label font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <RefreshCw className="size-4 text-brand" />
                      Refresh content
                      <span className="ml-auto text-micro text-muted-foreground">Counter content decay</span>
                    </Link>
                    <Link
                      href="/content"
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-label font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <Workflow className="size-4 text-brand" />
                      Apply internal links
                      <span className="ml-auto text-micro text-muted-foreground">Pass authority to this page</span>
                    </Link>
                    {(pageStatus(selected) === "slipping" || pageStatus(selected) === "needs-refresh") && (
                      <Link
                        href="/alerts"
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-label font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <AlertTriangle className="size-4 text-warning" />
                        Investigate rank drop
                        <span className="ml-auto text-micro text-muted-foreground">Check related alerts</span>
                      </Link>
                    )}
                    {siteHost && (
                      <a
                        href={`https://${siteHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}${selected.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-label font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <ExternalLink className="size-4 text-muted-foreground" />
                        Open page
                        <span className="ml-auto text-micro text-muted-foreground">View live</span>
                      </a>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
