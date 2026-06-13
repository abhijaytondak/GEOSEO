import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { OpportunitiesView } from "@/components/opportunities/opportunities-view";
import { OpportunityHeaderActions } from "@/components/opportunities/opportunity-actions";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const [prospects, brand] = await Promise.all([
    api.getProspects(),
    api.getBrandProfile(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Backlinks"
        title="Backlink Opportunities"
        description="High-authority, topically relevant prospects ranked by impact — ready for outreach."
        actions={<OpportunityHeaderActions />}
      />

      {/* Pipeline summary lives in OpportunitiesView (clickable + reactive to live state). */}
      <div className="space-y-5 p-6 sm:p-8">
        <OpportunitiesView prospects={prospects} brand={brand} initialQuery={params?.query ?? ""} />
      </div>
    </>
  );
}
