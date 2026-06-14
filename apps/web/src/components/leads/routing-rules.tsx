"use client";

import { useState } from "react";
import { GitBranch, Plus, Trash2, Play, Loader2 } from "lucide-react";
import type { TeamMember } from "@geoseo/types";
import { pageEngineApi, type LeadRoutingRule } from "@/lib/page-engine-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

const FIELDS: { value: LeadRoutingRule["field"]; label: string }[] = [
  { value: "score", label: "Lead score" },
  { value: "company", label: "Company" },
  { value: "spamStatus", label: "Spam status" },
  { value: "pageTitle", label: "Source page" },
];
const OPS: { value: LeadRoutingRule["operator"]; label: string }[] = [
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
  { value: "eq", label: "is" },
  { value: "contains", label: "contains" },
];
const sel = "h-9 rounded-lg border border-border bg-surface-sunken px-2 text-[13px] outline-none focus:border-ring focus:bg-card";

export function RoutingRules({ initialRules, team }: { initialRules: LeadRoutingRule[]; team: TeamMember[] }) {
  const { notify } = useAppFeedback();
  const [rules, setRules] = useState<LeadRoutingRule[]>(initialRules);
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState<Omit<LeadRoutingRule, "id">>({
    name: "",
    enabled: true,
    field: "score",
    operator: "gte",
    value: "",
    ownerId: team[0]?.id ?? "",
  });

  const ownerName = (id: string) => team.find((t) => t.id === id)?.name ?? id;

  async function add() {
    if (!draft.name.trim() || !draft.value.trim() || !draft.ownerId) {
      notify({ kind: "error", title: "Name, value, and owner are required" });
      return;
    }
    try {
      const rule = await pageEngineApi.createRoutingRule(draft);
      setRules((r) => [...r, rule]);
      setDraft({ name: "", enabled: true, field: "score", operator: "gte", value: "", ownerId: team[0]?.id ?? "" });
      setOpen(false);
      notify({ kind: "success", title: "Routing rule added" });
    } catch (err) {
      notify({ kind: "error", title: "Add failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function toggle(rule: LeadRoutingRule) {
    setRules((r) => r.map((x) => (x.id === rule.id ? { ...x, enabled: !x.enabled } : x)));
    try {
      await pageEngineApi.updateRoutingRule(rule.id, { enabled: !rule.enabled });
    } catch {
      setRules((r) => r.map((x) => (x.id === rule.id ? rule : x)));
      notify({ kind: "error", title: "Update failed" });
    }
  }

  async function remove(id: string) {
    const prev = rules;
    setRules((r) => r.filter((x) => x.id !== id));
    try {
      await pageEngineApi.deleteRoutingRule(id);
    } catch {
      setRules(prev);
      notify({ kind: "error", title: "Delete failed" });
    }
  }

  async function apply() {
    setApplying(true);
    try {
      const routed = await pageEngineApi.applyRouting();
      notify({
        kind: "success",
        title: routed > 0 ? `Routed ${routed} lead${routed === 1 ? "" : "s"}` : "No unassigned leads matched",
        message: routed > 0 ? "Owners assigned by your rules." : undefined,
      });
    } catch (err) {
      notify({ kind: "error", title: "Apply failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <GitBranch className="size-4" />
          </span>
          <div>
            <h3 className="text-[13.5px] font-semibold text-foreground">Routing rules</h3>
            <p className="text-[12px] text-muted-foreground">Auto-assign new leads to an owner when they match.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={apply} disabled={applying || rules.length === 0}>
            {applying ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Apply to unassigned
          </Button>
          <Button size="sm" className="h-8 rounded-full" onClick={() => setOpen((v) => !v)}>
            <Plus className="size-3.5" /> Rule
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface-sunken p-3">
          <input
            className={cn(sel, "min-w-[140px] flex-1")}
            placeholder="Rule name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <select className={sel} value={draft.field} onChange={(e) => setDraft((d) => ({ ...d, field: e.target.value as LeadRoutingRule["field"] }))}>
            {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select className={sel} value={draft.operator} onChange={(e) => setDraft((d) => ({ ...d, operator: e.target.value as LeadRoutingRule["operator"] }))}>
            {OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            className={cn(sel, "w-24")}
            placeholder="value"
            value={draft.value}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
          />
          <span className="text-[12px] text-muted-foreground">→</span>
          <select className={sel} value={draft.ownerId} onChange={(e) => setDraft((d) => ({ ...d, ownerId: e.target.value }))}>
            {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Button size="sm" className="h-9" onClick={add}>Save</Button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {rules.length === 0 && !open && (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
            No routing rules yet. Add one to auto-assign inbound leads.
          </div>
        )}
        {rules.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <button
              role="switch"
              aria-checked={r.enabled}
              onClick={() => toggle(r)}
              className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", r.enabled ? "bg-brand" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", r.enabled ? "translate-x-[18px]" : "translate-x-0.5")} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-foreground">{r.name}</div>
              <div className="text-[11.5px] text-muted-foreground">
                {FIELDS.find((f) => f.value === r.field)?.label} {OPS.find((o) => o.value === r.operator)?.label} <span className="font-medium text-foreground/80">{r.value}</span> → {ownerName(r.ownerId)}
              </div>
            </div>
            <button
              onClick={() => remove(r.id)}
              aria-label={`Delete ${r.name}`}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
