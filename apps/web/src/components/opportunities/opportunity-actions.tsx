"use client";

import { useRouter } from "next/navigation";
import { Download, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

export function OpportunityHeaderActions() {
  const router = useRouter();
  const { notify, startJob, trackJob } = useAppFeedback();

  async function exportProspects() {
    await startJob("export", "Preparing backlink opportunities export.");
  }

  async function discoverMore() {
    try {
      const result = await api.discoverProspect();
      trackJob(result.job);
      notify({ kind: "success", title: "New prospect discovered", message: "The opportunities list has been updated." });
      router.refresh();
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={exportProspects}>
        <Download className="size-4" />
        Export
      </Button>
      <Button className="h-9 rounded-full px-4" onClick={discoverMore}>
        <Sparkles className="size-4" />
        Discover more
      </Button>
    </>
  );
}
