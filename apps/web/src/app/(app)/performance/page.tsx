import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { PerformanceActions } from "@/components/performance/performance-actions";
import { RankChart } from "@/components/performance/rank-chart";
import { TrafficChart } from "@/components/performance/traffic-chart";
import { AiVisibility } from "@/components/performance/ai-visibility";
import { TrackedPagesTable } from "@/components/performance/tracked-pages-table";
import { compact } from "@/lib/format";

export default async function PerformancePage() {
  const [ranks, impressions, aiSignals, pages] = await Promise.all([
    api.getRankSeries(),
    api.getImpressionSeries(),
    api.getAiVisibility(),
    api.getTrackedPages(),
  ]);

  const avgRank = Math.round(
    ranks.reduce((a, p) => a + p.rank, 0) / ranks.length,
  );
  const totalImpr = impressions.reduce((a, p) => a + p.impressions, 0);
  const totalClicks = impressions.reduce((a, p) => a + p.clicks, 0);
  const ctr = ((totalClicks / totalImpr) * 100).toFixed(1);

  const stats = [
    { label: "Avg. rank", value: `#${avgRank}` },
    { label: "Impressions", value: compact(totalImpr) },
    { label: "Clicks", value: compact(totalClicks) },
    { label: "Avg. CTR", value: `${ctr}%` },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Performance Trends"
        description="Ranking momentum, search traffic, and AI-answer visibility across your tracked pages."
        actions={<PerformanceActions />}
      />

      <div className="space-y-5 p-6 sm:p-8">
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className="tnum mt-1.5 text-2xl font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel
            title="Average Ranking"
            description="Mean SERP position over time — lower is better"
          >
            <RankChart data={ranks} />
          </Panel>
          <Panel
            title="Search Traffic"
            description="Impressions and clicks over time"
          >
            <TrafficChart data={impressions} />
          </Panel>
        </div>

        {/* AI visibility + tracked pages */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel
            title="AI Search Visibility"
            description="Brand citations in AI answers"
          >
            <AiVisibility signals={aiSignals} />
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
      </div>
    </>
  );
}
