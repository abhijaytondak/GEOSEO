import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { Reveal } from "@/components/motion/reveal";
import { PerformanceActions, type RangeKey } from "@/components/performance/performance-actions";
import { RankChartLazy, TrafficChartLazy, AiVisibilityLazy } from "@/components/performance/lazy-charts";
import { TrackedPagesTable } from "@/components/performance/tracked-pages-table";
import { InsightBand, type InsightStatus } from "@/components/dashboard/insight-band";
import { DeltaChip } from "@/components/dashboard/delta-chip";
import { InfoHint } from "@/components/ui/info-hint";
import type { Delta } from "@geoseo/types";
import { compact } from "@/lib/format";

export const dynamic = "force-dynamic";

// Trailing-day window per range (the series is 90 daily points).
const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "8w": 56, quarter: 90 };
const VALID_RANGES: RangeKey[] = ["7d", "30d", "8w", "quarter"];

// Metric definitions surfaced as coaching tooltips (Performance PRD §8).
const KPI_DEFS: Record<string, string> = {
  "Avg. rank": "Mean SERP position across tracked pages. Lower is better.",
  Impressions: "Times your tracked pages appeared in search results this period.",
  Clicks: "Search clicks to your tracked pages this period.",
  "Avg. CTR": "Clicks ÷ impressions. Higher means your snippets earn more clicks.",
};

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const activeRange: RangeKey = VALID_RANGES.includes(range as RangeKey) ? (range as RangeKey) : "8w";
  const days = RANGE_DAYS[activeRange];

  const [ranksAll, impressionsAll, aiSignals, pages, overview] = await Promise.all([
    api.getRankSeries(),
    api.getImpressionSeries(),
    api.getAiVisibility(),
    api.getTrackedPages(),
    api.getPerformanceOverview(activeRange),
  ]);
  // Whether these numbers are real Search Console data or heuristic demo data (honesty: don't pass mock off as live).
  const isLiveData = overview.source === "gsc";

  const ranks = ranksAll.slice(-days);
  const impressions = impressionsAll.slice(-days);

  const avgRank = Math.round(
    ranks.reduce((a, p) => a + p.rank, 0) / ranks.length,
  );
  const totalImpr = impressions.reduce((a, p) => a + p.impressions, 0);
  const totalClicks = impressions.reduce((a, p) => a + p.clicks, 0);
  const ctr = ((totalClicks / totalImpr) * 100).toFixed(1);

  // Within-window movement (first half → second half) for per-KPI delta chips (§8).
  const half = Math.max(1, Math.floor(ranks.length / 2));
  const meanRank = (arr: typeof ranks) => (arr.length ? arr.reduce((a, p) => a + p.rank, 0) / arr.length : 0);
  const sumImpr = (arr: typeof impressions) => arr.reduce((a, p) => a + p.impressions, 0);
  const sumClicks = (arr: typeof impressions) => arr.reduce((a, p) => a + p.clicks, 0);
  const r1 = meanRank(ranks.slice(0, half));
  const r2 = meanRank(ranks.slice(half));
  const i1 = sumImpr(impressions.slice(0, half));
  const i2 = sumImpr(impressions.slice(half));
  const c1 = sumClicks(impressions.slice(0, half));
  const c2 = sumClicks(impressions.slice(half));
  const ctr1 = i1 ? (c1 / i1) * 100 : 0;
  const ctr2 = i2 ? (c2 / i2) * 100 : 0;
  const mkDelta = (a: number, b: number, goodWhen: "up" | "down"): Delta => ({
    pct: a ? Math.abs(Math.round(((b - a) / a) * 100)) : 0,
    direction: b > a ? "up" : b < a ? "down" : "flat",
    goodWhen,
  });

  const stats: { label: string; value: string; delta: Delta }[] = [
    { label: "Avg. rank", value: `#${avgRank}`, delta: mkDelta(r1, r2, "down") },
    { label: "Impressions", value: compact(totalImpr), delta: mkDelta(i1, i2, "up") },
    { label: "Clicks", value: compact(totalClicks), delta: mkDelta(c1, c2, "up") },
    { label: "Avg. CTR", value: `${ctr}%`, delta: mkDelta(ctr1, ctr2, "up") },
  ];

  // Insight summary band (Performance PRD §7): interpret the window in one line.
  const rankStart = ranks[0]?.rank ?? avgRank;
  const rankEnd = ranks[ranks.length - 1]?.rank ?? avgRank;
  const rankImproved = rankEnd < rankStart; // lower SERP position is better
  const rankMove = Math.abs(Math.round(rankStart - rankEnd));
  const imprStart = impressions[0]?.impressions ?? 0;
  const imprEnd = impressions[impressions.length - 1]?.impressions ?? 0;
  const imprUp = imprEnd >= imprStart;
  const imprPct = imprStart ? Math.round(((imprEnd - imprStart) / imprStart) * 100) : 0;
  const slipping = pages.filter((p) => p.currentRank > p.prevRank).length;
  const topGainer = [...pages].sort((a, b) => b.prevRank - b.currentRank - (a.prevRank - a.currentRank))[0];
  const perfStatus: InsightStatus =
    rankImproved && imprUp ? "improving" : !rankImproved && !imprUp ? "needs-attention" : "stable";
  const rankPhrase =
    rankMove === 0
      ? `Average rank is holding at #${avgRank}`
      : `Average rank ${rankImproved ? "improved" : "slipped"} ${rankMove} position${rankMove !== 1 ? "s" : ""}`;
  const tail =
    slipping > 0
      ? `${slipping} page${slipping > 1 ? "s" : ""} losing ground — refresh to protect rankings`
      : topGainer && topGainer.prevRank > topGainer.currentRank
        ? `${topGainer.title} is the biggest gainer`
        : "momentum is holding across tracked pages";
  const perfHeadline = `${rankPhrase} and impressions are ${imprUp ? "up" : "down"} ${Math.abs(imprPct)}%. ${tail}.`;

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Performance Trends"
        description="Ranking momentum, search traffic, and AI-answer visibility across your tracked pages."
        actions={<PerformanceActions activeRange={activeRange} />}
      />

      <div className="space-y-5 p-6 sm:p-8">
        {/* Data-source badge — distinguishes live Search Console data from heuristic demo data. */}
        <div className="flex items-center gap-2">
          <span
            className={
              isLiveData
                ? "inline-flex items-center gap-1.5 rounded-full bg-positive/12 px-2.5 py-1 text-[11.5px] font-medium text-positive"
                : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground"
            }
          >
            <span className={isLiveData ? "size-1.5 rounded-full bg-positive" : "size-1.5 rounded-full bg-muted-foreground"} />
            {isLiveData ? "Live · Google Search Console" : "Demo estimate — connect Search Console for live data"}
          </span>
        </div>

        {/* Insight summary band (§7) */}
        <InsightBand status={perfStatus} headline={perfHeadline} />

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                  <InfoHint>{KPI_DEFS[s.label]}</InfoHint>
                </span>
                <DeltaChip delta={s.delta} />
              </div>
              <div className="tnum mt-1.5 text-2xl font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              title="Average Ranking"
              description="Mean SERP position over time — lower is better"
            >
              <RankChartLazy data={ranks} />
            </Panel>
            <Panel
              title="Search Traffic"
              description="Impressions and clicks over time"
            >
              <TrafficChartLazy data={impressions} />
            </Panel>
          </div>
        </Reveal>

        {/* AI visibility + tracked pages */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Panel
              title="AI Search Visibility"
              description="Brand citations in AI answers"
            >
              <AiVisibilityLazy signals={aiSignals} />
            </Panel>

            <Panel
              title="Tracked Pages"
              description="Click any row to drill into its history"
              className="lg:col-span-2"
              bodyClassName="px-1.5 pb-1.5"
            >
              <TrackedPagesTable pages={pages} />
            </Panel>
          </div>
        </Reveal>
      </div>
    </>
  );
}
