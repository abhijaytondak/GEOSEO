import { PageHeader } from "@/components/shell/page-header";
import { CompetitorAnalysisView } from "@/components/competitors/competitor-analysis-view";

export default function CompetitorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Competitors"
        description="Who ranks for your target keywords, where the gaps are, and how visible you are — from free search data."
      />
      <div className="p-6 sm:p-8">
        <CompetitorAnalysisView />
      </div>
    </>
  );
}
