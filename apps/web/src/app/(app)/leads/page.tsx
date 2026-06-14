import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { LeadsView } from "@/components/leads/leads-view";
import { LeadConfigActions } from "@/components/leads/lead-config-actions";
import { RoutingRules } from "@/components/leads/routing-rules";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [leads, rules, settings] = await Promise.all([
    pageEngineApi.getLeads(),
    pageEngineApi.getRoutingRules(),
    api.getSettings(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Leads"
        description="Inbound leads captured from your published pages — spam-filtered, deduped, scored, and exportable."
        actions={<LeadConfigActions />}
      />
      <div className="space-y-5 p-6 sm:p-8">
        <RoutingRules initialRules={rules} team={settings.team} />
        <LeadsView leads={leads} />
      </div>
    </>
  );
}
