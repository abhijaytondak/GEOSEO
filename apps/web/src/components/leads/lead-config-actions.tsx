"use client";

import { useId, useState } from "react";
import { Bell, FileText, Plus, Trash2, RefreshCw, Check } from "lucide-react";
import type { LeadFormConfig, LeadNotificationChannel, LeadNotificationRule } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

const CHANNELS: LeadNotificationChannel[] = ["in_app", "email", "slack", "webhook"];
const fieldCls = "w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:bg-card";

export function LeadConfigActions() {
  return (
    <div className="flex items-center gap-2">
      <NotificationRulesSheet />
      <LeadFormsSheet />
    </div>
  );
}

/* ----------------------------------------------- notification rules */
function NotificationRulesSheet() {
  const { notify } = useAppFeedback();
  const minScoreId = useId();
  const [rules, setRules] = useState<LeadNotificationRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [channels, setChannels] = useState<LeadNotificationChannel[]>(["in_app"]);
  const [busy, setBusy] = useState(false);

  async function load(open: boolean) {
    if (!open || loaded) return;
    try {
      setRules(await pageEngineApi.getNotificationRules());
    } finally {
      setLoaded(true);
    }
  }

  async function create() {
    if (!name.trim()) return notify({ kind: "error", title: "Name the rule" });
    setBusy(true);
    try {
      const rule = await pageEngineApi.createNotificationRule({
        name: name.trim(),
        channels,
        minScore: minScore ? Number(minScore) : undefined,
      });
      setRules((r) => [...r, rule]);
      setName("");
      notify({ kind: "success", title: "Rule created", message: rule.name });
    } catch (err) {
      notify({ kind: "error", title: "Create failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(rule: LeadNotificationRule) {
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    try {
      await pageEngineApi.updateNotificationRule(rule.id, { enabled: !rule.enabled });
    } catch {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? rule : r)));
      notify({ kind: "error", title: "Update failed" });
    }
  }

  async function remove(rule: LeadNotificationRule) {
    const prev = rules;
    setRules((rs) => rs.filter((r) => r.id !== rule.id));
    try {
      await pageEngineApi.deleteNotificationRule(rule.id);
    } catch {
      setRules(prev);
      notify({ kind: "error", title: "Delete failed" });
    }
  }

  return (
    <Sheet onOpenChange={load}>
      <SheetTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-label font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Bell className="size-4" /> Notification rules
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <SheetTitle className="text-lg">Notification rules</SheetTitle>
          <SheetDescription>Alert your team when high-fit leads arrive.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {/* new rule */}
          <div className="rounded-xl border border-border bg-surface-sunken p-3.5">
            <div className="text-micro font-semibold uppercase text-muted-foreground">New rule</div>
            <input className={cn(fieldCls, "mt-2")} placeholder="e.g. High-fit leads → Slack" aria-label="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="mt-2 flex items-center gap-2">
              <Label htmlFor={minScoreId} className="text-label text-muted-foreground">Min score</Label>
              <input id={minScoreId} type="number" min={0} max={100} className={cn(fieldCls, "h-9 w-20")} value={minScore} onChange={(e) => setMinScore(e.target.value)} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => {
                const on = channels.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChannels((cur) => (on ? cur.filter((x) => x !== c) : [...cur, c]))}
                    className={cn("rounded-full border px-2.5 py-1 text-label capitalize transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    {c.replace("_", "-")}
                  </button>
                );
              })}
            </div>
            <Button variant="brand" className="mt-3 h-9 w-full rounded-lg" loading={busy} onClick={create}>
              {!busy && <Plus className="size-4" />} Add rule
            </Button>
          </div>

          {/* existing rules */}
          <div className="space-y-2">
            {!loaded && <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>}
            {loaded && rules.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No rules yet.</div>}
            {rules.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-foreground">{r.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {r.minScore != null ? `score ≥ ${r.minScore} · ` : ""}{r.channels.map((c) => c.replace("_", "-")).join(", ")}
                  </div>
                </div>
                <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} aria-label={`Toggle ${r.name}`} />
                <button onClick={() => remove(r)} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-negative/10 hover:text-negative" aria-label="Delete rule">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------------------------------------- lead forms */
function LeadFormsSheet() {
  const { notify } = useAppFeedback();
  const [forms, setForms] = useState<LeadFormConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load(open: boolean) {
    if (!open || loaded) return;
    try {
      setForms(await pageEngineApi.getLeadForms());
    } finally {
      setLoaded(true);
    }
  }

  function setField(id: string, patch: Partial<LeadFormConfig>) {
    setForms((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function save(form: LeadFormConfig) {
    setSavingId(form.id);
    try {
      const updated = await pageEngineApi.updateLeadForm(form.id, {
        ctaText: form.ctaText,
        thankYouTitle: form.thankYouTitle,
        consentRequired: form.consentRequired,
      });
      setForms((fs) => fs.map((f) => (f.id === form.id ? updated : f)));
      notify({ kind: "success", title: "Form saved", message: form.name });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSavingId(null);
    }
  }

  async function removeForm(form: LeadFormConfig) {
    const prev = forms;
    setForms((fs) => fs.filter((f) => f.id !== form.id));
    try {
      await pageEngineApi.deleteLeadForm(form.id);
      notify({ kind: "success", title: "Form deleted", message: form.name });
    } catch (err) {
      setForms(prev);
      notify({ kind: "error", title: "Delete failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function createForm() {
    try {
      const form = await pageEngineApi.createLeadForm({ name: `Form ${forms.length + 1}` });
      setForms((fs) => [...fs, form]);
      notify({ kind: "success", title: "Form created" });
    } catch (err) {
      notify({ kind: "error", title: "Create failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <Sheet onOpenChange={load}>
      <SheetTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted">
        <FileText className="size-4" /> Lead forms
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <SheetTitle className="text-lg">Lead forms</SheetTitle>
          <SheetDescription>Configure capture forms used on your published pages.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-5">
          <Button variant="outline" className="h-9 w-full" onClick={createForm}>
            <Plus className="size-4" /> New form
          </Button>
          {!loaded && <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>}
          {forms.map((f) => (
            <div key={f.id} className="space-y-2.5 rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-foreground">{f.name}</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">{f.fields.length} fields</span>
                  <button
                    onClick={() => removeForm(f)}
                    aria-label={`Delete ${f.name}`}
                    className="text-muted-foreground transition-colors hover:text-negative"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">CTA text</label>
                <input className={cn(fieldCls, "mt-1 h-9")} value={f.ctaText} onChange={(e) => setField(f.id, { ctaText: e.target.value })} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Thank-you title</label>
                <input className={cn(fieldCls, "mt-1 h-9")} value={f.thankYouTitle} onChange={(e) => setField(f.id, { thankYouTitle: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-foreground">
                <input type="checkbox" checked={f.consentRequired} onChange={(e) => setField(f.id, { consentRequired: e.target.checked })} />
                Require consent checkbox
              </label>
              <Button size="sm" className="h-8" disabled={savingId === f.id} onClick={() => save(f)}>
                {savingId === f.id ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
