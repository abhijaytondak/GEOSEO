"use client";

import { useMemo, useState } from "react";
import { Users, BadgeCheck, ShieldAlert, Gauge, Download, Cloud, Check, Trash2 } from "lucide-react";
import type { Lead, LeadStatus, SpamStatus } from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";
import { pageEngineApi } from "@/lib/page-engine-client";

const STATUS: Record<LeadStatus, string> = {
  new: "bg-info/12 text-info",
  qualified: "bg-brand/12 text-brand",
  contacted: "bg-warning/15 text-warning",
  won: "bg-positive/12 text-positive",
  lost: "bg-muted text-muted-foreground",
};
const SPAM: Record<SpamStatus, { label: string; cls: string }> = {
  clean: { label: "Clean", cls: "bg-positive/12 text-positive" },
  spam: { label: "Spam", cls: "bg-negative/12 text-negative" },
  duplicate: { label: "Duplicate", cls: "bg-warning/15 text-warning" },
};

type Filter = "all" | SpamStatus;

function scoreColor(s: number) {
  return s >= 75 ? "text-positive" : s >= 50 ? "text-warning" : "text-muted-foreground";
}

export function LeadsView({ leads }: { leads: Lead[] }) {
  const { notify } = useAppFeedback();
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState(leads);

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
    setRows((arr) => arr.map((l) => (l.id === id ? { ...l, crmSyncStatus: "synced" } : l)));
    try {
      await pageEngineApi.syncLead(id);
      notify({ kind: "success", title: "Synced to CRM" });
    } catch (err) {
      notify({ kind: "error", title: "Sync failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function deleteLead(id: string) {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
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
  const stats = [
    { label: "Total leads", value: rows.length, icon: Users },
    { label: "Qualified", value: rows.filter((l) => l.status === "qualified" || l.status === "won").length, icon: BadgeCheck },
    { label: "Spam / dupes", value: rows.filter((l) => l.spamStatus !== "clean").length, icon: ShieldAlert },
    {
      label: "Avg score",
      value: clean.length ? Math.round(clean.reduce((a, l) => a + l.score, 0) / clean.length) : 0,
      icon: Gauge,
    },
  ];

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((l) => l.spamStatus === filter)),
    [rows, filter],
  );

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
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{s.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="tnum mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">{s.value}</div>
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
            <div className="hidden items-center gap-1 rounded-xl border border-border bg-card p-1 sm:flex">
              {(["all", "clean", "spam", "duplicate"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
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
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                <th className="px-5 py-3">Lead</th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Source page</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Spam</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">CRM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className={cn("border-b border-border last:border-0 hover:bg-surface-sunken", l.spamStatus !== "clean" && "opacity-70")}>
                  <td className="px-5 py-3">
                    <div className="text-[13.5px] font-semibold text-foreground">{l.name}</div>
                    <div className="text-[12px] text-muted-foreground">{l.email}</div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-muted-foreground">{l.company}</td>
                  <td className="px-3 py-3">
                    <span className="text-[12.5px] text-muted-foreground">{l.pageTitle}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("tnum text-[13px] font-semibold", scoreColor(l.score))}>{l.score}</span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}
                      className={cn(
                        "cursor-pointer rounded-full border-0 px-2 py-0.5 text-[11.5px] font-semibold capitalize outline-none",
                        STATUS[l.status],
                      )}
                    >
                      {(["new", "qualified", "contacted", "won", "lost"] as LeadStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", SPAM[l.spamStatus].cls)}>{SPAM[l.spamStatus].label}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted-foreground">{relativeTime(l.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => syncLead(l.id)}
                        disabled={l.crmSyncStatus === "synced"}
                        className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        aria-label="Sync to CRM"
                        title={l.crmSyncStatus === "synced" ? "Synced" : "Sync to CRM"}
                      >
                        {l.crmSyncStatus === "synced" ? <Check className="size-3.5 text-positive" /> : <Cloud className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteLead(l.id)}
                        className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative"
                        aria-label="Delete lead"
                        title="Delete (GDPR)"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">No leads match this filter.</div>}
      </Panel>
    </div>
  );
}
