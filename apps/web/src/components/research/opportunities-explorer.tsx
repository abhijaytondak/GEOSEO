"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Check,
  X,
  ArrowRight,
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type BadgeVariant = "brand" | "positive" | "negative" | "warning" | "info" | "muted";

const INTENT_VARIANT: Record<SearchIntent, BadgeVariant> = {
  commercial: "brand",
  transactional: "positive",
  comparison: "info",
  informational: "muted",
  local: "warning",
  navigational: "muted",
};
const STAGE_META: Record<FunnelStage, { label: string; variant: BadgeVariant }> = {
  research: { label: "Research", variant: "muted" },
  consideration: { label: "Consideration", variant: "info" },
  "ready-to-buy": { label: "Ready to buy", variant: "positive" },
};
const STATUS_VARIANT: Record<OpportunityStatus, BadgeVariant> = {
  new: "info",
  approved: "positive",
  rejected: "muted",
  deferred: "warning",
};

type SortKey = "score" | "pillar" | "volume" | "difficulty" | "commercialValue" | "confidence";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "pillar", label: "Topic pillar" },
  { key: "volume", label: "Volume" },
  { key: "difficulty", label: "Difficulty" },
  { key: "commercialValue", label: "Value" },
  { key: "confidence", label: "Confidence" },
];

// Prefer the server-computed opportunity score; fall back to a UI blend for legacy opps
// (value × volume reach ÷ difficulty) so older rows still rank sensibly.
function score(o: KeywordOpportunity): number {
  if (typeof o.score === "number") return o.score;
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
  const [sort, setSort] = useState<SortKey>("score");
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
      .sort((a, b) => {
        if (sort === "score") return score(b) - score(a);
        // "pillar" groups by cluster label, then best score within each pillar.
        if (sort === "pillar") return a.clusterLabel.localeCompare(b.clusterLabel) || score(b) - score(a);
        return (b[sort] as number) - (a[sort] as number);
      });
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
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button className="h-10 shrink-0 rounded-full px-4" loading={discovering} disabled={!seeds.trim()} onClick={runDiscover}>
          {!discovering && <Sparkles className="size-4" />}
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
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <select value={intent} onChange={(e) => setIntent(e.target.value as SearchIntent | "all")} className="h-10 rounded-xl border border-border bg-card px-3 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="all">All intents</option>
          {(["commercial", "comparison", "transactional", "informational", "local", "navigational"] as SearchIntent[]).map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as OpportunityStatus | "all")} className="h-10 rounded-xl border border-border bg-card px-3 text-label outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="all">All statuses</option>
          {(["new", "approved", "deferred", "rejected"] as OpportunityStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <ArrowUpDown className="ml-1.5 size-3.5 text-muted-foreground" />
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)} className={cn("rounded-lg px-2.5 py-1.5 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", sort === s.key ? "bg-brand/12 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5">
          <span className="text-label font-medium text-foreground">{selected.size} selected</span>
          <Button size="sm" className="ml-auto h-8 rounded-full px-3" loading={busy === "bulk"} onClick={bulkGenerate}>
            {busy !== "bulk" && <Sparkles className="size-3.5" />}
            Approve &amp; generate selected
          </Button>
          <button onClick={() => setSelected(new Set())} className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Clear selection"><X className="size-4" /></button>
        </div>
      )}

      <div className="text-label text-muted-foreground">
        <span className="font-semibold text-foreground">{rows.length}</span> opportunities · sorted by {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-micro font-semibold uppercase text-muted-foreground">
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
                <th className="px-3 py-3">Score</th>
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
                      <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex items-start gap-1.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                        {expanded === o.id ? <ChevronDown className="mt-0.5 size-3.5 text-muted-foreground" /> : <ChevronRight className="mt-0.5 size-3.5 text-muted-foreground" />}
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5 text-body font-semibold text-foreground">
                            {o.query}
                            {o.question && (
                              <Badge variant="brand" title="Question / answer-engine target (AEO)">
                                <Sparkles className="size-3" /> AEO
                              </Badge>
                            )}
                            {o.duplicate && (
                              <Badge variant="warning" title="May cannibalize an existing page">
                                <AlertTriangle className="size-3" /> dup
                              </Badge>
                            )}
                          </span>
                          <span className="text-micro text-muted-foreground">
                            {o.clusterLabel} · {o.recommendedPageType}
                            {typeof o.cpc === "number" && o.cpc > 0 ? ` · $${o.cpc.toFixed(2)} CPC` : ""}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={INTENT_VARIANT[o.intent]} className="capitalize">{o.intent}</Badge>
                        {o.funnelStage && (
                          <Badge variant={STAGE_META[o.funnelStage].variant}>{STAGE_META[o.funnelStage].label}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-label text-muted-foreground">{compact(o.volume)}</td>
                    <td className="px-3 py-3 tabular-nums text-label text-muted-foreground">{o.difficulty}</td>
                    <td className="px-3 py-3 tabular-nums text-label text-muted-foreground">{o.commercialValue}</td>
                    <td className="px-3 py-3 tabular-nums text-label font-semibold text-foreground">{score(o)}</td>
                    <td className="px-3 py-3"><Badge variant={STATUS_VARIANT[o.status]} className="capitalize">{o.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === "new" ? (
                          <>
                            <button onClick={() => act(o.id, "defer")} disabled={busy === o.id} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" aria-label="Defer"><Clock className="size-3.5" /></button>
                            <button onClick={() => act(o.id, "reject")} disabled={busy === o.id} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" aria-label="Reject"><X className="size-3.5" /></button>
                            <Button size="sm" className="h-8 rounded-full px-3" loading={busy === o.id} onClick={() => generate(o)}>
                              {busy !== o.id && <FileText className="size-3.5" />}
                              Generate
                            </Button>
                          </>
                        ) : o.status === "approved" ? (
                          // Generated → give a forward path instead of a dead "approved" label.
                          <Link
                            href="/pages"
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <Check className="size-3.5 text-positive" /> View page
                            <ArrowRight className="size-3.5" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-label text-muted-foreground"><Check className="size-3.5 text-positive" /> {o.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-surface-sunken">
                      <td />
                      <td colSpan={8} className="px-3 py-3">
                        <div className="text-label text-foreground">{o.evidence}</div>
                        <div className="mt-1.5 flex items-center gap-2 text-micro text-muted-foreground">
                          <span className="font-semibold">Confidence {o.confidence}</span>
                          {o.competitorUrls.length > 0 && (
                            <span>
                              · Competitors:{" "}
                              {o.competitorUrls.map((u, idx) => (
                                <span key={u}>
                                  {idx > 0 ? ", " : ""}
                                  <a href={`https://${u.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="rounded-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{u}</a>
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
        {rows.length === 0 &&
          (opps.length === 0 ? (
            // True zero (brand-new workspace) — point at the seed bar, not at "filters".
            <EmptyState
              icon={Sparkles}
              tone="prompt"
              title="Discover your first opportunities"
              description="Enter a few seed topics in the bar above (or leave it blank to auto-seed from your Brand Memory) and we'll find the buyer-intent keywords worth a page."
              className="py-16"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No opportunities match your filters"
              description="Adjust the search or filters above, or discover new opportunities from seed topics."
              className="py-16"
            />
          ))}
      </div>
    </div>
  );
}
