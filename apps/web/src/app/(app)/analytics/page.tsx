import Link from "next/link";
import { Calendar } from "lucide-react";
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
