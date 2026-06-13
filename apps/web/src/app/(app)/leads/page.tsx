import { pageEngineApi } from "@/lib/page-engine-client";
import { PageHeader } from "@/components/shell/page-header";
import { LeadsView } from "@/components/leads/leads-view";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await pageEngineApi.getLeads();

  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Leads"
        description="Inbound leads captured from your published pages — spam-filtered, deduped, scored, and exportable."
      />
      <div className="p-6 sm:p-8">
        <LeadsView leads={leads} />
      </div>
    </>
  );
}
