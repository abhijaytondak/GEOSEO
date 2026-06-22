import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { InfoHint } from "@/components/ui/info-hint";
import { api } from "@/lib/api-client";
import type { BacklinkStatus, KpiId } from "@geoseo/types";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InsightBand, type InsightStatus } from "@/components/dashboard/insight-band";
import { HealthGauge } from "@/components/dashboard/health-gauge";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { DeltaChip } from "@/components/dashboard/delta-chip";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AuthorityActions } from "@/components/dashboard/authority-actions";
import { ActionCenter } from "@/components/dashboard/action-center";
import { BrandScorecard } from "@/components/dashboard/brand-scorecard";
import { OutcomeStrip } from "@/components/dashboard/outcome-strip";
import { SetupHealth } from "@/components/dashboard/setup-health";
import { GrowthPlan } from "@/components/dashboard/growth-plan";
import { BrandMemoryCard } from "@/components/dashboard/brand-memory-card";
import { OverviewExport, type SummaryRow } from "@/components/dashboard/overview-export";
import { deriveAuthorityActions } from "@/lib/authority-actions";
import { thousands } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<BacklinkStatus, { label: string; dot: string; bar: string }> = {
  live: { label: "Live", dot: "bg-positive", bar: "bg-positive" },
  pending: { label: "Pending", dot: "bg-warning", bar: "bg-warning" },
  lost: { label: "Lost", dot: "bg-muted-foreground", bar: "bg-muted-foreground" },
  broken: { label: "Broken", dot: "bg-negative", bar: "bg-negative" },
};

// KPI card → relevant deep route (Authority HQ PRD §8 click navigation).
const KPI_HREF: Record<KpiId, string> = {
  "total-backlinks": "/opportunities",
  "avg-rank": "/performance",
  "domain-authority": "/performance",
  "ai-visibility": "/performance",
};

export default async function AuthorityHQ() {
  const [kpis, overview, alerts, activity, backlinks, prospects] = await Promise.all([
    api.getKpis(),
    api.getAuthorityOverview(),
    api.getAlerts(),
    api.getActivity(),
    api.getBacklinks(),
    api.getProspects(),
  ]);
  const { health, backlinkQuality, momentum } = overview;

  const acquiredPct =
    health.backlinksOpportunities > 0
      ? Math.round((health.backlinksAcquired / health.backlinksOpportunities) * 100)
      : 0;

  // Nothing connected yet → don't phrase zeros as a failing/"holding" score.
  const notMeasured = health.score <= 0;

  // Insight Summary Band (§7): interpret the dashboard in one sentence.
  const openCritical = alerts.filter((a) => a.severity === "critical" && !a.resolved).length;
  const openWarnings = alerts.filter((a) => a.severity === "warning" && !a.resolved).length;
  const dir = health.delta.direction;
  const pct = Math.abs(health.delta.pct);
  const insightStatus: InsightStatus =
    openCritical > 0 ? "needs-attention" : dir === "down" ? "needs-attention" : dir === "up" ? "improving" : "stable";
  const movement = notMeasured
    ? "Domain health isn't measured yet — connect backlink data to start tracking authority"
    : dir === "flat"
      ? `Domain health is holding at ${health.score}/100 (grade ${health.grade})`
      : `Domain health is ${dir === "up" ? "up" : "down"} ${pct}% to ${health.score}/100 (grade ${health.grade})`;
  const attention =
    openCritical > 0
      ? `${openCritical} critical alert${openCritical > 1 ? "s" : ""} need${openCritical > 1 ? "" : "s"} attention`
      : openWarnings > 0
        ? `${openWarnings} warning${openWarnings > 1 ? "s" : ""} to review`
        : notMeasured
          ? "Finish setup to populate your dashboard"
          : `${acquiredPct}% of backlink opportunities captured`;
  const insightHeadline = `${movement}. ${attention}.`;

  // Action Center (§10) — prioritized next-actions derived from current state.
  const authorityActions = deriveAuthorityActions({ alerts, backlinks, prospects, health });

  // Executive summary rows for CSV export (§21).
  const fmtDelta = (d: { pct: number; direction: string }) =>
    `${d.direction === "up" ? "+" : d.direction === "down" ? "-" : ""}${Math.abs(d.pct)}%`;
  const summaryRows: SummaryRow[] = [
    { metric: "Domain health", value: `${health.score}/100 (grade ${health.grade})` },
    ...kpis.map((k) => ({ metric: k.label, value: `${k.prefix ?? ""}${k.value}${k.unit} (${fmtDelta(k.delta)})` })),
    { metric: "Backlinks — live", value: String(backlinks.filter((b) => b.status === "live").length) },
    { metric: "Backlinks — pending", value: String(backlinks.filter((b) => b.status === "pending").length) },
    { metric: "Backlinks — lost", value: String(backlinks.filter((b) => b.status === "lost").length) },
    { metric: "Backlinks — broken", value: String(backlinks.filter((b) => b.status === "broken").length) },
    { metric: "Open alerts", value: String(alerts.filter((a) => !a.resolved).length) },
    ...authorityActions.slice(0, 3).map((a, i) => ({ metric: `Top action ${i + 1}`, value: a.title })),
  ];

  const statusCounts = (["live", "pending", "lost", "broken"] as BacklinkStatus[]).map(
    (status) => ({
      status,
      count: backlinks.filter((b) => b.status === status).length,
    }),
  );
  const totalLinks = backlinks.length;

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title="Growth Command Center"
        description="Your growth status, the next best actions, and what your agents did — at a glance."
        actions={
          <>
            <OverviewExport rows={summaryRows} />
            <AuthorityActions />
          </>
        }
      />

      <div className="space-y-5 p-6 sm:p-8">
        {/* Insight summary band (§7) */}
        <InsightBand status={insightStatus} headline={insightHeadline} source="Sample data" />

        {/* Growth Plan — holistic, one-click actionable hub (nav-optimization PRD §6.1) */}
        <GrowthPlan />

        {/* Home cockpit — business outcome (leads-first) + setup health (nav-optimization PRD §6.1) */}
        <div className="grid gap-5 lg:grid-cols-2">
          <OutcomeStrip />
          <SetupHealth />
        </div>

        {/* Brand Memory entry point — the AI's single source of truth (self-fetching) */}
        <BrandMemoryCard />

        {/* Brand Scorecard — auto-analysis of the workspace's own domain (self-fetching) */}
        <BrandScorecard />

        {/* Momentum / forecast (Authority HQ §Phase2) */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] shadow-card">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              momentum.direction === "up"
                ? "bg-positive/12 text-positive"
                : momentum.direction === "down"
                  ? "bg-negative/12 text-negative"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {momentum.direction === "up" ? (
              <TrendingUp className="size-4" />
            ) : momentum.direction === "down" ? (
              <TrendingDown className="size-4" />
            ) : (
              <Minus className="size-4" />
            )}
          </span>
          <span className="font-medium text-foreground">Momentum</span>
          <span className="text-muted-foreground">{momentum.summary}</span>
        </div>

        {/* KPI strip — each card deep-links to its detail route (§8) */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <Link
              key={kpi.id}
              href={KPI_HREF[kpi.id]}
              aria-label={`${kpi.label}: open details`}
              className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <KpiCard kpi={kpi} index={i} />
            </Link>
          ))}
        </div>

        {/* Workspace: two independent columns. On mobile the Action Center
            (right rail) comes first (§17.1 priority); on desktop the analytical
            column sits on the left via grid order. */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* left column — health + activity */}
          <div className="order-2 space-y-5 lg:order-1 lg:col-span-2">
          <Panel
            title="Domain Health"
            description="Composite authority across 4 signals"
            action={<DeltaChip delta={health.delta} />}
          >
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex justify-center">
                <HealthGauge score={health.score} grade={health.grade} />
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  {health.factors.map((f, i) => (
                    <div key={f.label}>
                      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          {f.label}
                          {f.explanation && <InfoHint>{f.explanation}</InfoHint>}
                        </span>
                        <span className="tnum font-semibold text-muted-foreground">
                          {f.score}
                        </span>
                      </div>
                      <ProgressBar value={f.score} height={7} delay={i * 0.06} />
                    </div>
                  ))}
                </div>

                {/* acquisition progress */}
                <div className="rounded-xl border border-border bg-surface-sunken p-3.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-foreground">Backlinks acquired</span>
                    <span className="tnum text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {thousands(health.backlinksAcquired)}
                      </span>{" "}
                      / {thousands(health.backlinksOpportunities)}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <ProgressBar value={acquiredPct} from="#6C4CF1" to="#2D6BFF" height={8} />
                  </div>
                  <div className="mt-2 text-[11.5px] text-muted-foreground">
                    {acquiredPct}% of discovered opportunities captured
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Recent Activity">
            <ActivityFeed events={activity} />
          </Panel>
          </div>

          {/* right column — actions + profile */}
          <div className="order-1 space-y-5 lg:order-2">
          <Panel
            title="Action Center"
            description="Prioritized by impact"
            action={
              <Link
                href="/alerts"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
              >
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <ActionCenter actions={authorityActions} />
          </Panel>

          <Panel
            title="Backlink Profile"
            description={`${totalLinks} tracked · quality ${backlinkQuality.score}/100 (grade ${backlinkQuality.grade}) · avg live DA ${backlinkQuality.avgLiveAuthority}`}
          >
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {statusCounts.map(({ status, count }) =>
                count > 0 ? (
                  <div
                    key={status}
                    className={cn("h-full", STATUS_STYLE[status].bar)}
                    style={{ width: `${(count / totalLinks) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {statusCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", STATUS_STYLE[status].dot)} />
                  <span className="text-[12.5px] text-muted-foreground">
                    {STATUS_STYLE[status].label}
                  </span>
                  <span className="tnum ml-auto text-[13px] font-semibold text-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/opportunities"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Sparkles className="size-4 text-brand" />
              Find new opportunities
            </Link>
          </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
