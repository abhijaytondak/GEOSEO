"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { LeadNotificationChannel, LeadNotificationRule } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

/* ---------------------------------------------------------------- constants */

const ALL_CHANNELS: { id: LeadNotificationChannel; label: string }[] = [
  { id: "in_app", label: "In-app" },
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack" },
  { id: "webhook", label: "Webhook" },
];

const ALL_STATUSES: { id: string; label: string }[] = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "contacted", label: "Contacted" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:bg-card";

/* ---------------------------------------------------------------- blank draft */

type RuleDraft = {
  name: string;
  enabled: boolean;
  channels: LeadNotificationChannel[];
  statuses: string[];
  minScore: string; // kept as string for the input; coerced on save
  webhookUrl: string;
};

function blankDraft(): RuleDraft {
  return { name: "", enabled: true, channels: ["in_app"], statuses: [], minScore: "", webhookUrl: "" };
}

/* ---------------------------------------------------------------- helpers */

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function ruleToPayload(draft: RuleDraft): Omit<LeadNotificationRule, "id" | "workspaceId"> {
  return {
    name: draft.name.trim(),
    enabled: draft.enabled,
    channels: draft.channels,
    statuses: draft.statuses.length > 0 ? draft.statuses : undefined,
    minScore: draft.minScore !== "" ? Number(draft.minScore) : undefined,
    webhookUrl: draft.webhookUrl.trim() !== "" ? draft.webhookUrl.trim() : undefined,
  };
}

function ruleToRuleDraft(rule: LeadNotificationRule): RuleDraft {
  return {
    name: rule.name,
    enabled: rule.enabled,
    channels: [...rule.channels],
    statuses: rule.statuses ? [...rule.statuses] : [],
    minScore: rule.minScore !== undefined ? String(rule.minScore) : "",
    webhookUrl: rule.webhookUrl ?? "",
  };
}

/* ---------------------------------------------------------------- sub-components */

function CheckboxGroup<T extends string>({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: { id: T; label: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const groupId = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={groupId}>
        {items.map(({ id, label: itemLabel }) => {
          const checked = selected.includes(id);
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-1 text-label font-medium transition-colors",
                checked
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-surface-sunken text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onChange(toggleItem(selected, id))}
              />
              {itemLabel}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------------------------------------------------------------- rule row */

function RuleRow({
  rule,
  onToggle,
  onSave,
  onDelete,
}: {
  rule: LeadNotificationRule;
  onToggle: (enabled: boolean) => void;
  onSave: (draft: RuleDraft) => Promise<void>;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<RuleDraft>(() => ruleToRuleDraft(rule));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const minScoreId = useId();

  // Keep draft in sync when rule prop changes (e.g. after optimistic toggle).
  useEffect(() => {
    setDraft(ruleToRuleDraft(rule));
  }, [rule]);

  async function handleSave() {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await onSave(draft);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  const channelSummary = rule.channels.length
    ? rule.channels.map((c) => ALL_CHANNELS.find((x) => x.id === c)?.label ?? c).join(", ")
    : "No channels";

  return (
    <div className="card-lift rounded-xl border border-border bg-card shadow-xs transition-shadow">
      {/* collapsed header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Switch
          checked={rule.enabled}
          onCheckedChange={onToggle}
          aria-label={`${rule.enabled ? "Disable" : "Enable"} rule "${rule.name}"`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-semibold text-foreground">{rule.name}</div>
          <div className="truncate text-[12px] text-muted-foreground">
            {channelSummary}
            {rule.minScore !== undefined && ` · min score ${rule.minScore}`}
            {rule.statuses && rule.statuses.length > 0 && ` · ${rule.statuses.join(", ")}`}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse rule" : "Expand rule"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
      </div>

      {/* expanded editor */}
      <div
        ref={panelRef}
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
        )}
        aria-hidden={!expanded}
      >
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={nameId}
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                Rule name
              </label>
              <input
                id={nameId}
                className={inputCls}
                value={draft.name}
                placeholder="e.g. High-score leads"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <label
                htmlFor={minScoreId}
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                Min score (optional)
              </label>
              <input
                id={minScoreId}
                type="number"
                min={0}
                max={100}
                className={inputCls}
                value={draft.minScore}
                placeholder="0–100"
                onChange={(e) => setDraft((d) => ({ ...d, minScore: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id={`enabled-${nameId}`}
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
            />
            <label
              htmlFor={`enabled-${nameId}`}
              className="cursor-pointer select-none text-label font-semibold text-foreground"
            >
              Enabled
            </label>
          </div>

          <CheckboxGroup
            label="Channels"
            items={ALL_CHANNELS}
            selected={draft.channels}
            onChange={(channels) => setDraft((d) => ({ ...d, channels }))}
          />

          {draft.channels.includes("webhook") && (
            <div>
              <label
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                Webhook URL
              </label>
              <input
                type="url"
                className={inputCls}
                value={draft.webhookUrl}
                placeholder="https://hooks.example.com/geoseo"
                onChange={(e) => setDraft((d) => ({ ...d, webhookUrl: e.target.value }))}
              />
            </div>
          )}

          <CheckboxGroup
            label="Statuses (leave blank for all)"
            items={ALL_STATUSES}
            selected={draft.statuses}
            onChange={(statuses) => setDraft((d) => ({ ...d, statuses }))}
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="brand"
              className="h-9"
              onClick={handleSave}
              disabled={saving || !draft.name.trim() || draft.channels.length === 0}
              loading={saving}
            >
              {!saving && <Save className="size-3.5" />}
              Save rule
            </Button>
            <Button
              variant="outline"
              className="h-9 text-negative hover:border-negative/40 hover:bg-negative/8"
              onClick={handleDelete}
              disabled={deleting}
              loading={deleting}
            >
              {!deleting && <Trash2 className="size-3.5" />}
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- add-rule form */

function AddRuleForm({
  onAdd,
  onCancel,
}: {
  onAdd: (draft: RuleDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RuleDraft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const nameId = useId();
  const minScoreId = useId();

  async function handleSave() {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await onAdd(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up space-y-4 rounded-xl border border-brand/30 bg-brand/5 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={nameId}
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            Rule name
          </label>
          <input
            id={nameId}
            autoFocus
            className={inputCls}
            value={draft.name}
            placeholder="e.g. High-score leads"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <label
            htmlFor={minScoreId}
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            Min score (optional)
          </label>
          <input
            id={minScoreId}
            type="number"
            min={0}
            max={100}
            className={inputCls}
            value={draft.minScore}
            placeholder="0–100"
            onChange={(e) => setDraft((d) => ({ ...d, minScore: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id={`new-enabled-${nameId}`}
          checked={draft.enabled}
          onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
        />
        <label
          htmlFor={`new-enabled-${nameId}`}
          className="cursor-pointer select-none text-label font-semibold text-foreground"
        >
          Enabled
        </label>
      </div>

      <CheckboxGroup
        label="Channels"
        items={ALL_CHANNELS}
        selected={draft.channels}
        onChange={(channels) => setDraft((d) => ({ ...d, channels }))}
      />

      {draft.channels.includes("webhook") && (
        <div>
          <label
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            Webhook URL
          </label>
          <input
            type="url"
            className={inputCls}
            value={draft.webhookUrl}
            placeholder="https://hooks.example.com/geoseo"
            onChange={(e) => setDraft((d) => ({ ...d, webhookUrl: e.target.value }))}
          />
        </div>
      )}

      <CheckboxGroup
        label="Statuses (leave blank for all)"
        items={ALL_STATUSES}
        selected={draft.statuses}
        onChange={(statuses) => setDraft((d) => ({ ...d, statuses }))}
      />

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="brand"
          className="h-9"
          onClick={handleSave}
          disabled={saving || !draft.name.trim() || draft.channels.length === 0}
          loading={saving}
        >
          {!saving && <Save className="size-3.5" />}
          Create rule
        </Button>
        <Button variant="outline" className="h-9" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- main export */

export function LeadNotificationConfig() {
  const { notify, confirm } = useAppFeedback();
  const [rules, setRules] = useState<LeadNotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getNotificationRules()
      .then((r) => { if (!cancelled) setRules(r); })
      .catch((err) => {
        if (!cancelled) notify({ kind: "error", title: "Could not load rules", message: err instanceof Error ? err.message : "Try again." });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [notify]);

  async function handleToggle(rule: LeadNotificationRule, enabled: boolean) {
    const previous = rules;
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));
    try {
      const updated = await api.updateNotificationRule(rule.id, { enabled });
      setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      notify({ kind: "success", title: enabled ? "Rule enabled" : "Rule disabled" });
    } catch (err) {
      setRules(previous);
      notify({ kind: "error", title: "Update failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function handleSave(rule: LeadNotificationRule, draft: RuleDraft) {
    try {
      const updated = await api.updateNotificationRule(rule.id, ruleToPayload(draft));
      setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      notify({ kind: "success", title: "Rule saved" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
      throw err; // re-throw so the row stays open
    }
  }

  async function handleDelete(rule: LeadNotificationRule) {
    const ok = await confirm({
      title: `Delete "${rule.name}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.deleteNotificationRule(rule.id);
      setRules((rs) => rs.filter((r) => r.id !== rule.id));
      notify({ kind: "success", title: "Rule deleted" });
    } catch (err) {
      notify({ kind: "error", title: "Delete failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function handleAdd(draft: RuleDraft) {
    try {
      const created = await api.createNotificationRule(ruleToPayload(draft));
      setRules((rs) => [...rs, created]);
      setAdding(false);
      notify({ kind: "success", title: "Rule created", message: draft.name });
    } catch (err) {
      notify({ kind: "error", title: "Could not create rule", message: err instanceof Error ? err.message : "Try again." });
      throw err;
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-label text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading rules…
        </div>
      ) : rules.length === 0 && !adding ? (
        <EmptyState
          icon={Bell}
          title="No alert rules yet"
          description="Create a rule to get notified when leads arrive matching your criteria."
          className="py-8"
        />
      ) : (
        <div className="space-y-2.5">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onToggle={(enabled) => handleToggle(rule, enabled)}
              onSave={(draft) => handleSave(rule, draft)}
              onDelete={() => handleDelete(rule)}
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddRuleForm onAdd={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <Button
          variant="outline"
          className="h-9 w-full"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3.5" />
          Add rule
        </Button>
      )}
    </div>
  );
}
