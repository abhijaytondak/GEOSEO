import type { ReactNode } from "react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import {
  PipelineStageNav,
  PIPELINE_STAGES,
  resolvePipelineStage,
} from "@/components/pipeline/pipeline-stage-nav";
import { OpportunitiesExplorer } from "@/components/research/opportunities-explorer";
import { PagesView } from "@/components/pages/pages-view";
import { PublishingSettings } from "@/components/pages/publishing-settings";
import { ContentView } from "@/components/content/content-view";
import { ConversionAuditView } from "@/components/conversion/conversion-audit-view";

export const dynamic = "force-dynamic";

/**
 * Pipeline — the workflow-first page-engine workspace
 * (docs/PRD-workflow-navigation-optimization.md §6.2). A persistent stage
 * switcher drives `?stage=`; only the active stage's data is fetched, and each
 * stage reuses the existing rich view. Plan / Publish / Refresh currently share
 * the page-engine workspace (PagesView); full per-stage panelization is the
 * flagged medium-risk follow-up (component extraction). Old `/research`,
 * `/pages`, `/content`, `/conversion-audit` routes still work standalone.
 */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage: rawStage } = await searchParams;
  const stage = resolvePipelineStage(rawStage);
  const meta = PIPELINE_STAGES.find((s) => s.id === stage)!;

  // Fetch only what the active stage needs.
  let body: ReactNode;
  if (stage === "discover") {
    const opportunities = await pageEngineApi.getOpportunities();
    body = <OpportunitiesExplorer initial={opportunities} />;
  } else if (stage === "create") {
    const [pages, suggestions] = await Promise.all([
      api.getTrackedPages(),
      api.getInternalLinkSuggestions(),
    ]);
    body = <ContentView pages={pages} suggestions={suggestions} />;
  } else if (stage === "review") {
    body = <ConversionAuditView />;
  } else {
    // plan | publish | refresh → the page-engine workspace (blueprints, drafts,
    // publish flow, and refresh recommendations all live here today).
    const [pages, opportunities, blueprints, recommendations] = await Promise.all([
      pageEngineApi.getPages(),
      pageEngineApi.getOpportunities(),
      pageEngineApi.getBlueprints(),
      pageEngineApi.getRefreshRecommendations(),
    ]);
    body = (
      <PagesView
        pages={pages}
        opportunities={opportunities}
        blueprints={blueprints}
        recommendations={recommendations}
      />
    );
  }

  const showPublishing = stage === "plan" || stage === "publish";

  return (
    <>
      <PageHeader
        eyebrow="Growth Pipeline"
        title="Pipeline"
        description="From discovering buyer intent to publishing pages and refreshing them as evidence arrives — one workflow."
        actions={showPublishing ? <PublishingSettings /> : undefined}
      />
      <PipelineStageNav active={stage} />
      <div className="border-b border-border bg-muted/30 px-6 py-3 sm:px-8">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Stage {meta.n} · {meta.title}.
          </span>{" "}
          {meta.focus}
        </p>
      </div>
      <div className="p-6 sm:p-8">{body}</div>
    </>
  );
}
