import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { OpportunitiesView } from "@/components/opportunities/opportunities-view";
import { OpportunityHeaderActions } from "@/components/opportunities/opportunity-actions";
import { compact } from "@/lib/format";

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

  const highImpact = prospects.filter((p) => p.impactScore >= 80).length;
  const avgDa = Math.round(
    prospects.reduce((a, p) => a + p.domainAuthority, 0) / prospects.length,
  );
  const reach = prospects.reduce((a, p) => a + p.trafficEstimate, 0);

  const stats = [
    { label: "Prospects", value: String(prospects.length) },
    { label: "High-impact (80+)", value: String(highImpact) },
    { label: "Avg. authority", value: String(avgDa) },
    { label: "Combined reach", value: compact(reach) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Backlinks"
        title="Backlink Opportunities"
        description="High-authority, topically relevant prospects ranked by impact — ready for outreach."
        actions={<OpportunityHeaderActions />}
      />

      <div className="space-y-5 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {s.label}
              </div>
              <div className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <OpportunitiesView prospects={prospects} brand={brand} initialQuery={params?.query ?? ""} />
      </div>
    </>
  );
}
