"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransition } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Mail,
  ArrowUpDown,
  Archive,
  RotateCw,
  Pencil,
  SlidersHorizontal,
  X,
  Tag,
  Download,
} from "lucide-react";
import type { BacklinkProspect, BrandProfile, ProspectStatus } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { compact } from "@/lib/format";
import { toCsv, downloadFile, dateStamp } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPill, PROSPECT_STATUSES } from "./status-pill";
import { OutreachDrawer } from "./outreach-drawer";
import { ProspectEditDrawer } from "./prospect-edit-drawer";
import { PROSPECT_DISCOVERED_EVENT } from "./opportunity-actions";
import { useAppFeedback } from "@/components/system/app-feedback";

interface AdvancedFilters {
  minDa: number;
  minImpact: number;
  industry: string;
  hasEmail: boolean;
  needsOutreach: boolean;
}
const EMPTY_ADV: AdvancedFilters = { minDa: 0, minImpact: 0, industry: "", hasEmail: false, needsOutreach: false };

type SortKey = "impactScore" | "domainAuthority" | "relevanceScore" | "trafficEstimate";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "impactScore", label: "Impact" },
  { key: "domainAuthority", label: "Authority" },
  { key: "relevanceScore", label: "Relevance" },
  { key: "trafficEstimate", label: "Traffic" },
];

function impactColor(score: number): string {
  if (score >= 82) return "bg-brand";
  if (score >= 70) return "bg-info";
  return "bg-muted-foreground/60";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", impactColor(score))} style={{ width: `${score}%` }} />
      </div>
      <span className="tnum text-[13px] font-semibold text-foreground">{score}</span>
    </div>
  );
}

export function OpportunitiesView({
  prospects: initialProspects,
  brand,
  initialQuery = "",
}: {
  prospects: BacklinkProspect[];
  brand: BrandProfile;
  initialQuery?: string;
}) {
  const { notify, confirm } = useAppFeedback();
  const [prospects, setProspects] = useState(initialProspects);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<ProspectStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("impactScore");
  const [selected, setSelected] = useState<BacklinkProspect | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BacklinkProspect | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv] = useState<AdvancedFilters>(EMPTY_ADV);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<BacklinkProspect[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  async function toggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    if (next && archived.length === 0) {
      setLoadingArchived(true);
      try {
        setArchived(await api.getArchivedProspects());
      } catch {
        notify({ kind: "error", title: "Couldn't load archived prospects" });
      } finally {
        setLoadingArchived(false);
      }
    }
  }

  async function restoreProspect(p: BacklinkProspect) {
    setArchived((items) => items.filter((x) => x.id !== p.id));
    try {
      await api.restoreProspect(p.id);
      setProspects((items) => [p, ...items]);
      notify({ kind: "success", title: "Prospect restored", message: p.domain });
    } catch (err) {
      setArchived((items) => [p, ...items]);
      notify({ kind: "error", title: "Restore failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  // Discovery (header button) hands us the new prospect — prepend + highlight it
  // so it actually appears in this client-state list (§6.1).
  useEffect(() => {
    function onDiscovered(e: Event) {
      const p = (e as CustomEvent<BacklinkProspect>).detail;
      if (!p?.id) return;
      setProspects((items) => (items.some((it) => it.id === p.id) ? items : [p, ...items]));
      setStatus("all");
      setHighlightId(p.id);
      window.setTimeout(() => setHighlightId((cur) => (cur === p.id ? null : cur)), 2600);
    }
    window.addEventListener(PROSPECT_DISCOVERED_EVENT, onDiscovered);
    return () => window.removeEventListener(PROSPECT_DISCOVERED_EVENT, onDiscovered);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) =>
        q === ""
          ? true
          : p.domain.toLowerCase().includes(q) ||
            p.url.toLowerCase().includes(q) ||
            p.industry.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)) ||
            (p.contactEmail?.toLowerCase().includes(q) ?? false) ||
            p.rationale.toLowerCase().includes(q),
      )
      // advanced filters (§8.4)
      .filter((p) => p.domainAuthority >= adv.minDa)
      .filter((p) => p.impactScore >= adv.minImpact)
      .filter((p) => (adv.industry === "" ? true : p.industry === adv.industry))
      .filter((p) => (!adv.hasEmail ? true : Boolean(p.contactEmail)))
      .filter((p) => (!adv.needsOutreach ? true : p.status === "new"))
      .sort((a, b) => b[sort] - a[sort]);
  }, [prospects, query, status, sort, adv]);

  const industries = useMemo(() => [...new Set(prospects.map((p) => p.industry))].sort(), [prospects]);

  // Active advanced-filter chips (§8.4 — each removable).
  const advChips: { label: string; clear: () => void }[] = [];
  if (adv.minDa > 0) advChips.push({ label: `DA ≥ ${adv.minDa}`, clear: () => setAdv((a) => ({ ...a, minDa: 0 })) });
  if (adv.minImpact > 0) advChips.push({ label: `Impact ≥ ${adv.minImpact}`, clear: () => setAdv((a) => ({ ...a, minImpact: 0 })) });
  if (adv.industry) advChips.push({ label: adv.industry, clear: () => setAdv((a) => ({ ...a, industry: "" })) });
  if (adv.hasEmail) advChips.push({ label: "Has contact email", clear: () => setAdv((a) => ({ ...a, hasEmail: false })) });
  if (adv.needsOutreach) advChips.push({ label: "Needs outreach", clear: () => setAdv((a) => ({ ...a, needsOutreach: false })) });

  // Pipeline summary (§7) + per-status counts (§8.2).
  const pipeline = useMemo(() => {
    const total = prospects.length;
    const highImpact = prospects.filter((p) => p.impactScore >= 80).length;
    const avgDA = total ? Math.round(prospects.reduce((a, p) => a + p.domainAuthority, 0) / total) : 0;
    const reach = prospects.reduce((a, p) => a + p.trafficEstimate, 0);
    return { total, highImpact, avgDA, reach };
  }, [prospects]);

  const statusCount = useMemo(() => {
    const m: Record<string, number> = { all: prospects.length };
    for (const p of prospects) m[p.status] = (m[p.status] ?? 0) + 1;
    return m;
  }, [prospects]);

  const summaryCards: { label: string; value: string | number; onClick: () => void }[] = [
    { label: "Prospects", value: compact(pipeline.total), onClick: () => setStatus("all") },
    { label: "High-impact", value: compact(pipeline.highImpact), onClick: () => setSort("impactScore") },
    { label: "Avg. authority", value: pipeline.avgDA, onClick: () => setSort("domainAuthority") },
    { label: "Combined reach", value: compact(pipeline.reach), onClick: () => setSort("trafficEstimate") },
  ];

  function openOutreach(p: BacklinkProspect) {
    setSelected(p);
    setOpen(true);
  }

  function openEdit(p: BacklinkProspect) {
    setEditing(p);
    setEditOpen(true);
  }

  const hasFilters = query.trim() !== "" || status !== "all" || advChips.length > 0;
  function resetFilters() {
    setQuery("");
    setStatus("all");
    setAdv(EMPTY_ADV);
  }

  /* ---- bulk selection + actions (§8.5) ---- */
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  function toggleSelect(id: string) {
    setSelectedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleSelectAll() {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkSetStatus(next: ProspectStatus) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const previous = prospects;
    setProspects((items) => items.map((it) => (selectedIds.has(it.id) ? { ...it, status: next } : it)));
    clearSelection();
    try {
      await Promise.all(ids.map((id) => api.updateProspect(id, { status: next })));
      notify({ kind: "success", title: `Moved ${ids.length} prospect${ids.length > 1 ? "s" : ""} to ${next}` });
    } catch (err) {
      setProspects(previous);
      notify({ kind: "error", title: "Bulk update failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function bulkAddTag() {
    const tag = bulkTag.trim();
    if (!tag || selectedIds.size === 0) return;
    const targets = prospects.filter((p) => selectedIds.has(p.id));
    const previous = prospects;
    setProspects((items) =>
      items.map((it) => (selectedIds.has(it.id) ? { ...it, tags: [...new Set([...it.tags, tag])] } : it)),
    );
    setBulkTag("");
    clearSelection();
    try {
      await Promise.all(targets.map((p) => api.updateProspect(p.id, { tags: [...new Set([...p.tags, tag])] })));
      notify({ kind: "success", title: `Tagged ${targets.length} prospect${targets.length > 1 ? "s" : ""}`, message: `Added "${tag}".` });
    } catch (err) {
      setProspects(previous);
      notify({ kind: "error", title: "Bulk tag failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function bulkArchive() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Archive ${ids.length} prospect${ids.length > 1 ? "s" : ""}?`,
      message: "They'll be removed from your opportunities list. You can rediscover them later.",
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!ok) return;
    const previous = prospects;
    setProspects((items) => items.filter((it) => !selectedIds.has(it.id)));
    clearSelection();
    try {
      await Promise.all(ids.map((id) => api.archiveProspect(id)));
      notify({ kind: "success", title: `Archived ${ids.length} prospect${ids.length > 1 ? "s" : ""}` });
    } catch (err) {
      setProspects(previous);
      notify({ kind: "error", title: "Bulk archive failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  function bulkExport() {
    const rows = prospects.filter((p) => selectedIds.has(p.id));
    if (rows.length === 0) return;
    const csv = toCsv(
      rows.map((p) => ({ ...p, tags: p.tags.join(" | ") })),
      [
        { key: "domain", header: "Domain" },
        { key: "url", header: "URL" },
        { key: "domainAuthority", header: "DA" },
        { key: "relevanceScore", header: "Relevance" },
        { key: "impactScore", header: "Impact" },
        { key: "trafficEstimate", header: "Traffic" },
        { key: "industry", header: "Industry" },
        { key: "tags", header: "Tags" },
        { key: "status", header: "Status" },
        { key: "contactEmail", header: "Contact email" },
        { key: "rationale", header: "Rationale" },
      ],
    );
    downloadFile(`prospects-selected-${dateStamp()}.csv`, csv);
    notify({ kind: "success", title: "Selection exported", message: `${rows.length} prospects downloaded as CSV.` });
  }

  function applySaved(updated: BacklinkProspect) {
    setProspects((items) => items.map((item) => (item.id === updated.id ? updated : item)));
  }

  function copyEmail(p: BacklinkProspect) {
    navigator.clipboard?.writeText(p.contactEmail ?? "");
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1400);
  }

  async function updateStatus(p: BacklinkProspect) {
    const current = PROSPECT_STATUSES.indexOf(p.status);
    const next = PROSPECT_STATUSES[(current + 1) % PROSPECT_STATUSES.length];
    setPendingId(p.id);
    setProspects((items) => items.map((item) => (item.id === p.id ? { ...item, status: next } : item)));
    try {
      const updated = await api.updateProspect(p.id, { status: next });
      setProspects((items) => items.map((item) => (item.id === p.id ? updated : item)));
      notify({ kind: "success", title: "Prospect updated", message: `${p.domain} moved to ${next}.` });
    } catch (err) {
      setProspects((items) => items.map((item) => (item.id === p.id ? p : item)));
      notify({ kind: "error", title: "Update failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setPendingId(null);
    }
  }

  async function archiveProspect(p: BacklinkProspect) {
    const ok = await confirm({
      title: `Archive ${p.domain}?`,
      message: "It will be removed from your opportunities list. You can rediscover it later.",
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!ok) return;
    const previous = prospects;
    startTransition(() => {
      setProspects((items) => items.filter((item) => item.id !== p.id));
    });
    api.archiveProspect(p.id)
      .then(() => notify({ kind: "success", title: "Prospect archived", message: `${p.domain} was removed from the list.` }))
      .catch((err) => {
        setProspects(previous);
        notify({ kind: "error", title: "Archive failed", message: err instanceof Error ? err.message : "Try again." });
      });
  }

  return (
    <div className="space-y-4">
      {/* pipeline summary (§7) — clicking a metric applies the relevant view */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((m) => (
          <button
            key={m.label}
            onClick={m.onClick}
            className="rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="tnum mt-1.5 text-2xl font-semibold text-foreground">{m.value}</div>
          </button>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by domain, industry, or tag…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring"
          />
        </div>

        {/* status filter */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {(["all", ...PROSPECT_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                status === s
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s}
              <span className={cn("tnum text-[10.5px]", status === s ? "text-background/70" : "text-muted-foreground/60")}>
                {statusCount[s] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* sort */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <ArrowUpDown className="ml-1.5 size-3.5 text-muted-foreground" />
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                sort === s.key
                  ? "bg-brand/12 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* advanced filters toggle (§8.4) */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors",
            showFilters || advChips.length > 0
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {advChips.length > 0 && (
            <span className="tnum rounded-full bg-brand/20 px-1.5 text-[11px] font-semibold">{advChips.length}</span>
          )}
        </button>

        {/* archived view toggle (restore) */}
        <button
          onClick={toggleArchived}
          aria-pressed={showArchived}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors",
            showArchived
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Archive className="size-4" />
          Archived
        </button>
      </div>

      {showArchived && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Archive className="size-4 text-muted-foreground" /> Archived prospects
            <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{archived.length}</span>
          </div>
          {loadingArchived ? (
            <p className="py-4 text-center text-[13px] text-muted-foreground">Loading…</p>
          ) : archived.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted-foreground">No archived prospects.</p>
          ) : (
            <div className="divide-y divide-border">
              {archived.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-foreground">{p.domain}</div>
                    <div className="truncate text-[12px] text-muted-foreground">
                      {p.industry} · DA {p.domainAuthority}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => restoreProspect(p)}>
                    <RotateCw className="size-3.5" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* advanced filter panel (§8.4) */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-[12px]">
            <span className="mb-1 block font-medium text-muted-foreground">Min. authority</span>
            <select
              value={adv.minDa}
              onChange={(e) => setAdv((a) => ({ ...a, minDa: Number(e.target.value) }))}
              className="h-9 w-full rounded-lg border border-border bg-surface-sunken px-2 text-[13px] outline-none focus:border-ring"
            >
              {[0, 50, 60, 70, 80, 90].map((v) => (
                <option key={v} value={v}>{v === 0 ? "Any" : `${v}+`}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block font-medium text-muted-foreground">Min. impact</span>
            <select
              value={adv.minImpact}
              onChange={(e) => setAdv((a) => ({ ...a, minImpact: Number(e.target.value) }))}
              className="h-9 w-full rounded-lg border border-border bg-surface-sunken px-2 text-[13px] outline-none focus:border-ring"
            >
              {[0, 50, 60, 70, 80, 90].map((v) => (
                <option key={v} value={v}>{v === 0 ? "Any" : `${v}+`}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block font-medium text-muted-foreground">Industry</span>
            <select
              value={adv.industry}
              onChange={(e) => setAdv((a) => ({ ...a, industry: e.target.value }))}
              className="h-9 w-full rounded-lg border border-border bg-surface-sunken px-2 text-[13px] outline-none focus:border-ring"
            >
              <option value="">All industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-4 text-[12.5px] text-foreground">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={adv.hasEmail}
                onChange={(e) => setAdv((a) => ({ ...a, hasEmail: e.target.checked }))}
                className="size-3.5 accent-[var(--brand)]"
              />
              Has email
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={adv.needsOutreach}
                onChange={(e) => setAdv((a) => ({ ...a, needsOutreach: e.target.checked }))}
                className="size-3.5 accent-[var(--brand)]"
              />
              Needs outreach
            </label>
          </div>
        </div>
      )}

      {/* applied filter chips (§8.4) */}
      {advChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {advChips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-sunken py-1 pl-2.5 pr-1 text-[12px] text-muted-foreground"
            >
              {c.label}
              <button
                onClick={c.clear}
                aria-label={`Remove ${c.label}`}
                className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-negative"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button onClick={resetFilters} className="text-[12px] font-medium text-brand hover:underline">
            Reset all
          </button>
        </div>
      )}

      {/* bulk action bar (§8.5) */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand/30 bg-brand/5 p-2.5">
          <span className="px-1 text-[12.5px] font-semibold text-foreground">{selectedIds.size} selected</span>
          <select
            onChange={(e) => {
              const v = e.target.value;
              if (v) void bulkSetStatus(v as ProspectStatus);
              e.currentTarget.value = "";
            }}
            defaultValue=""
            aria-label="Set status for selected"
            className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px] capitalize outline-none focus:border-ring"
          >
            <option value="" disabled>
              Set status…
            </option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <input
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void bulkAddTag();
              }}
              placeholder="Add tag…"
              aria-label="Tag to add to selected"
              className="h-8 w-28 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-ring"
            />
            <Button size="sm" variant="outline" className="h-8" onClick={bulkAddTag} disabled={!bulkTag.trim()}>
              <Tag className="size-3.5" />
              Tag
            </Button>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={bulkExport}>
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-negative hover:bg-negative/10" onClick={bulkArchive}>
            <Archive className="size-3.5" />
            Archive
          </Button>
          <button
            onClick={clearSelection}
            className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </button>
        </div>
      )}

      <div className="text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> prospects
        · ranked by {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm text-muted-foreground">No prospects match your filters.</p>
          {hasFilters && (
            <Button variant="outline" className="mt-3 h-9" onClick={resetFilters}>
              Reset filters
            </Button>
          )}
        </div>
      ) : (
       <>
      {/* desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                <th className="py-3 pl-5 pr-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all prospects"
                    className="size-3.5 accent-[var(--brand)]"
                  />
                </th>
                <th className="py-3 pr-3 font-semibold">Prospect</th>
                <th className="px-3 py-3 font-semibold">DA</th>
                <th className="px-3 py-3 font-semibold">Relevance</th>
                <th className="px-3 py-3 font-semibold">Impact</th>
                <th className="px-3 py-3 font-semibold">Traffic</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "group border-b border-border last:border-0 transition-colors hover:bg-surface-sunken",
                    selectedIds.has(p.id) && "bg-brand/5",
                    highlightId === p.id && "animate-pulse bg-brand/10 ring-1 ring-inset ring-brand/40",
                  )}
                >
                  <td className="py-3.5 pl-5 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Select ${p.domain}`}
                      className="size-3.5 accent-[var(--brand)]"
                    />
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-info/15 text-[12px] font-bold text-brand">
                        {p.domain.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {p.domain}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-[11.5px] text-muted-foreground">
                            {p.industry}
                          </span>
                          {p.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="tnum text-[13px] font-semibold text-foreground">
                      {p.domainAuthority}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="tnum text-[13px] text-foreground">{p.relevanceScore}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <ScoreBar score={p.impactScore} />
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="tnum text-[13px] text-muted-foreground">
                      {compact(p.trafficEstimate)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Open ${p.domain}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button
                        onClick={() => copyEmail(p)}
                        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Copy contact email"
                      >
                        {copiedId === p.id ? (
                          <Check className="size-3.5 text-positive" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${p.domain}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-full px-3"
                        disabled={pendingId === p.id}
                        onClick={() => updateStatus(p)}
                      >
                        {pendingId === p.id ? <RotateCw className="size-3.5 animate-spin" /> : <ArrowUpDown className="size-3.5" />}
                        Status
                      </Button>
                      <Button size="sm" className="h-9 rounded-full px-3" onClick={() => openOutreach(p)}>
                        <Mail className="size-3.5" />
                        Outreach
                      </Button>
                      <button
                        onClick={() => archiveProspect(p)}
                        disabled={isPending}
                        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative disabled:opacity-50"
                        aria-label={`Archive ${p.domain}`}
                      >
                        <Archive className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={cn(
              "rounded-2xl border border-border bg-card p-4 shadow-card",
              highlightId === p.id && "animate-pulse ring-1 ring-brand/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-info/15 text-[12px] font-bold text-brand">
                  {p.domain.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-foreground">{p.domain}</div>
                  <div className="text-[11.5px] text-muted-foreground">{p.industry}</div>
                </div>
              </div>
              <StatusPill status={p.status} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-sunken p-2.5 text-center">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">DA</div>
                <div className="tnum text-[14px] font-semibold text-foreground">{p.domainAuthority}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Impact</div>
                <div className="tnum text-[14px] font-semibold text-foreground">{p.impactScore}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Traffic</div>
                <div className="tnum text-[14px] font-semibold text-foreground">{compact(p.trafficEstimate)}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <Button size="sm" className="h-9 flex-1 rounded-full" onClick={() => openOutreach(p)}>
                <Mail className="size-3.5" />
                Outreach
              </Button>
              <button
                onClick={() => openEdit(p)}
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Edit ${p.domain}`}
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => updateStatus(p)}
                disabled={pendingId === p.id}
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Advance status"
              >
                {pendingId === p.id ? <RotateCw className="size-3.5 animate-spin" /> : <ArrowUpDown className="size-3.5" />}
              </button>
              <button
                onClick={() => archiveProspect(p)}
                disabled={isPending}
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative disabled:opacity-50"
                aria-label={`Archive ${p.domain}`}
              >
                <Archive className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
       </>
      )}

      <OutreachDrawer
        prospect={selected}
        brand={brand}
        open={open}
        onOpenChange={setOpen}
      />

      <ProspectEditDrawer
        prospect={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={applySaved}
      />
    </div>
  );
}
