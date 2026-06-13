"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Loader2,
  PlugZap,
  Save,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { IntegrationStatus, TeamMember, WorkspaceSettings } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type Tab = "profile" | "integrations" | "team" | "notifications" | "billing";

const tabs: Array<{ id: Tab; label: string; icon: typeof Save }> = [
  { id: "profile", label: "Profile", icon: Save },
  { id: "integrations", label: "Integrations", icon: PlugZap },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const statusStyle: Record<IntegrationStatus, string> = {
  connected: "bg-positive/12 text-positive",
  "needs-attention": "bg-warning/15 text-warning",
  disabled: "bg-muted text-muted-foreground",
};

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm outline-none focus:border-ring focus:bg-card";

export function SettingsView({ initial }: { initial: WorkspaceSettings }) {
  const { notify, trackJob, confirm } = useAppFeedback();
  const [tab, setTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "",
    email: "",
    role: "analyst",
  });

  const dirty = useMemo(
    () => JSON.stringify(settings.profile) !== JSON.stringify(initial.profile),
    [settings.profile, initial.profile],
  );

  async function saveProfile() {
    setSaving(true);
    try {
      const result = await api.updateSettings({ profile: settings.profile });
      trackJob(result.job);
      setSettings(result.settings);
      notify({ kind: "success", title: "Workspace profile saved" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function updateNotifications(next: WorkspaceSettings["notifications"]) {
    const previous = settings;
    setSettings((current) => ({ ...current, notifications: next }));
    try {
      const result = await api.updateSettings({ notifications: next });
      trackJob(result.job);
      setSettings(result.settings);
      notify({ kind: "success", title: "Notification preferences saved" });
    } catch (err) {
      setSettings(previous);
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function toggleIntegration(id: string) {
    const integration = settings.integrations.find((item) => item.id === id);
    if (!integration) return;
    const status: IntegrationStatus = integration.status === "connected" ? "disabled" : "connected";
    const previous = settings;
    setSettings((current) => ({
      ...current,
      integrations: current.integrations.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
    try {
      const result = await api.updateIntegration(id, { status });
      trackJob(result.job);
      setSettings((current) => ({
        ...current,
        integrations: current.integrations.map((item) => (item.id === id ? result.integration : item)),
      }));
      notify({ kind: "success", title: "Integration updated", message: `${integration.label} is now ${status}.` });
    } catch (err) {
      setSettings(previous);
      notify({ kind: "error", title: "Integration update failed", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function addMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      notify({ kind: "error", title: "Name and email are required" });
      return;
    }
    try {
      const result = await api.addTeamMember(newMember);
      setSettings(result.settings);
      setNewMember({ name: "", email: "", role: "analyst" });
      notify({ kind: "success", title: "Team member added", message: result.member.email });
    } catch (err) {
      notify({ kind: "error", title: "Could not add member", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function removeMember(member: TeamMember) {
    if (member.role === "owner") {
      notify({ kind: "error", title: "Owner cannot be removed in the prototype" });
      return;
    }
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      message: `${member.name} will lose access to this workspace.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    const previous = settings;
    setSettings((current) => ({ ...current, team: current.team.filter((item) => item.id !== member.id) }));
    try {
      const result = await api.removeTeamMember(member.id);
      setSettings(result.settings);
      notify({ kind: "success", title: "Team member removed" });
    } catch (err) {
      setSettings(previous);
      notify({ kind: "error", title: "Could not remove member", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
      <Panel bodyClassName="p-2">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cn(
                  "flex h-11 min-w-fit items-center gap-2 rounded-xl px-3 text-left text-[13px] font-semibold transition-colors",
                  tab === item.id ? "bg-brand/12 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => setTab(item.id)}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </Panel>

      {tab === "profile" && (
        <Panel title="Workspace Profile" description="Default routing and identity used by generated pages.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {([
              ["workspaceName", "Workspace name"],
              ["domain", "Primary domain"],
              ["defaultPublishPath", "Default publish path"],
              ["timezone", "Timezone"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
                <input
                  className={inputCls}
                  value={settings.profile[key]}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      profile: { ...current.profile, [key]: event.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={saveProfile} disabled={!dirty || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save profile
            </Button>
          </div>
        </Panel>
      )}

      {tab === "integrations" && (
        <Panel title="Integrations" description="Prototype connectors with realistic status controls.">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            {settings.integrations.map((integration) => (
              <div key={integration.id} className="rounded-xl border border-border bg-surface-sunken p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-foreground">{integration.label}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{integration.description}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", statusStyle[integration.status])}>
                    {integration.status}
                  </span>
                </div>
                <Button variant="outline" className="mt-4 h-9 w-full" onClick={() => toggleIntegration(integration.id)}>
                  {integration.status === "connected" ? "Disable" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "team" && (
        <Panel title="Team" description="Add, view, and remove mock workspace users.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <input className={inputCls} placeholder="Name" value={newMember.name} onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))} />
            <input className={inputCls} placeholder="Email" value={newMember.email} onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))} />
            <select className={inputCls} value={newMember.role} onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value as TeamMember["role"] }))}>
              <option value="analyst">Analyst</option>
              <option value="marketer">Marketer</option>
              <option value="admin">Admin</option>
            </select>
            <Button className="h-10" onClick={addMember}>
              <UserPlus className="size-4" />
              Add
            </Button>
          </div>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {settings.team.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-brand/12 text-[12px] font-bold text-brand">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-foreground">{member.name}</div>
                  <div className="truncate text-[12px] text-muted-foreground">{member.email}</div>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold capitalize text-muted-foreground">{member.role}</span>
                <button
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-negative/10 hover:text-negative disabled:opacity-40"
                  disabled={member.role === "owner"}
                  onClick={() => removeMember(member)}
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "notifications" && (
        <Panel title="Notifications" description="Control the alerts this workspace sends.">
          <div className="space-y-3">
            {Object.entries(settings.notifications).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-border bg-surface-sunken p-4">
                <span className="text-[13px] font-semibold text-foreground">
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) =>
                    updateNotifications({ ...settings.notifications, [key]: event.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        </Panel>
      )}

      {tab === "billing" && (
        <Panel title="Billing" description="Mock billing state for the prototype.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Plan</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{settings.billing.plan}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Status</div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-positive/12 px-2 py-1 text-[12px] font-semibold capitalize text-positive">
                <Check className="size-3.5" />
                {settings.billing.status}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Seats</div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {settings.billing.seatsUsed}/{settings.billing.seatsLimit}
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
