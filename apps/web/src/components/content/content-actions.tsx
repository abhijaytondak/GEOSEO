"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

export function ContentHeaderActions({ stalePageIds }: { stalePageIds: string[] }) {
  const router = useRouter();
  const { notify, trackJob } = useAppFeedback();

  async function rescan() {
    try {
      const result = await api.rescanContent();
      trackJob(result.job);
      notify({ kind: "info", title: "Content rescan queued", message: `Scan #${result.scanCount} is running.` });
      router.refresh();
    } catch (err) {
      notify({ kind: "error", title: "Rescan failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function refreshStale() {
    try {
      const result = await api.refreshContent({ pageIds: stalePageIds, mode: "bulk" });
      trackJob(result.job);
      notify({ kind: "success", title: "Refresh queued", message: `${stalePageIds.length} stale pages queued.` });
    } catch (err) {
      notify({ kind: "error", title: "Refresh failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={rescan}>
        <RefreshCw className="size-4" />
        Re-scan
      </Button>
      <Button className="h-9 rounded-full px-4" onClick={refreshStale} disabled={stalePageIds.length === 0}>
        <Sparkles className="size-4" />
        Refresh stale pages
      </Button>
    </>
  );
}
