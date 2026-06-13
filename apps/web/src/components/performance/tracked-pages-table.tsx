"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Minus, ExternalLink, MousePointerClick } from "lucide-react";
import type { TrackedPage } from "@geoseo/types";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
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

export function TrackedPagesTable({ pages }: { pages: TrackedPage[] }) {
  const [selected, setSelected] = useState<TrackedPage | null>(null);
  const open = selected !== null;

  return (
    <>
      <div className="overflow-hidden">
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
            {pages.map((p) => (
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

      <Sheet open={open} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b border-border bg-surface-sunken p-5">
                <SheetTitle className="text-base leading-snug">
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
                      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="tnum mt-0.5 text-[15px] font-semibold text-foreground">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetHeader>

              <div className="space-y-6 p-5">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-foreground">
                      Ranking history
                    </h4>
                    <span className="text-[11.5px] text-muted-foreground">
                      Last {selected.ranks.length} points
                    </span>
                  </div>
                  <RankChart data={selected.ranks} />
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-foreground">
                      Impressions &amp; clicks
                    </h4>
                  </div>
                  <TrafficChart data={selected.impressionsSeries} />
                </section>

                <a
                  href={`https://example.com${selected.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <ExternalLink className="size-4" />
                  Open page
                </a>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
