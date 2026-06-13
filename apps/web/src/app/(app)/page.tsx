import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import type { BacklinkStatus } from "@geoseo/types";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { HealthGauge } from "@/components/dashboard/health-gauge";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { DeltaChip } from "@/components/dashboard/delta-chip";
import { AlertsList } from "@/components/dashboard/alerts-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AuthorityActions } from "@/components/dashboard/authority-actions";
import { thousands } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<BacklinkStatus, { label: string; dot: string; bar: string }> = {
  live: { label: "Live", dot: "bg-positive", bar: "bg-positive" },
  pending: { label: "Pending", dot: "bg-warning", bar: "bg-warning" },
  lost: { label: "Lost", dot: "bg-muted-foreground", bar: "bg-muted-foreground" },
  broken: { label: "Broken", dot: "bg-negative", bar: "bg-negative" },
};

export default async function AuthorityHQ() {
  const [kpis, health, alerts, activity, backlinks] = await Promise.all([
    api.getKpis(),
    api.getDomainHealth(),
    api.getAlerts(),
    api.getActivity(),
    api.getBacklinks(),
  ]);

  const acquiredPct = Math.round(
    (health.backlinksAcquired / health.backlinksOpportunities) * 100,
  );

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
        eyebrow="Overview"
        title="Authority HQ"
        description="Your domain authority, backlink momentum, and what to act on next — at a glance."
        actions={
          <AuthorityActions />
        }
      />

      <div className="space-y-5 p-6 sm:p-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.id} kpi={kpi} index={i} />
          ))}
        </div>

        {/* Workspace: two independent columns so the taller right rail never
            leaves a void under the shorter left panels */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* left column — health + activity */}
          <div className="space-y-5 lg:col-span-2">
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
                        <span className="font-medium text-foreground">{f.label}</span>
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
          <div className="space-y-5">
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
            <AlertsList alerts={alerts} />
          </Panel>

          <Panel title="Backlink Profile" description={`${totalLinks} tracked links`}>
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
