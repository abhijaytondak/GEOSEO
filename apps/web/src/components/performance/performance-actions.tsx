"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toCsv, downloadFile, dateStamp } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

export type RangeKey = "7d" | "30d" | "8w" | "quarter";
const ORDER: RangeKey[] = ["7d", "30d", "8w", "quarter"];
export const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "8w": "Last 8 weeks",
  quarter: "Last quarter",
};

export function PerformanceActions({ activeRange }: { activeRange: RangeKey }) {
  const { notify } = useAppFeedback();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  function cycleRange() {
    const next = ORDER[(ORDER.indexOf(activeRange) + 1) % ORDER.length];
    // Re-renders the server component with the new window — charts + stats update.
    router.push(`/performance?range=${next}`, { scroll: false });
  }

  async function exportReport() {
    setExporting(true);
    try {
      const pages = await api.getTrackedPages();
      const csv = toCsv(
        pages.map((p) => ({ ...p, rankDelta: p.prevRank - p.currentRank })),
        [
          { key: "title", header: "Page" },
          { key: "path", header: "Path" },
          { key: "currentRank", header: "Current Rank" },
          { key: "prevRank", header: "Previous Rank" },
          { key: "rankDelta", header: "Rank Δ" },
          { key: "impressions", header: "Impressions" },
          { key: "clicks", header: "Clicks" },
        ],
      );
      downloadFile(`performance-${dateStamp()}.csv`, csv);
      notify({ kind: "success", title: "Export ready", message: `${pages.length} tracked pages downloaded as CSV.` });
    } catch (err) {
      notify({ kind: "error", title: "Export failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={cycleRange}>
        <Calendar className="size-4" />
        {RANGE_LABEL[activeRange]}
      </Button>
      <Button variant="outline" className="h-9" onClick={exportReport} disabled={exporting}>
        {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Export
      </Button>
    </>
  );
}
