"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  FileDown,
  Inbox,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type {
  RankPoint,
  ImpressionPoint,
  AiVisibilitySignal,
  TrackedPage,
  Lead,
  AuthorityOverview,
} from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { ConnectDataPrompt } from "@/components/dashboard/connect-data-prompt";
import { InsightBand, type InsightStatus } from "@/components/dashboard/insight-band";
import { InfoHint } from "@/components/ui/info-hint";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RankChartLazy, TrafficChartLazy, AiVisibilityLazy } from "@/components/performance/lazy-charts";
import { TrackedPagesTable } from "@/components/performance/tracked-pages-table";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "overview" | "ai" | "rankings" | "pages" | "leads" | "authority" | "roi";
const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "ai", label: "AI Visibility", icon: Sparkles },
  { id: "rankings", label: "Search Rankings", icon: LineChart },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "leads", label: "Leads", icon: Users },
  { id: "authority", label: "Authority", icon: ShieldCheck },
  { id: "roi", label: "ROI", icon: DollarSign },
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
  authority,
}: {
  ranks: RankPoint[];
  impressions: ImpressionPoint[];
  aiSignals: AiVisibilitySignal[];
  pages: TrackedPage[];
  leads: Lead[];
  authority: AuthorityOverview;
}) {
  const params = useSearchParams();
  const initialTab = (TABS.find((t) => t.id === params.get("view"))?.id ?? "overview") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);

  type RoiRow = { id: string; title: string; slug: string; currentRank: number; impressions: number; clicks: number; leadCount: number; wonCount: number; avgLeadScore: number; conversionRate: number };
  type RoiTotals = { totalLeads: number; totalWon: number; totalImpressions: number; totalClicks: number; pagesWithLeads: number };
  const [roiRows, setRoiRows] = useState<RoiRow[]>([]);
  const [roiTotals, setRoiTotals] = useState<RoiTotals | null>(null);
  const [roiError, setRoiError] = useState(false);
  // Derived (not effect state) so there's no synchronous setState in the effect body.
  const roiLoading = tab === "roi" && roiTotals === null && !roiError;
  useEffect(() => {
    if (tab !== "roi" || roiTotals) return;
    let cancelled = false;
    api.getROI()
      .then((d) => { if (!cancelled) { setRoiRows(d.rows); setRoiTotals(d.totals); } })
      .catch(() => { if (!cancelled) setRoiError(true); });
    return () => { cancelled = true; };
  }, [tab, roiTotals]);

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

  // Is any metric backed by real data yet? Drives the intentional empty-state so
  // bare zeros read as "not connected" instead of "failing". The provider seams
  // are wired server-side — connecting one flips the metric to live (CLAUDE.md).
  const hasSearchData = ranks.length > 0 || impressions.some((p) => p.impressions > 0 || p.clicks > 0);
  const hasAiData = aiSignals.some((s) => s.mentions > 0);
  const hasLeadsData = leads.length > 0;
  const hasAuthorityData =
    authority.health.score > 0 || authority.backlinkQuality.score > 0 || authority.health.backlinksAcquired > 0;
  const hasAnyData = hasSearchData || hasAiData || hasLeadsData || hasAuthorityData;

  // Unified insight (§13).
  const status: InsightStatus = !hasAnyData
    ? "stable"
    : m.slipping > 2
      ? "needs-attention"
      : m.slipping > 0
        ? "stable"
        : "improving";
  const headline = !hasAnyData
    ? "No analytics yet — connect a data source to start measuring rankings, search traffic, AI visibility, and leads."
    : `${m.aiMentions} AI mentions and ${compact(m.totalClicks)} clicks this period across ${pages.length} tracked pages. ${
        m.slipping > 0
          ? `${m.slipping} page${m.slipping > 1 ? "s" : ""} slipping — refresh to protect rank and leads.`
          : "Momentum is holding across the funnel."
      }`;

  const needsAction = [...pages]
    .filter((p) => p.currentRank > p.prevRank)
    .sort((a, b) => b.currentRank - b.prevRank - (a.currentRank - a.prevRank))
    .slice(0, 4);

  // Lead analytics lens (PRD §6.5).
  const cleanLeads = leads.filter((l) => l.spamStatus === "clean");
  const qualifiedLeads = cleanLeads.filter((l) => l.score >= 70);
  const avgLeadScore = cleanLeads.length
    ? Math.round(cleanLeads.reduce((a, l) => a + l.score, 0) / cleanLeads.length)
    : 0;
  const leadsByStatus = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const leadsByPage = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.pageTitle] = (acc[l.pageTitle] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const leadStats: { label: string; value: number | string; def: string }[] = [
    { label: "Qualified", value: qualifiedLeads.length, def: "Clean leads scoring ≥ 70." },
    { label: "Clean leads", value: cleanLeads.length, def: "Leads passing spam + duplicate filtering." },
    { label: "Total captured", value: leads.length, def: "All leads captured from published pages." },
    { label: "Avg score", value: cleanLeads.length ? avgLeadScore : "—", def: "Mean lead score across clean leads." },
  ];

  const MomentumIcon =
    authority.momentum.direction === "up"
      ? TrendingUp
      : authority.momentum.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <div className="space-y-5">
      {/* tabs */}
      <div
        role="tablist"
        aria-label="Analytics views"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

          {!hasAnyData && (
            <ConnectDataPrompt
              title="Connect a data source to see real analytics"
              description="Every metric below is empty because no provider is connected yet. Connect one and these fill with live data automatically — nothing here is fabricated."
              sources={[
                { metric: "Rankings, impressions & clicks", source: "Google Search Console" },
                { metric: "Keyword volume & difficulty", source: "DataForSEO" },
                { metric: "AI mentions & share of voice", source: "AI-citation tracker" },
                { metric: "Leads", source: "published pages" },
              ]}
            />
          )}

          {/* KPI strip — metrics backed by real data only */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-micro font-semibold uppercase text-muted-foreground">
                      {k.label}
                      <InfoHint>{k.def}</InfoHint>
                    </span>
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="tnum mt-1.5 text-kpi text-foreground">{k.value}</div>
                </div>
              );
            })}
          </div>
          <p className="text-label text-muted-foreground">
            Human-traffic, AI-bot, and conversion analytics appear once the analytics tracker and event pipeline are connected.
          </p>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            <Panel
              title="Content needing action"
              description="Pages slipping in rank — refresh to protect traffic and leads"
              className="lg:col-span-2"
            >
              {needsAction.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="Every tracked page is holding or gaining"
                  description="No pages are slipping in rank right now — nothing needs a refresh."
                />
              ) : (
                <ul className="space-y-2">
                  {needsAction.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/12 text-warning">
                        <LineChart className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-h-card text-foreground">{p.title}</div>
                        <div className="truncate font-mono text-micro text-muted-foreground">{p.path}</div>
                      </div>
                      <span className="tnum text-label text-negative">#{p.prevRank} → #{p.currentRank}</span>
                      <Link
                        href="/content"
                        className="inline-flex items-center gap-1 rounded-md text-label font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        Refresh <ArrowRight className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="AI Search Visibility" description="Brand citations in AI answers">
              {!hasAiData ? (
                <EmptyState
                  icon={Sparkles}
                  title="No AI mentions yet"
                  description="Citations appear once the AI-mention tracker starts monitoring answer engines."
                />
              ) : (
                <AiVisibilityLazy signals={aiSignals} />
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === "rankings" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-label text-muted-foreground">Ranking momentum and search traffic across tracked pages.</p>
            <Link
              href="/performance"
              className="inline-flex items-center gap-1 rounded-md text-label font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              Date-range view <ExternalLink className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Average Ranking" description="Mean SERP position over time — lower is better">
              {ranks.length === 0 ? (
                <EmptyState
                  icon={LineChart}
                  title="No ranking data yet"
                  description="Connect Google Search Console to chart SERP position over time."
                />
              ) : (
                <RankChartLazy data={ranks} />
              )}
            </Panel>
            <Panel title="Search Traffic" description="Impressions and clicks over time">
              {!hasSearchData ? (
                <EmptyState
                  icon={Bot}
                  title="No search traffic yet"
                  description="Impressions and clicks appear once Search Console is connected."
                />
              ) : (
                <TrafficChartLazy data={impressions} />
              )}
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
            {!hasAiData ? (
              <EmptyState
                icon={Sparkles}
                title="No AI mentions yet"
                description="Share of voice appears once the AI-mention tracker starts monitoring answer engines."
              />
            ) : (
              <AiVisibilityLazy signals={aiSignals} />
            )}
          </Panel>
          <Panel title="By engine" description="Mentions & share of voice" className="lg:col-span-2">
            {aiSignals.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No engines tracked yet"
                description="Per-engine mentions and share of voice appear once the AI-mention tracker is connected."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {aiSignals.map((s) => (
                    <div key={s.engine} className="rounded-xl border border-border p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-h-card text-foreground">{s.label}</span>
                        <Badge variant="muted" className="tnum">{s.shareOfVoice}% SOV</Badge>
                      </div>
                      <div className="tnum mt-1 text-title text-foreground">{s.mentions}</div>
                      <div className="text-micro text-muted-foreground">mentions this period</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-micro text-muted-foreground">
                  Per-prompt citations, cited URLs, and competitor mentions arrive with the AI-mention tracker (server jobs).
                </p>
              </>
            )}
          </Panel>
        </div>
      )}

      {tab === "pages" && (
        <Panel title="Content Performance" description="Every tracked page scored by rank movement — click to drill in" bodyClassName="px-1.5 pb-1.5">
          <TrackedPagesTable pages={pages} />
        </Panel>
      )}

      {tab === "leads" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {leadStats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-1 text-micro font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                  <InfoHint>{s.def}</InfoHint>
                </div>
                <div className="tnum mt-1.5 text-kpi text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <Panel title="By status" description="Where leads sit in the funnel">
              {leadsByStatus.length === 0 ? (
                <EmptyState icon={Inbox} title="No leads captured yet" description="Once visitors submit the lead form on a published page, the funnel breakdown appears here." className="py-10" />
              ) : (
                <ul className="space-y-2">
                  {leadsByStatus.map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between rounded-xl border border-border p-3 text-label">
                      <span className="capitalize text-foreground">{status.replace(/-/g, " ")}</span>
                      <span className="tnum font-semibold text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Top source pages" description="Pages capturing the most leads">
              {leadsByPage.length === 0 ? (
                <EmptyState icon={Target} title="No leads captured yet" description="When pages start converting, your top lead-capturing pages rank here." className="py-10" />
              ) : (
                <ul className="space-y-2">
                  {leadsByPage.map(([title, count]) => (
                    <li key={title} className="flex items-center gap-3 rounded-xl border border-border p-3 text-label">
                      <Target className="size-4 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{title}</span>
                      <span className="tnum font-semibold text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
          <Link href="/leads" className="inline-flex items-center gap-1 text-label font-semibold text-brand hover:underline">
            Open the leads inbox <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {tab === "authority" && (
        <div className="space-y-5">
          {!hasAuthorityData && (
            <ConnectDataPrompt
              title="Connect backlink data to measure authority"
              description="Domain health, backlink quality, and live DA are computed from your backlink profile. They stay at zero until a backlink/SERP provider is connected."
              sources={[
                { metric: "Backlink profile & live DA", source: "DataForSEO / Brave" },
                { metric: "Competitor authority", source: "competitor SERP" },
              ]}
            />
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Domain health</div>
              <div className="tnum mt-1.5 text-kpi text-foreground">
                {authority.health.score}
                <span className="ml-1 text-label font-medium text-muted-foreground">/ 100 · {authority.health.grade}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Backlink quality</div>
              <div className="tnum mt-1.5 text-kpi text-foreground">
                {authority.backlinkQuality.score}
                <span className="ml-1 text-label font-medium text-muted-foreground">/ 100 · {authority.backlinkQuality.grade}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Avg live DA</div>
              <div className="tnum mt-1.5 text-kpi text-foreground">{authority.backlinkQuality.avgLiveAuthority}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Backlinks acquired</div>
              <div className="tnum mt-1.5 text-kpi text-foreground">
                {authority.health.backlinksAcquired}
                <span className="ml-1 text-label font-medium text-muted-foreground">/ {authority.health.backlinksOpportunities}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-label shadow-card">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                authority.momentum.direction === "up"
                  ? "bg-positive/12 text-positive"
                  : authority.momentum.direction === "down"
                    ? "bg-negative/12 text-negative"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <MomentumIcon className="size-4" />
            </span>
            <span className="font-medium text-foreground">Momentum</span>
            <span className="text-muted-foreground">{authority.momentum.summary}</span>
          </div>
          <Panel title="Authority signals" description="The factors behind your domain health">
            <ul className="space-y-3">
              {authority.health.factors.map((f) => (
                <li key={f.label}>
                  <div className="mb-1.5 flex items-center justify-between text-label">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      {f.label}
                      {f.explanation && <InfoHint>{f.explanation}</InfoHint>}
                    </span>
                    <span className="tnum font-semibold text-muted-foreground">{f.score}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${f.score}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Link href="/authority" className="inline-flex items-center gap-1 text-label font-semibold text-brand hover:underline">
            Open the Authority workspace <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {tab === "roi" && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <a
              href="/api/v1/performance/report?range=30d"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-label font-medium text-foreground shadow-sm hover:bg-surface-sunken transition-colors"
            >
              <FileDown className="h-4 w-4 text-muted-foreground" />
              Download PDF report
            </a>
          </div>
          {roiLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-label">Loading ROI data…</div>
          )}
          {!roiLoading && roiTotals && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  { label: "Total impressions", value: compact(roiTotals.totalImpressions) },
                  { label: "Total clicks", value: compact(roiTotals.totalClicks) },
                  { label: "Clean leads", value: String(roiTotals.totalLeads) },
                  { label: "Won", value: String(roiTotals.totalWon) },
                  { label: "Pages with leads", value: String(roiTotals.pagesWithLeads) },
                ].map((s, i) => (
                  <div key={s.label} className={`card-lift rounded-2xl border border-border bg-card p-4 shadow-card animate-fade-in-up stagger-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}>
                    <div className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</div>
                    <div className="tnum mt-1.5 text-kpi text-foreground">{s.value}</div>
                  </div>
                ))}
              </div>
              <Panel
                title="Conversion by page"
                description="Impressions and clicks from search matched with lead capture per published page"
                bodyClassName="p-0"
              >
                {roiRows.length === 0 ? (
                  <EmptyState
                    icon={DollarSign}
                    title="No conversion data yet"
                    description="Once pages are published and leads are captured, ROI by page will appear here."
                    className="py-16"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-label">
                      <thead>
                        <tr className="border-b border-border bg-surface-sunken">
                          <th scope="col" className="px-5 py-3 text-micro font-semibold text-muted-foreground">Page</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Rank</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Impressions</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Clicks</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Leads</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Won</th>
                          <th scope="col" className="px-3 py-3 text-right text-micro font-semibold text-muted-foreground">Conv.</th>
                          <th scope="col" className="px-5 py-3 text-right text-micro font-semibold text-muted-foreground">Avg score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiRows.map((r) => (
                          <tr key={r.id} className="row-hover border-b border-border">
                            <td className="max-w-[220px] px-5 py-3">
                              <span className="block truncate font-semibold text-foreground" title={r.title}>{r.title}</span>
                              {r.slug && <span className="block truncate text-micro text-muted-foreground">{r.slug}</span>}
                            </td>
                            <td className="tnum px-3 py-3 text-right text-muted-foreground">{r.currentRank > 0 ? `#${r.currentRank}` : "—"}</td>
                            <td className="tnum px-3 py-3 text-right text-muted-foreground">{compact(r.impressions)}</td>
                            <td className="tnum px-3 py-3 text-right text-muted-foreground">{compact(r.clicks)}</td>
                            <td className={cn("tnum px-3 py-3 text-right font-semibold", r.leadCount > 0 ? "text-positive" : "text-muted-foreground")}>{r.leadCount}</td>
                            <td className="tnum px-3 py-3 text-right text-muted-foreground">{r.wonCount}</td>
                            <td className="tnum px-3 py-3 text-right">
                              <span className={cn("font-semibold", r.conversionRate >= 2 ? "text-positive" : r.conversionRate >= 0.5 ? "text-warning" : "text-muted-foreground")}>
                                {r.conversionRate > 0 ? `${r.conversionRate}%` : "—"}
                              </span>
                            </td>
                            <td className="tnum px-5 py-3 text-right font-semibold text-muted-foreground">{r.avgLeadScore > 0 ? r.avgLeadScore : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </>
          )}
        </div>
      )}
    </div>
  );
}
