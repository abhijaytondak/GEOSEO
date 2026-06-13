"use client";

import { useState } from "react";
import { Download, Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toCsv, downloadFile, dateStamp } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

/** Dispatched after discovery so OpportunitiesView can prepend + highlight the new prospect. */
export const PROSPECT_DISCOVERED_EVENT = "geoseo:prospect-discovered";

export function OpportunityHeaderActions() {
  const { notify, trackJob } = useAppFeedback();
  const [exporting, setExporting] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  async function exportProspects() {
    setExporting(true);
    try {
      const prospects = await api.getProspects();
      const csv = toCsv(
        prospects.map((p) => ({ ...p, tags: p.tags.join(" | ") })),
        [
          { key: "domain", header: "Domain" },
          { key: "url", header: "URL" },
          { key: "industry", header: "Industry" },
          { key: "domainAuthority", header: "Domain Authority" },
          { key: "relevanceScore", header: "Relevance" },
          { key: "impactScore", header: "Impact" },
          { key: "trafficEstimate", header: "Est. Monthly Traffic" },
          { key: "status", header: "Status" },
          { key: "contactEmail", header: "Contact Email" },
          { key: "tags", header: "Tags" },
        ],
      );
      downloadFile(`backlink-opportunities-${dateStamp()}.csv`, csv);
      notify({ kind: "success", title: "Export ready", message: `${prospects.length} prospects downloaded as CSV.` });
    } catch (err) {
      notify({ kind: "error", title: "Export failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setExporting(false);
    }
  }

  async function discoverMore() {
    setDiscovering(true);
    try {
      const result = await api.discoverProspect();
      trackJob(result.job);
      // Hand the new prospect to the live list so it appears + highlights immediately.
      window.dispatchEvent(new CustomEvent(PROSPECT_DISCOVERED_EVENT, { detail: result.opportunity }));
      notify({ kind: "success", title: "New prospect discovered", message: `${result.opportunity.domain} added to the top of the list.` });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={exportProspects} disabled={exporting}>
        {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Export
      </Button>
      <Button className="h-9 rounded-full px-4" onClick={discoverMore} disabled={discovering}>
        {discovering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Discover more
      </Button>
    </>
  );
}
