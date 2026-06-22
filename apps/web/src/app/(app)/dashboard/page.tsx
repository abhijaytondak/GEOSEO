import Link from "next/link";
import { Rocket, Eye, Inbox, Target, Telescope, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { AlertsList } from "@/components/dashboard/alerts-panel";
import { AiVisibility } from "@/components/performance/ai-visibility";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PageEngineDashboard() {
  const [pages, leads, opportunities, recs, aiSignals, alerts, audit] = await Promise.all([
    pageEngineApi.getPages(),
    pageEngineApi.getLeads(),
    pageEngineApi.getOpportunities(),
    pageEngineApi.getRefreshRecommendations(),
    api.getAiVisibility(),
    api.getAlerts(),
    pageEngineApi.getAudit(),
  ]);

  const published = pages.filter((p) => p.status === "published").length;
  const awaiting = pages.filter((p) => ["draft", "in-review", "approved"].includes(p.status)).length;
  const cleanLeads = leads.filter((l) => l.spamStatus === "clean");
  const qualified = leads.filter((l) => l.status === "qualified" || l.status === "won").length;
  const conversion = cleanLeads.length ? Math.round((qualified / cleanLeads.length) * 100) : 0;
  const avgScore = cleanLeads.length
    ? Math.round(cleanLeads.reduce((a, l) => a + l.score, 0) / cleanLeads.length)
    : 0;
  const newOpps = opportunities.filter((o) => o.status === "new").length;

  const kpis = [
    { label: "Published pages", value: published, icon: Rocket, href: "/pages" },
    { label: "Awaiting", value: awaiting, icon: Eye, href: "/pages" },
    { label: "Qualified leads", value: qualified, icon: Target, href: "/leads" },
    { label: "Lead conversion", value: `${conversion}%`, icon: TrendingUp, href: "/leads" },
    { label: "Avg lead score", value: avgScore, icon: Inbox, href: "/leads" },
    { label: "New opportunities", value: newOpps, icon: Telescope, href: "/research" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Dashboard"
        description="Your content engine at a glance — pages published, leads captured, and what needs attention."
      />
      <div className="space-y-5 p-6 sm:p-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link
                key={k.label}
                href={k.href}
                className="group rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="flex items-center justify-between">
                  <span className="text-micro text-muted-foreground">{k.label}</span>
                  <Icon className="size-4 text-muted-foreground group-hover:text-brand" />
                </div>
                <div className="tnum mt-1.5 text-kpi text-foreground">{k.value}</div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* needs attention */}
          <Panel
            title="Needs Attention"
            description="Pages flagged by monitoring"
            className="lg:col-span-2"
            bodyClassName={recs.length ? "p-0" : undefined}
            action={
              <Link href="/pages" className="inline-flex items-center gap-1 text-label font-semibold text-brand hover:underline">
                Open Pages <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {recs.length === 0 ? (
              <p className="py-6 text-center text-label text-muted-foreground">Everything looks healthy — no refresh needed.</p>
            ) : (
              <div className="divide-y divide-border">
                {recs.map((r) => (
                  <div key={r.pageId} className="flex items-center gap-3 px-5 py-3">
                    <Badge variant={r.action === "rebuild" ? "negative" : "warning"} className="shrink-0 capitalize">
                      {r.action}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-label font-semibold text-foreground">{r.title}</div>
                      <div className="truncate text-label text-muted-foreground">{r.reason}</div>
                    </div>
                    <RefreshCw className="size-3.5 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* AI visibility */}
          <Panel title="AI Search Visibility" description="Brand citations in AI answers">
            <AiVisibility signals={aiSignals} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* alerts */}
          <Panel
            title="Recent Alerts"
            description="Ranking, backlink, and visibility signals"
            className="lg:col-span-2"
            action={
              <Link href="/alerts" className="inline-flex items-center gap-1 text-label font-semibold text-brand hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <AlertsList alerts={alerts.slice(0, 4)} />
          </Panel>

          {/* audit / activity log */}
          <Panel title="Activity Log" description="Audited actions">
            {audit.length === 0 ? (
              <p className="py-6 text-center text-label text-muted-foreground">No actions logged yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {audit.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-label">
                    <Badge variant="muted" className="shrink-0 capitalize">
                      {a.action}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {a.entity} <span className="text-muted-foreground">{a.entityId}</span>
                    </span>
                    <span className="shrink-0 text-micro text-muted-foreground/70">{relativeTime(a.at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
