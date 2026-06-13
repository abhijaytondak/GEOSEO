import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { SolutionsView } from "@/components/solutions/solutions-view";

export const dynamic = "force-dynamic";

export default async function SolutionsPage() {
  const solutions = await api.getSolutionReadiness();
  return (
    <>
      <PageHeader
        eyebrow="Internal"
        title="Solution Readiness"
        description="Honest, self-reported status of the AI Search, Lead Conversion, and Paid Boost engines — so we sell what's real."
      />
      <div className="p-6 sm:p-8">
        <SolutionsView solutions={solutions} />
      </div>
    </>
  );
}
