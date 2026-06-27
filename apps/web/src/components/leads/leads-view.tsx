"use client";

import { useMemo, useState } from "react";
import { Users, BadgeCheck, ShieldAlert, Gauge, Download, Cloud, Check, Trash2, Inbox, LayoutList, TableProperties } from "lucide-react";
import type { Lead, LeadStatus, SpamStatus } from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";
import { pageEngineApi } from "@/lib/page-engine-client";
import { LeadDetailDrawer } from "./lead-detail-drawer";

type BadgeVariant = "brand" | "positive" | "negative" | "warning" | "info" | "muted";

// status (editable via <select>) keeps the tint classes; spam → semantic Badge variant.
const STATUS: Record<LeadStatus, string> = {
  new: "bg-info/12 text-info",
  qualified: "bg-brand/12 text-brand",
  contacted: "bg-warning/15 text-warning",
  won: "bg-positive/12 text-positive",
  lost: "bg-muted text-muted-foreground",
};
const SPAM: Record<SpamStatus, { label: string; variant: BadgeVariant }> = {
  clean: { label: "Clean", variant: "positive" },
  spam: { label: "Spam", variant: "negative" },
  duplicate: { label: "Duplicate", variant: "warning" },
};

type Filter = "all" | SpamStatus;
const FILTERS: Filter[] = ["all", "clean", "spam", "duplicate"];

function scoreColor(s: number) {
  return s >= 75 ? "text-positive" : s >= 50 ? "text-warning" : "text-muted-foreground";
}

type ViewMode = "list" | "by-page";

export function LeadsView({ leads }: { leads: Lead[] }) {
  const { notify, confirm } = useAppFeedback();
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [rows, setRows] = useState(leads);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function openDetail(lead: Lead) {
    setSelected(lead);
    setDetailOpen(true);
  }

  async function setStatus(id: string, status: LeadStatus) {
    const prev = rows;
    setRows((arr) => arr.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await pageEngineApi.updateLeadStatus(id, status);
    } catch (err) {
      setRows(prev);
      notify({ kind: "error", title: "Update failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function syncLead(id: string) {
    // Optimistic "pending" only — the real CRM seam decides synced/skipped/failed (no fake "synced").
    setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "pending" } : l)));
    try {
      const { result } = await pageEngineApi.crmSyncLead(id);
      if (result.status === "synced") {
        setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "synced" } : l)));
        notify({
          kind: "success",
          title: "Synced to CRM",
          message: result.externalUrl ? `Record: ${result.externalUrl}` : `Provider: ${result.provider}`,
        });
      } else if (result.status === "skipped") {
        setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "none" } : l)));
        notify({
          kind: "info",
          title: "CRM not connected",
          message: "Add a HubSpot key on the API to sync leads to your CRM.",
        });
      } else {
        setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "none" } : l)));
        notify({ kind: "error", title: "Sync failed", message: result.error ?? "Try again." });
      }
    } catch (err) {
      setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "none" } : l)));
      notify({ kind: "error", title: "Sync failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function deleteLead(id: string) {
    const ok = await confirm({
      title: "Delete this lead?",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const prev = rows;
    setRows((arr) => arr.filter((l) => l.id !== id));
    try {
      await pageEngineApi.deleteLead(id);
      notify({ kind: "success", title: "Lead deleted" });
    } catch (err) {
      setRows(prev);
      notify({ kind: "error", title: "Delete failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  const clean = rows.filter((l) => l.spamStatus === "clean");
  const stats: { label: string; value: number | string; icon: typeof Users }[] = [
    { label: "Total leads", value: rows.length, icon: Users },
    { label: "Qualified", value: rows.filter((l) => l.status === "qualified" || l.status === "won").length, icon: BadgeCheck },
    { label: "Spam / dupes", value: rows.filter((l) => l.spamStatus !== "clean").length, icon: ShieldAlert },
    {
      // "—" not 0 when there are no scored leads — a literal 0 reads as "your leads are terrible".
      label: "Avg score",
      value: clean.length ? Math.round(clean.reduce((a, l) => a + l.score, 0) / clean.length) : "—",
      icon: Gauge,
    },
  ];

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((l) => l.spamStatus === filter)),
    [rows, filter],
  );

  const byPage = useMemo(() => {
    const clean = rows.filter((l) => l.spamStatus === "clean");
    const map = new Map<string, { pageId: string; pageTitle: string; total: number; clean: number; won: number; avgScore: number; scores: number[] }>();
    for (const l of clean) {
      const entry = map.get(l.pageId) ?? { pageId: l.pageId, pageTitle: l.pageTitle, total: 0, clean: 0, won: 0, avgScore: 0, scores: [] };
      entry.total++;
      entry.clean++;
      if (l.status === "won") entry.won++;
      entry.scores.push(l.score);
      map.set(l.pageId, entry);
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, avgScore: e.scores.length ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  function exportCsv() {
    const headers = ["Name", "Email", "Company", "Source Page", "Score", "Status", "Spam", "Created"];
    const rows = filtered.map((l) => [
      l.name,
      l.email,
      l.company,
      l.pageTitle,
      String(l.score),
      l.status,
      l.spamStatus,
      l.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geoseo-leads-${filtered.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify({ kind: "success", title: "Leads exported", message: `${filtered.length} rows downloaded as CSV.` });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-micro text-muted-foreground">{s.label}</span>
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="tnum mt-1.5 text-kpi text-foreground">{s.value}</div>
            </div>
          );
        })}
      </div>

      <Panel
        title="Leads"
        description="Captured from published pages — spam-filtered, deduped, and scored"
        bodyClassName="p-0"
        action={
          <div className="flex items-center gap-2">
            {/* view mode toggle */}
            <div role="group" aria-label="Switch leads view" className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                title="All leads"
                className={cn("rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40", viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <LayoutList className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode("by-page")}
                aria-pressed={viewMode === "by-page"}
                title="By source page"
                className={cn("rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40", viewMode === "by-page" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <TableProperties className="size-3.5" />
              </button>
            </div>
            {viewMode === "list" && (
              <>
                <div
                  role="group"
                  aria-label="Filter leads by spam status"
                  className="hidden items-center gap-1 rounded-xl border border-border bg-card p-1 sm:flex"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      aria-pressed={filter === f}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-label font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={exportCsv}>
                  <Download className="size-3.5" />
                  Export CSV
                </Button>
              </>
            )}
          </div>
        }
      >
        {viewMode === "by-page" && (
          byPage.length === 0 ? (
            <EmptyState icon={TableProperties} tone="prompt" title="No leads yet" description="Once visitors submit the lead form on your published pages, conversion rates by page will appear here." action={{ label: "Go to Pages", href: "/pages" }} className="py-16" />
          ) : (
            <Table className="text-left">
              <TableHeader>
                <TableRow className="border-b border-border bg-surface-sunken hover:bg-surface-sunken">
                  <TableHead scope="col" className="px-5 py-3 text-micro text-muted-foreground">Page</TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right text-micro text-muted-foreground">Leads</TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right text-micro text-muted-foreground">Won</TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right text-micro text-muted-foreground">Conv.</TableHead>
                  <TableHead scope="col" className="px-5 py-3 text-right text-micro text-muted-foreground">Avg score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPage.map((p) => {
                  const conv = p.total > 0 ? Math.round((p.won / p.total) * 100) : 0;
                  return (
                    <TableRow key={p.pageId} className="border-b border-border hover:bg-surface-sunken">
                      <TableCell className="px-5 py-3">
                        <button
                          onClick={() => { setViewMode("list"); setFilter("all"); }}
                          className="max-w-xs truncate text-left text-body font-semibold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                          title={p.pageTitle}
                        >
                          {p.pageTitle}
                        </button>
                      </TableCell>
                      <TableCell className="tnum px-3 py-3 text-right text-body font-semibold text-foreground">{p.total}</TableCell>
                      <TableCell className="tnum px-3 py-3 text-right text-label text-muted-foreground">{p.won}</TableCell>
                      <TableCell className="tnum px-3 py-3 text-right">
                        <span className={cn("text-label font-semibold", conv >= 20 ? "text-positive" : conv >= 10 ? "text-warning" : "text-muted-foreground")}>
                          {conv}%
                        </span>
                      </TableCell>
                      <TableCell className="tnum px-5 py-3 text-right">
                        <span className={cn("text-label font-semibold", scoreColor(p.avgScore))}>{p.avgScore}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )
        )}

        {viewMode === "list" && (<>
        {/* mobile-reachable filter — the pill group above is sm:flex-only, so a phone
            user otherwise had no way to filter the card list below (§1). */}
        <div className="border-b border-border p-3 sm:hidden">
          <label className="flex items-center gap-2">
            <span className="text-micro text-muted-foreground">Filter</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              aria-label="Filter leads by spam status"
              className="h-8 flex-1 rounded-lg border border-border bg-card px-2 text-label capitalize outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus:border-ring"
            >
              {FILTERS.map((f) => (
                <option key={f} value={f} className="capitalize">
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            tone={filter === "all" ? "prompt" : "default"}
            title={filter === "all" ? "No leads yet" : "No leads match this filter"}
            description={
              filter === "all"
                ? "Leads are captured when visitors submit the form on a published page. Publish a page to start collecting them."
                : "Try a different spam filter to see more leads."
            }
            action={
              filter === "all"
                ? { label: "Go to Pages", href: "/pages" }
                : { label: "Show all leads", onClick: () => setFilter("all") }
            }
            className="py-16"
          />
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden md:block">
              <Table className="text-left">
                <TableHeader>
                  <TableRow className="border-b border-border bg-surface-sunken hover:bg-surface-sunken">
                    <TableHead scope="col" className="px-5 py-3 text-micro text-muted-foreground">Lead</TableHead>
                    <TableHead scope="col" className="px-3 py-3 text-micro text-muted-foreground">Company</TableHead>
                    <TableHead scope="col" className="px-3 py-3 text-micro text-muted-foreground">Source page</TableHead>
                    <TableHead scope="col" className="px-3 py-3 text-micro text-muted-foreground">Score</TableHead>
                    <TableHead scope="col" className="px-3 py-3 text-micro text-muted-foreground">Status</TableHead>
                    <TableHead scope="col" className="px-3 py-3 text-micro text-muted-foreground">Spam</TableHead>
                    <TableHead scope="col" className="px-5 py-3 text-micro text-muted-foreground">Created</TableHead>
                    <TableHead scope="col" className="px-5 py-3 text-right text-micro text-muted-foreground">CRM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow
                      key={l.id}
                      className={cn("row-hover border-b border-border", l.spamStatus !== "clean" && "opacity-70")}
                    >
                      <TableCell className="px-5 py-3">
                        <button
                          onClick={() => openDetail(l)}
                          className="rounded-md text-left transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                          <div className="text-body font-semibold text-foreground hover:text-brand">{l.name}</div>
                          <div className="text-label text-muted-foreground">{l.email}</div>
                        </button>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-label text-muted-foreground">{l.company}</TableCell>
                      <TableCell className="px-3 py-3 text-label text-muted-foreground">{l.pageTitle}</TableCell>
                      <TableCell className="px-3 py-3">
                        <span className={cn("tnum text-label font-semibold", scoreColor(l.score))}>{l.score}</span>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}
                          aria-label={`Status for ${l.name}`}
                          className={cn(
                            "cursor-pointer rounded-full border-0 px-2 py-0.5 text-micro font-semibold capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                            STATUS[l.status],
                          )}
                        >
                          {(["new", "qualified", "contacted", "won", "lost"] as LeadStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <Badge variant={SPAM[l.spamStatus].variant}>{SPAM[l.spamStatus].label}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-label text-muted-foreground">{relativeTime(l.createdAt)}</TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => syncLead(l.id)}
                            disabled={l.crmSyncStatus === "synced"}
                            className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
                            aria-label={l.crmSyncStatus === "synced" ? `${l.name} synced to CRM` : `Sync ${l.name} to CRM`}
                            title={l.crmSyncStatus === "synced" ? "Synced" : "Sync to CRM"}
                          >
                            {l.crmSyncStatus === "synced" ? <Check className="size-3.5 text-positive" /> : <Cloud className="size-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteLead(l.id)}
                            className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                            aria-label={`Delete lead ${l.name}`}
                            title="Delete (GDPR)"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* mobile cards — same data, no horizontal scroll */}
            <ul className="space-y-2.5 p-3 md:hidden">
              {filtered.map((l) => (
                <li
                  key={l.id}
                  className={cn(
                    "rounded-xl border border-border bg-card p-3.5 shadow-xs",
                    l.spamStatus !== "clean" && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => openDetail(l)}
                      className="min-w-0 rounded-md text-left transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <div className="truncate text-body font-semibold text-foreground">{l.name}</div>
                      <div className="truncate text-label text-muted-foreground">{l.email}</div>
                    </button>
                    <Badge variant={SPAM[l.spamStatus].variant} className="shrink-0">
                      {SPAM[l.spamStatus].label}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted-foreground">
                    {l.company && <span className="truncate">{l.company}</span>}
                    <span className="tnum">
                      Score <span className={cn("font-semibold", scoreColor(l.score))}>{l.score}</span>
                    </span>
                    <span className="ml-auto tnum text-micro">{relativeTime(l.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}
                      aria-label={`Status for ${l.name}`}
                      className={cn(
                        "h-7 cursor-pointer rounded-full border-0 px-2.5 text-micro font-semibold capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        STATUS[l.status],
                      )}
                    >
                      {(["new", "qualified", "contacted", "won", "lost"] as LeadStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => syncLead(l.id)}
                        disabled={l.crmSyncStatus === "synced"}
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
                        aria-label={l.crmSyncStatus === "synced" ? `${l.name} synced to CRM` : `Sync ${l.name} to CRM`}
                      >
                        {l.crmSyncStatus === "synced" ? <Check className="size-3.5 text-positive" /> : <Cloud className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteLead(l.id)}
                        className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                        aria-label={`Delete lead ${l.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        </>)}
      </Panel>

      <LeadDetailDrawer lead={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
