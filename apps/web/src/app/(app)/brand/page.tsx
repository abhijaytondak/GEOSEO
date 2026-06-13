import { BrainCircuit } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/dashboard/panel";
import { BrandMemoryEditor } from "@/components/brand/brand-memory-editor";
import { VersionHistory } from "@/components/brand/version-history";

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
        description="Your brand's single source of truth — captured once, injected into every outreach and content agent so output always sounds like you."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground">
            <BrainCircuit className="size-4 text-brand" />
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
        }
      />

      <div className="space-y-5 p-6 sm:p-8">
        <BrandMemoryEditor initial={memory.profile} />

        <Panel title="Version History" description="Every edit is snapshotted — restore any point in time.">
          <VersionHistory versions={versions} />
        </Panel>
      </div>
    </>
  );
}
