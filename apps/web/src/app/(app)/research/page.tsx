import { pageEngineApi } from "@/lib/page-engine-client";
import { PageHeader } from "@/components/shell/page-header";
import { OpportunitiesExplorer } from "@/components/research/opportunities-explorer";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const opportunities = await pageEngineApi.getOpportunities();
  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Opportunity Explorer"
        description="Discover, score, and triage buyer-intent keyword opportunities — then generate pages from the winners."
      />
      <div className="p-6 sm:p-8">
        <OpportunitiesExplorer initial={opportunities} />
      </div>
    </>
  );
}
