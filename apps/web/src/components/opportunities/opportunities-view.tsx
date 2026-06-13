"use client";

import { useMemo, useState } from "react";
import { useTransition } from "react";
import { Search, ExternalLink, Copy, Check, Mail, ArrowUpDown, Archive, RotateCw } from "lucide-react";
import type { BacklinkProspect, BrandProfile, ProspectStatus } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPill, PROSPECT_STATUSES } from "./status-pill";
import { OutreachDrawer } from "./outreach-drawer";
import { useAppFeedback } from "@/components/system/app-feedback";

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
  const { notify } = useAppFeedback();
  const [prospects, setProspects] = useState(initialProspects);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<ProspectStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("impactScore");
  const [selected, setSelected] = useState<BacklinkProspect | null>(null);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) =>
        q === ""
          ? true
          : p.domain.toLowerCase().includes(q) ||
            p.industry.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .sort((a, b) => b[sort] - a[sort]);
  }, [prospects, query, status, sort]);

  function openOutreach(p: BacklinkProspect) {
    setSelected(p);
    setOpen(true);
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

  function archiveProspect(p: BacklinkProspect) {
    if (!window.confirm(`Archive ${p.domain}?`)) return;
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
                "rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                status === s
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s}
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
      </div>

      <div className="text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> prospects
        · ranked by {SORTS.find((s) => s.key === sort)?.label.toLowerCase()}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Prospect</th>
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
                  className="group border-b border-border last:border-0 transition-colors hover:bg-surface-sunken"
                >
                  <td className="px-5 py-3.5">
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

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No prospects match your filters.
          </div>
        )}
      </div>

      <OutreachDrawer
        prospect={selected}
        brand={brand}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
