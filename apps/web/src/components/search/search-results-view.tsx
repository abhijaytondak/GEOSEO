"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Loader2,
  Link2,
  AlertTriangle,
  LineChart,
  FileText,
  Telescope,
  UserRound,
  Activity,
  Settings,
  Sparkles,
  Workflow,
  History,
  type LucideIcon,
} from "lucide-react";
import type { SearchResult, SearchFacet, SearchEntityType } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { toCsv, downloadFile, dateStamp } from "@/lib/csv";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

const RESULT_ICONS: Record<string, LucideIcon> = {
  Link2,
  AlertTriangle,
  LineChart,
  FileText,
  Telescope,
  UserRound,
  Activity,
  Settings,
  Sparkles,
  Workflow,
  History,
};

const TYPE_LABEL: Record<SearchEntityType, string> = {
  prospect: "Prospects",
  outreach: "Outreach",
  "tracked-page": "Tracked pages",
  alert: "Alerts",
  content: "Content",
  brand: "Brand Memory",
  setting: "Settings",
  "page-opportunity": "Opportunities",
  "generated-page": "Pages",
  lead: "Leads",
  job: "Jobs",
  audit: "Activity",
  command: "Actions",
};

export function SearchResultsView({
  initialQuery,
  initialType,
  initialResults,
  initialFacets,
  initialTotal,
}: {
  initialQuery: string;
  initialType?: SearchEntityType;
  initialResults: SearchResult[];
  initialFacets: SearchFacet[];
  initialTotal: number;
}) {
  const router = useRouter();
  const { openJobs, notify } = useAppFeedback();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchEntityType | undefined>(initialType);
  const [results, setResults] = useState(initialResults);
  const [facets, setFacets] = useState(initialFacets);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);
  const reqId = useRef(0);

  // Re-fetch on query/type change (skips the first run — server already seeded
  // the initial data). Keeps the URL shareable via router.replace.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = ++reqId.current;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      const res = await api.search(query, { type, limit: 50 });
      if (id !== reqId.current) return;
      setResults(res.results);
      setFacets(res.facets);
      setTotal(res.total);
      setLoading(false);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (type) params.set("type", type);
      router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    }, 160);
    return () => window.clearTimeout(handle);
  }, [query, type, router]);

  const grouped = useMemo(() => {
    const by = new Map<SearchEntityType, SearchResult[]>();
    for (const r of results) {
      const list = by.get(r.type) ?? [];
      list.push(r);
      by.set(r.type, list);
    }
    return [...by.entries()].map(([t, items]) => ({ type: t, items }));
  }, [results]);

  function open(res: SearchResult) {
    if (res.type === "job") {
      openJobs();
      return;
    }
    if (res.href) router.push(res.href);
  }

  function exportResults() {
    if (results.length === 0) return;
    const csv = toCsv(
      results.map((r) => ({
        type: r.type,
        title: r.title,
        subtitle: r.subtitle ?? "",
        status: r.status ?? "",
        score: r.score,
      })),
      [
        { key: "type", header: "Type" },
        { key: "title", header: "Title" },
        { key: "subtitle", header: "Detail" },
        { key: "status", header: "Status" },
        { key: "score", header: "Score" },
      ],
    );
    downloadFile(`search-${query.trim() || "all"}-${dateStamp()}.csv`, csv);
    notify({ kind: "success", title: "Results exported", message: `${results.length} rows downloaded as CSV.` });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
      {/* facet rail (desktop) / chips (mobile) */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Filter by type
        </div>
        <div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-stretch">
          <button
            onClick={() => setType(undefined)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
              !type ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            All <span className="tnum opacity-70">· {total}</span>
          </button>
          {facets.map((f) => (
            <button
              key={f.type}
              onClick={() => setType(f.type)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
                type === f.type ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <span>{TYPE_LABEL[f.type]}</span>
              <span className="tnum opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* results column */}
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, prospects, alerts, leads…"
              aria-label="Search GEOSEO"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-10 text-sm outline-none transition-colors focus:border-ring"
            />
          </div>
          <button
            onClick={exportResults}
            disabled={results.length === 0}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        <div className="mb-3 text-[12.5px] text-muted-foreground">
          {total} result{total === 1 ? "" : "s"}
          {query.trim() ? <> for “<span className="font-medium text-foreground">{query.trim()}</span>”</> : null}
          {type ? <> in {TYPE_LABEL[type]}</> : null}
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-medium text-foreground">No results{query.trim() ? ` for “${query.trim()}”` : ""}.</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Try a domain, keyword, status, or a filter like <code className="rounded bg-muted px-1">da&gt;70</code> or{" "}
              <code className="rounded bg-muted px-1">type:alert</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <section key={group.type}>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {TYPE_LABEL[group.type]}
                </h2>
                <ul className="space-y-2">
                  {group.items.map((res) => {
                    const Icon = RESULT_ICONS[res.icon ?? ""] ?? Search;
                    return (
                      <li key={res.id}>
                        <button
                          onClick={() => open(res)}
                          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-brand/40 hover:bg-surface-sunken"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold text-foreground">{res.title}</span>
                            {res.subtitle && (
                              <span className="block truncate text-[12px] text-muted-foreground">{res.subtitle}</span>
                            )}
                          </span>
                          {res.metrics?.slice(0, 2).map((m) => (
                            <span key={m.label || String(m.value)} className="hidden shrink-0 text-right sm:block">
                              {m.label && <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</span>}
                              <span className="tnum text-[13px] font-semibold text-foreground">{m.value}</span>
                            </span>
                          ))}
                          {res.status && (
                            <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[10.5px] font-medium capitalize text-muted-foreground">
                              {res.status}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
