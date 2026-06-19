"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { FunnelStage, KeywordOpportunity, OpportunityStatus, SearchIntent } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { draftWithPuter } from "@/lib/puter-ai";
import { Button } from "@/components/ui/button";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

const INTENT_CLS: Record<SearchIntent, string> = {
  commercial: "bg-brand/12 text-brand",
  transactional: "bg-positive/12 text-positive",
  comparison: "bg-info/12 text-info",
  informational: "bg-muted text-muted-foreground",
  local: "bg-warning/15 text-warning",
  navigational: "bg-muted text-muted-foreground",
};
const STAGE_META: Record<FunnelStage, { label: string; cls: string }> = {
  research: { label: "Research", cls: "bg-muted text-muted-foreground" },
  consideration: { label: "Consideration", cls: "bg-info/12 text-info" },
  "ready-to-buy": { label: "Ready to buy", cls: "bg-positive/12 text-positive" },
};
const STATUS_CLS: Record<OpportunityStatus, string> = {
  new: "bg-info/12 text-info",
  approved: "bg-positive/12 text-positive",
  rejected: "bg-muted text-muted-foreground",
  deferred: "bg-warning/15 text-warning",
};

type SortKey = "impact" | "volume" | "difficulty" | "commercialValue" | "confidence";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "impact", label: "Impact" },
  { key: "volume", label: "Volume" },
  { key: "difficulty", label: "Difficulty" },
  { key: "commercialValue", label: "Value" },
  { key: "confidence", label: "Confidence" },
];

// blended impact: value × volume reach ÷ difficulty
function impact(o: KeywordOpportunity): number {
  const reach = Math.min(100, Math.log10(Math.max(10, o.volume)) * 22);
  return Math.round(o.commercialValue * 0.5 + reach * 0.3 + (100 - o.difficulty) * 0.2);
}

type DiscoverJob = { id: string; status: "running" | "completed" | "failed"; created: number; error?: string };

/** Minimal self-contained call through the Next BFF (avoids the shared client). */
async function apiJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.errors?.[0] ?? `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

export function OpportunitiesExplorer({ initial }: { initial: KeywordOpportunity[] }) {
  const { notify } = useAppFeedback();
  const [opps, setOpps] = useState(initial);
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState<SearchIntent | "all">("all");
  const [status, setStatus] = useState<OpportunityStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("impact");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [seeds, setSeeds] = useState("");
  const [discovering, setDiscovering] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return opps
      .filter((o) => (intent === "all" ? true : o.intent === intent))
      .filter((o) => (status === "all" ? true : o.status === status))
      .filter((o) => (q ? o.query.toLowerCase().includes(q) || o.clusterLabel.toLowerCase().includes(q) : true))
      .sort((a, b) => (sort === "impact" ? impact(b) - impact(a) : b[sort] - a[sort]));
  }, [opps, query, intent, status, sort]);

  function patch(id: string, next: Partial<KeywordOpportunity>) {
    setOpps((arr) => arr.map((o) => (o.id === id ? { ...o, ...next } : o)));
  }

  async function act(id: string, kind: "approve" | "reject" | "defer") {
    setBusy(id);
    try {
      const fn =
        kind === "approve" ? pageEngineApi.approveOpportunity : kind === "reject" ? pageEngineApi.rejectOpportunity : pageEngineApi.deferOpportunity;
      const updated = await fn(id);
      patch(id, { status: updated.status });
    } catch (err) {
      notify({ kind: "error", title: "Action failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function generate(o: KeywordOpportunity) {
    setBusy(o.id);
    try {
      const content = await draftWithPuter(o.query, o.recommendedPageType);
      await pageEngineApi.generatePage(o.id, content ?? undefined);
      patch(o.id, { status: "approved" });
      notify({
        kind: "success",
        title: content ? "AI page drafted" : "Page drafted",
        message: `"${o.query}" → draft created. Review it in Pages.`,
      });
    } catch (err) {
      notify({ kind: "error", title: "Generation failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function runDiscover() {
    const list = seeds.split(",").map((s) => s.trim()).filter(Boolean);
    if (!list.length) return;
    setDiscovering(true);
    try {
      // LLM-backed discovery (AI-search + intent classification) can take 20-40s —
      // longer than the BFF request budget — so start a job and poll it.
      let job = await apiJson<DiscoverJob>("POST", "/api/v1/opportunities/discover-async", { seeds: list });
      for (let i = 0; i < 40 && job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        job = await apiJson<DiscoverJob>("GET", `/api/v1/opportunities/discover-async/${job.id}`);
      }
      if (job.status === "failed") throw new Error(job.error ?? "Discovery failed");
      if (job.status === "running") throw new Error("Discovery is still running — refresh in a moment.");
      const { opportunities } = await apiJson<{ opportunities: KeywordOpportunity[] }>("GET", "/api/v1/opportunities");
      setOpps(opportunities);
      setSeeds("");
      notify({ kind: "success", title: "Discovered", message: `${job.created} new opportunities.` });
    } catch (err) {
      notify({ kind: "error", title: "Discovery failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setDiscovering(false);
    }
  }

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulkGenerate() {
    const ids = [...selected].filter((id) => opps.find((o) => o.id === id)?.status === "new");
    if (!ids.length) return;
    setBusy("bulk");
    let ok = 0;
    for (const id of ids) {
      const o = opps.find((x) => x.id === id);
      if (!o) continue;
      try {
        const content = await draftWithPuter(o.query, o.recommendedPageType);
        await pageEngineApi.generatePage(o.id, content ?? undefined);
        patch(o.id, { status: "approved" });
        ok += 1;
      } catch {
        /* keep going */
      }
    }
    setSelected(new Set());
    setBusy(null);
    notify({ kind: ok ? "success" : "error", title: `Generated ${ok}/${ids.length} pages` });
  }

  const selectableNew = rows.filter((o) => o.status === "new").map((o) => o.id);
  const allSelected = selectableNew.length > 0 && selectableNew.every((id) => selected.has(id));

  return (
    <div className="space-y-4">
      {/* discover */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand" />
          <input
            value={seeds}
            onChange={(e) => setSeeds(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDiscover()}
            placeholder="Seed topics to discover new opportunities (comma-separated)…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring"
          />
        </div>
        <Button className="h-10 shrink-0 rounded-full px-4" disabled={discovering || !seeds.trim()} onClick={runDiscover}>
          {discovering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Discover
        </Button>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords or clusters…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring"
          />
        </div>
        <select value={intent} onChange={(e) => setIntent(e.target.value as SearchIntent | "all")} className="h-10 rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-ring">
          <option value="all">All intents</option>
          {(["commercial", "comparison", "transactional", "informational", "local", "navigational"] as SearchIntent[]).map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as OpportunityStatus | "all")} className="h-10 rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-ring">
          <option value="all">All statuses</option>
          {(["new", "approved", "deferred", "rejected"] as OpportunityStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <ArrowUpDown className="ml-1.5 size-3.5 text-muted-foreground" />
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)} className={cn("rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium", sort === s.key ? "bg-brand/12 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5">
          <span className="text-[13px] font-medium text-foreground">{selected.size} selected</span>
          <Button size="sm" className="ml-auto h-8 rounded-full px-3" disabled={busy === "bulk"} onClick={bulkGenerate}>
            {busy === "bulk" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Approve &amp; generate selected
          </Button>
          <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
      )}

      <div className="text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-foreground">{rows.length}</span> opportunities · sorted by {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => setSelected(e.target.checked ? new Set(selectableNew) : new Set())}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-2 py-3">Keyword</th>
                <th className="px-3 py-3">Intent</th>
                <th className="px-3 py-3">Vol</th>
                <th className="px-3 py-3">KD</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Impact</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-surface-sunken">
                    <td className="px-3 py-3">
                      {o.status === "new" && (
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} aria-label={`Select ${o.query}`} />
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex items-start gap-1.5 text-left">
                        {expanded === o.id ? <ChevronDown className="mt-0.5 size-3.5 text-muted-foreground" /> : <ChevronRight className="mt-0.5 size-3.5 text-muted-foreground" />}
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-foreground">
                            {o.query}
                            {o.duplicate && (
                              <span title="May cannibalize an existing page" className="inline-flex items-center gap-0.5 rounded bg-warning/15 px-1 py-0.5 text-[10px] font-semibold text-warning">
                                <AlertTriangle className="size-3" /> dup
                              </span>
                            )}
                          </span>
                          <span className="text-[11.5px] text-muted-foreground">{o.clusterLabel} · {o.recommendedPageType}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold capitalize", INTENT_CLS[o.intent])}>{o.intent}</span>
                        {o.funnelStage && (
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", STAGE_META[o.funnelStage].cls)}>{STAGE_META[o.funnelStage].label}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-[13px] text-muted-foreground">{compact(o.volume)}</td>
                    <td className="px-3 py-3 tabular-nums text-[13px] text-muted-foreground">{o.difficulty}</td>
                    <td className="px-3 py-3 tabular-nums text-[13px] text-muted-foreground">{o.commercialValue}</td>
                    <td className="px-3 py-3 tabular-nums text-[13px] font-semibold text-foreground">{impact(o)}</td>
                    <td className="px-3 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold capitalize", STATUS_CLS[o.status])}>{o.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === "new" ? (
                          <>
                            <button onClick={() => act(o.id, "defer")} disabled={busy === o.id} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted" aria-label="Defer"><Clock className="size-3.5" /></button>
                            <button onClick={() => act(o.id, "reject")} disabled={busy === o.id} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-negative/10 hover:text-negative" aria-label="Reject"><X className="size-3.5" /></button>
                            <Button size="sm" className="h-8 rounded-full px-3" disabled={busy === o.id} onClick={() => generate(o)}>
                              {busy === o.id ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                              Generate
                            </Button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground"><Check className="size-3.5 text-positive" /> {o.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-surface-sunken">
                      <td />
                      <td colSpan={8} className="px-3 py-3">
                        <div className="text-[12.5px] text-foreground">{o.evidence}</div>
                        <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                          <span className="font-semibold">Confidence {o.confidence}</span>
                          {o.competitorUrls.length > 0 && (
                            <span>
                              · Competitors:{" "}
                              {o.competitorUrls.map((u, idx) => (
                                <span key={u}>
                                  {idx > 0 ? ", " : ""}
                                  <a href={`https://${u.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">{u}</a>
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">No opportunities match your filters.</div>}
      </div>
    </div>
  );
}
