"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toCsv, downloadFile, dateStamp } from "@/lib/csv";
import { useAppFeedback } from "@/components/system/app-feedback";

export interface SummaryRow {
  metric: string;
  value: string;
}

/**
 * Export the Authority HQ executive summary as a real CSV artifact (PRD §21).
 * Rows are computed on the server and passed in, so the button stays presentational.
 */
export function OverviewExport({ rows }: { rows: SummaryRow[] }) {
  const { notify } = useAppFeedback();
  const [busy, setBusy] = useState(false);

  function exportSummary() {
    setBusy(true);
    try {
      const csv = toCsv(rows, [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Value" },
      ]);
      downloadFile(`authority-hq-summary-${dateStamp()}.csv`, csv);
      notify({ kind: "success", title: "Summary exported", message: `${rows.length} metrics downloaded as CSV.` });
    } catch (err) {
      notify({ kind: "error", title: "Export failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportSummary}
      disabled={busy}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Export
    </button>
  );
}
