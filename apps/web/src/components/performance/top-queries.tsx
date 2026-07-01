import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { compact } from "@/lib/format";

type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };

/**
 * Top search queries from Google Search Console — the real "what are we ranking for" view
 * (query · clicks · impressions · avg position). Populated once GSC is configured on the API
 * (`GSC_SERVICE_ACCOUNT_JSON` + `GSC_SITE_URL`); otherwise an honest connect/empty state.
 */
export function TopQueries({ configured, rows }: { configured: boolean; rows: GscRow[] }) {
  if (!configured || rows.length === 0) {
    return (
      <EmptyState
        icon={Search}
        tone="prompt"
        title={configured ? "No query data yet" : "Connect Google Search Console"}
        description={
          configured
            ? "Search Console hasn't reported queries for this range yet — check back once Google has crawled and ranked your pages."
            : "Add a Search Console service-account key (GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL) on the API to see the exact queries you rank for — with clicks, impressions, and average position."
        }
        className="py-12"
      />
    );
  }
  const top = [...rows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 15);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-label">
        <thead>
          <tr className="border-b border-border text-micro uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">Query</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Clicks</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Impressions</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Avg. position</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r) => (
            <tr key={r.key} className="border-b border-border/60 last:border-0">
              <th scope="row" className="max-w-xs truncate px-3 py-2 text-left font-medium text-foreground">{r.key}</th>
              <td className="tnum px-3 py-2 text-right font-semibold text-foreground">{compact(r.clicks)}</td>
              <td className="tnum px-3 py-2 text-right text-muted-foreground">{compact(r.impressions)}</td>
              <td className="tnum px-3 py-2 text-right text-muted-foreground">{r.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
