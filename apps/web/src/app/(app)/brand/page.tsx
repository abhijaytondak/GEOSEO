import { BrainCircuit } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { BrandWorkspace } from "@/components/brand/brand-workspace";

export const dynamic = "force-dynamic";

export default async function BrandMemoryPage() {
  const [memory, versions] = await Promise.all([
    api.getBrandMemory(),
    api.getBrandVersions(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Brand Memory"
        description="Your brand's single source of truth, captured once and injected into every outreach, page, content, analytics, and AI-search workflow."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground">
            <BrainCircuit className="size-4 text-brand" />
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
        }
      />

      <div className="space-y-5 p-6 sm:p-8">
        <BrandWorkspace profile={memory.profile} completeness={memory.completeness} versions={versions} />
      </div>
    </>
  );
}
