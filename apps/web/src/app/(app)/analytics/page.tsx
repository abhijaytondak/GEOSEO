import Link from "next/link";
import { Calendar, PlugZap, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { pageEngineApi } from "@/lib/page-engine-client";
import { PageHeader } from "@/components/shell/page-header";
import { AnalyticsWorkspace } from "@/components/analytics/analytics-workspace";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [ranks, impressions, aiSignals, pages, leads, authority] = await Promise.all([
    api.getRankSeries(),
    api.getImpressionSeries(),
    api.getAiVisibility(),
    api.getTrackedPages(),
    pageEngineApi.getLeads(),
    api.getAuthorityOverview(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        description="Human traffic, AI bot activity, AI mentions, rankings, leads, and page performance in one place."
        actions={
          <Link
            href="/performance"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted"
          >
            <Calendar className="size-4" />
            Date-range view
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {impressions.length === 0 && ranks.length === 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <PlugZap className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-foreground">Connect a data source to see real analytics</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Rankings, impressions, and clicks come from <span className="font-medium text-foreground">Google Search Console</span>; keywords
                &amp; backlinks from <span className="font-medium text-foreground">DataForSEO</span>. Until you connect one, these stay empty — we never show estimated numbers.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-brand-foreground transition-transform hover:scale-[1.02] sm:self-auto"
            >
              Connect in Settings <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
        <AnalyticsWorkspace
          ranks={ranks}
          impressions={impressions}
          aiSignals={aiSignals}
          pages={pages}
          leads={leads}
          authority={authority}
        />
      </div>
    </>
  );
}
