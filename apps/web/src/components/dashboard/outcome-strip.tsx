"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, Target, Gauge, Loader2 } from "lucide-react";
import type { Lead } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";

/** Business-outcome strip for Home — leads first, not vanity metrics
 *  (docs/PRD-workflow-navigation-optimization.md §6.1). Self-fetching (mirrors
 *  BrandScorecard) so it drops into the dashboard without changing its server load. */
export function OutcomeStrip() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    let live = true;
    pageEngineApi
      .getLeads()
      .then((l) => live && setLeads(l))
      .catch(() => live && setLeads([]));
    return () => {
      live = false;
    };
  }, []);

  const total = leads?.length ?? 0;
  const qualified = leads?.filter((l) => l.score >= 70).length ?? 0;
  const avg = total ? Math.round(leads!.reduce((a, l) => a + l.score, 0) / total) : 0;

  const stats: { label: string; value: number | string; icon: typeof Target }[] = [
    { label: "Qualified leads", value: qualified, icon: Target },
    { label: "Total captured", value: total, icon: Inbox },
    { label: "Avg lead score", value: total ? avg : "—", icon: Gauge },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Target className="size-4 text-brand" />
          Business outcome
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
        >
          View leads
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-surface-sunken p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon className="size-3.5" />
                <span className="truncate">{s.label}</span>
              </div>
              <div className="tnum mt-1 text-2xl font-semibold text-foreground">
                {leads === null ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  s.value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
