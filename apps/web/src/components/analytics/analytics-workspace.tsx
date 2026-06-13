"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  LineChart,
  Sparkles,
  FileText,
  Users,
  Bot,
  Gauge,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type {
  RankPoint,
  ImpressionPoint,
  AiVisibilitySignal,
  TrackedPage,
  Lead,
} from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { InsightBand, type InsightStatus } from "@/components/dashboard/insight-band";
import { InfoHint } from "@/components/ui/info-hint";
import { RankChartLazy, TrafficChartLazy, AiVisibilityLazy } from "@/components/performance/lazy-charts";
import { TrackedPagesTable } from "@/components/performance/tracked-pages-table";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "overview" | "rankings" | "ai" | "content";
const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "rankings", label: "Search & Rankings", icon: LineChart },
  { id: "ai", label: "AI Visibility", icon: Sparkles },
  { id: "content", label: "Content Performance", icon: FileText },
];

interface Kpi {
  label: string;
  value: string;
  def: string;
  icon: typeof Gauge;
}

export function AnalyticsWorkspace({
  ranks,
  impressions,
  aiSignals,
  pages,
  leads,
}: {
  ranks: RankPoint[];
  impressions: ImpressionPoint[];
  aiSignals: AiVisibilitySignal[];
  pages: TrackedPage[];
  leads: Lead[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const m = useMemo(() => {
    const avgRank = ranks.length ? Math.round(ranks.reduce((a, p) => a + p.rank, 0) / ranks.length) : 0;
    const totalClicks = impressions.reduce((a, p) => a + p.clicks, 0);
    const totalImpr = impressions.reduce((a, p) => a + p.impressions, 0);
    const aiMentions = aiSignals.reduce((a, s) => a + s.mentions, 0);
    const cleanLeads = leads.filter((l) => l.spamStatus === "clean");
    const slipping = pages.filter((p) => p.currentRank > p.prevRank).length;
    const contentHealth = pages.length ? Math.round((100 * (pages.length - slipping)) / pages.length) : 0;
    return { avgRank, totalClicks, totalImpr, aiMentions, leads: cleanLeads.length, contentHealth, slipping };
  }, [ranks, impressions, aiSignals, pages, leads]);

  // Only metrics backed by real data. Human-traffic / AI-bot / conversion metrics
  // arrive once the analytics event pipeline + tracker are wired (server-side).
  const kpis: Kpi[] = [
    { label: "AI mentions", value: compact(m.aiMentions), def: "Times your brand was cited in AI answers this period.", icon: Sparkles },
    { label: "Avg. rank", value: `#${m.avgRank}`, def: "Mean SERP position across tracked pages. Lower is better.", icon: LineChart },
    { label: "Impressions", value: compact(m.totalImpr), def: "Times your tracked pages appeared in search results.", icon: Bot },
    { label: "Clicks", value: compact(m.totalClicks), def: "Search clicks to your tracked pages.", icon: ArrowRight },
    { label: "Leads", value: String(m.leads), def: "Clean leads captured from published pages.", icon: Users },
    { label: "Content health", value: `${m.contentHealth}%`, def: "Share of tracked pages holding or gaining rank.", icon: FileText },
  ];

  // Unified insight (§13).
  const status: InsightStatus = m.slipping > 2 ? "needs-attention" : m.slipping > 0 ? "stable" : "improving";
  const headline = `${m.aiMentions} AI mentions and ${compact(m.totalClicks)} clicks this period across ${pages.length} tracked pages. ${
    m.slipping > 0
      ? `${m.slipping} page${m.slipping > 1 ? "s" : ""} slipping — refresh to protect rank and leads.`
      : "Momentum is holding across the funnel."
  }`;

  const needsAction = [...pages]
    .filter((p) => p.currentRank > p.prevRank)
    .sort((a, b) => b.currentRank - b.prevRank - (a.currentRank - a.prevRank))
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <InsightBand status={status} headline={headline} />

          {/* KPI strip — metrics backed by real data only */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {k.label}
                      <InfoHint>{k.def}</InfoHint>
                    </span>
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="tnum mt-1.5 text-2xl font-semibold text-foreground">{k.value}</div>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-muted-foreground">
            Human-traffic, AI-bot, and conversion analytics appear once the analytics tracker and event pipeline are connected.
          </p>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            <Panel
              title="Content needing action"
              description="Pages slipping in rank — refresh to protect traffic and leads"
              className="lg:col-span-2"
            >
              {needsAction.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-muted-foreground">All tracked pages are holding or gaining. 🎉</div>
              ) : (
                <ul className="space-y-2">
                  {needsAction.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/12 text-warning">
                        <LineChart className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-foreground">{p.title}</div>
                        <div className="truncate font-mono text-[11.5px] text-muted-foreground">{p.path}</div>
                      </div>
                      <span className="tnum text-[12px] text-negative">#{p.prevRank} → #{p.currentRank}</span>
                      <Link href="/content" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline">
                        Refresh <ArrowRight className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="AI Search Visibility" description="Brand citations in AI answers">
              <AiVisibilityLazy signals={aiSignals} />
            </Panel>
          </div>
        </div>
      )}

      {tab === "rankings" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] text-muted-foreground">Ranking momentum and search traffic across tracked pages.</p>
            <Link href="/performance" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
              Date-range view <ExternalLink className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Average Ranking" description="Mean SERP position over time — lower is better">
              <RankChartLazy data={ranks} />
            </Panel>
            <Panel title="Search Traffic" description="Impressions and clicks over time">
              <TrafficChartLazy data={impressions} />
            </Panel>
          </div>
          <Panel title="Tracked Pages" description="Click any row to drill into its history" bodyClassName="px-1.5 pb-1.5">
            <TrackedPagesTable pages={pages} />
          </Panel>
        </div>
      )}

      {tab === "ai" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel title="AI Search Visibility" description="Share of voice across AI answer engines">
            <AiVisibilityLazy signals={aiSignals} />
          </Panel>
          <Panel title="By engine" description="Mentions & share of voice" className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {aiSignals.map((s) => (
                <div key={s.engine} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-foreground">{s.label}</span>
                    <span className="tnum text-[12px] text-muted-foreground">{s.shareOfVoice}% SOV</span>
                  </div>
                  <div className="tnum mt-1 text-xl font-bold text-foreground">{s.mentions}</div>
                  <div className="text-[11.5px] text-muted-foreground">mentions this period</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Per-prompt citations, cited URLs, and competitor mentions arrive with the AI-mention tracker (server jobs).
            </p>
          </Panel>
        </div>
      )}

      {tab === "content" && (
        <Panel title="Content Performance" description="Every tracked page scored by rank movement — click to drill in" bodyClassName="px-1.5 pb-1.5">
          <TrackedPagesTable pages={pages} />
        </Panel>
      )}
    </div>
  );
}
