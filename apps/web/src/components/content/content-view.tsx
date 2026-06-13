"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  RefreshCw,
  Check,
  Link2,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingDown,
} from "lucide-react";
import type { InternalLinkSuggestion, TrackedPage } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type Freshness = "fresh" | "aging" | "stale";
type ItemState = "idle" | "refreshing" | "optimized";

interface ContentItem {
  page: TrackedPage;
  daysSinceUpdate: number;
  freshness: Freshness;
  rankDelta: number; // + = worsened
  health: number; // 0–100
  reason: string;
}

const FRESH: Record<Freshness, { label: string; cls: string }> = {
  fresh: { label: "Fresh", cls: "bg-positive/12 text-positive" },
  aging: { label: "Aging", cls: "bg-warning/15 text-warning" },
  stale: { label: "Stale", cls: "bg-negative/12 text-negative" },
};

function derive(pages: TrackedPage[]): ContentItem[] {
  return pages
    .map((page, i) => {
      // deterministic "days since update" from index
      const daysSinceUpdate = 14 + ((i * 37) % 120);
      const freshness: Freshness =
        daysSinceUpdate > 90 ? "stale" : daysSinceUpdate > 45 ? "aging" : "fresh";
      const rankDelta = page.currentRank - page.prevRank; // + worse
      const stalePenalty = freshness === "stale" ? 28 : freshness === "aging" ? 12 : 0;
      const rankPenalty = Math.max(0, rankDelta) * 4;
      const health = Math.max(35, Math.min(100, 100 - stalePenalty - rankPenalty));
      const reason =
        rankDelta > 0
          ? `Slipped ${rankDelta} position${rankDelta > 1 ? "s" : ""} — refresh to recover`
          : freshness === "stale"
            ? `Not updated in ${daysSinceUpdate} days — likely content decay`
            : freshness === "aging"
              ? "Aging content — a refresh keeps momentum"
              : "Healthy — monitor for changes";
      return { page, daysSinceUpdate, freshness, rankDelta, health, reason };
    })
    .sort((a, b) => a.health - b.health);
}

function HealthDot({ health }: { health: number }) {
  const color = health >= 80 ? "bg-positive" : health >= 60 ? "bg-warning" : "bg-negative";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", color)} />
      <span className="tnum text-[13px] font-semibold text-foreground">{health}</span>
    </div>
  );
}

export function ContentView({
  pages,
  suggestions,
}: {
  pages: TrackedPage[];
  suggestions: InternalLinkSuggestion[];
}) {
  const { notify, trackJob } = useAppFeedback();
  const items = useMemo(() => derive(pages), [pages]);
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [links, setLinks] = useState(suggestions);

  async function refresh(id: string) {
    setStates((s) => ({ ...s, [id]: "refreshing" }));
    try {
      const result = await api.refreshContent({ pageIds: [id], mode: "single" });
      trackJob(result.job);
      setStates((s) => ({ ...s, [id]: "optimized" }));
      notify({ kind: "success", title: "Refresh queued", message: "AI refresh recommendations are being prepared." });
    } catch (err) {
      setStates((s) => ({ ...s, [id]: "idle" }));
      notify({ kind: "error", title: "Refresh failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  const stale = items.filter((i) => i.freshness === "stale").length;
  const decaying = items.filter((i) => i.rankDelta > 0).length;
  const optimized = Object.values(states).filter((s) => s === "optimized").length;

  const stats = [
    { label: "Tracked pages", value: String(items.length), icon: FileText },
    { label: "Stale pages", value: String(stale), icon: Clock },
    { label: "Decaying", value: String(decaying), icon: TrendingDown },
    { label: "Optimized today", value: String(optimized), icon: Check },
  ];

  async function applyLinks(ids: string[]) {
    if (ids.length === 0) return;
    const previous = links;
    setLinks((current) => current.map((link) => (ids.includes(link.id) ? { ...link, status: "applied" } : link)));
    try {
      const result = await api.applyInternalLinks(ids);
      trackJob(result.job);
      notify({ kind: "success", title: "Internal links applied", message: `${ids.length} suggestion${ids.length === 1 ? "" : "s"} updated.` });
    } catch (err) {
      setLinks(previous);
      notify({ kind: "error", title: "Could not apply links", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {s.label}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* content health list */}
        <Panel
          title="Content Health"
          description="Pages ranked by decay risk — refresh the weakest first"
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {items.map(({ page, freshness, health, reason, daysSinceUpdate }) => {
              const state = states[page.id] ?? "idle";
              return (
                <div key={page.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-foreground">
                        {page.title}
                      </span>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold", FRESH[freshness].cls)}>
                        {FRESH[freshness].label}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {page.path} · {daysSinceUpdate}d ago · {reason}
                    </div>
                  </div>
                  <HealthDot health={health} />
                  <div className="w-[150px] text-right">
                    {state === "optimized" ? (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-positive">
                        <Check className="size-4" /> Refresh queued
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={health < 60 ? "default" : "outline"}
                        className="h-8 rounded-full px-3"
                        disabled={state === "refreshing"}
                        onClick={() => refresh(page.id)}
                      >
                        {state === "refreshing" ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        {state === "refreshing" ? "Queuing…" : "AI Refresh"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* internal linking */}
        <Panel
          title="Internal Linking"
          description="Suggested links to spread authority"
        >
          <div className="space-y-2.5">
            {links.map((link) => (
              <div key={link.id} className="rounded-xl border border-border bg-surface-sunken p-3">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <Link2 className="size-3.5 shrink-0 text-brand" />
                  <span className="truncate font-medium text-foreground">{link.fromTitle}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 pl-5 text-[11.5px] text-muted-foreground">
                  <ArrowRight className="size-3" />
                  <span className="truncate">link to {link.toPath}</span>
                </div>
                <button
                  className="mt-2 inline-flex h-8 items-center rounded-full px-2.5 text-[12px] font-semibold text-brand hover:bg-brand/10 disabled:text-positive"
                  disabled={link.status === "applied"}
                  onClick={() => applyLinks([link.id])}
                >
                  {link.status === "applied" ? "Applied" : "Apply"}
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            disabled={links.every((link) => link.status === "applied")}
            onClick={() => applyLinks(links.filter((link) => link.status !== "applied").map((link) => link.id))}
          >
            <Sparkles className="size-4 text-brand" />
            Apply all suggestions
          </button>
        </Panel>
      </div>
    </div>
  );
}
