"use client";

import { useId, useMemo, useState } from "react";
import {
  Bell,
  BrainCircuit,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  PlugZap,
  Save,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { IntegrationStatus, TeamMember, WorkspaceSettings } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { BrandScorecard } from "@/components/dashboard/brand-scorecard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type Tab = "profile" | "brand" | "integrations" | "team" | "notifications" | "billing";

const tabs: Array<{ id: Tab; label: string; icon: typeof Save }> = [
  { id: "profile", label: "Profile", icon: Save },
  { id: "brand", label: "Brand Context", icon: BrainCircuit },
  { id: "integrations", label: "Integrations", icon: PlugZap },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const statusVariant: Record<IntegrationStatus, "positive" | "warning" | "muted"> = {
  connected: "positive",
  "needs-attention": "warning",
  disabled: "muted",
};

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-body outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:bg-card";

export function SettingsView({ initial }: { initial: WorkspaceSettings }) {
  const { notify, trackJob, confirm } = useAppFeedback();
  const params = useSearchParams();
  const initialTab = (tabs.find((t) => t.id === params.get("tab"))?.id ?? "profile") as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);
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

  const wpIntegration = settings.integrations.find((i) => i.id === "wordpress");
  const [wpForm, setWpForm] = useState({
    siteUrl: wpIntegration?.credentials?.siteUrl ?? "",
    username: wpIntegration?.credentials?.username ?? "",
    appPassword: wpIntegration?.credentials?.appPassword ?? "",
  });
  const [wpTesting, setWpTesting] = useState(false);
  const [wpSaving, setWpSaving] = useState(false);
  const [wpTestResult, setWpTestResult] = useState<{ ok: boolean; user?: string; error?: string } | null>(null);

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

  async function testWordPress() {
    if (!wpForm.siteUrl || !wpForm.username || !wpForm.appPassword) {
      notify({ kind: "error", title: "Fill in all three WordPress fields before testing" });
      return;
    }
    setWpTesting(true);
    setWpTestResult(null);
    try {
      const result = await api.testWordPressConnection(wpForm);
      setWpTestResult(result);
    } catch (err) {
      setWpTestResult({ ok: false, error: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setWpTesting(false);
    }
  }

  async function saveWordPress() {
    if (!wpForm.siteUrl || !wpForm.username || !wpForm.appPassword) {
      notify({ kind: "error", title: "Fill in all three fields to connect WordPress" });
      return;
    }
    setWpSaving(true);
    try {
      const result = await api.updateIntegration("wordpress", {
        credentials: wpForm,
        status: "connected",
      });
      trackJob(result.job);
      setSettings((current) => ({
        ...current,
        integrations: current.integrations.map((i) => (i.id === "wordpress" ? result.integration : i)),
      }));
      notify({ kind: "success", title: "WordPress connected", message: `Publishing to ${wpForm.siteUrl}` });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setWpSaving(false);
    }
  }

  async function disconnectWordPress() {
    const ok = await confirm({
      title: "Disconnect WordPress?",
      message: "Saved credentials will be removed. Pages already published will remain on your site.",
      confirmLabel: "Disconnect",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const result = await api.updateIntegration("wordpress", { credentials: {}, status: "needs-attention" });
      trackJob(result.job);
      setSettings((current) => ({
        ...current,
        integrations: current.integrations.map((i) => (i.id === "wordpress" ? result.integration : i)),
      }));
      setWpForm({ siteUrl: "", username: "", appPassword: "" });
      setWpTestResult(null);
      notify({ kind: "success", title: "WordPress disconnected" });
    } catch (err) {
      notify({ kind: "error", title: "Could not disconnect", message: err instanceof Error ? err.message : "Try again." });
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

  async function updateRole(member: TeamMember, role: TeamMember["role"]) {
    const previous = settings;
    setSettings((current) => ({ ...current, team: current.team.map((m) => (m.id === member.id ? { ...m, role } : m)) }));
    try {
      const result = await api.updateTeamMember(member.id, { role });
      setSettings(result.settings);
      notify({ kind: "success", title: "Role updated", message: `${member.name} → ${role}` });
    } catch (err) {
      setSettings(previous);
      notify({ kind: "error", title: "Could not update role", message: err instanceof Error ? err.message : "Try again." });
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
                  "flex h-11 min-w-fit items-center gap-2 rounded-xl px-3 text-left text-label font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
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
              <label key={key} className="block">
                <span className="text-label font-semibold text-muted-foreground">{label}</span>
                <input
                  className={cn(inputCls, "mt-1.5")}
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
            <Button variant="brand" onClick={saveProfile} disabled={!dirty} loading={saving}>
              {!saving && <Save className="size-4" />}
              Save profile
            </Button>
          </div>
        </Panel>
      )}

      {tab === "brand" && (
        <div className="space-y-5">
          <Panel
            title="Brand Context"
            description="The business facts every agent uses to ground generated pages, content, and outreach."
          >
            <p className="text-body leading-relaxed text-muted-foreground">
              Brand Memory is your workspace&apos;s source of truth — company, value proposition, products,
              buyer personas, and proof points. Keeping it complete is what makes generated pages accurate and
              on-brand instead of generic.
            </p>
            <Link
              href="/brand"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-label font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BrainCircuit className="size-4 text-brand" />
              Open Brand Memory
            </Link>
          </Panel>
          <BrandScorecard />
        </div>
      )}

      {tab === "integrations" && (
        <div className="space-y-5">
          {/* WordPress — full credential form */}
          <Panel
            title="WordPress"
            description="Publish generated pages directly to your WordPress site. Uses the WordPress REST API with Application Passwords."
          >
            <div className="space-y-4">
              {/* Connection status banner */}
              {wpIntegration?.status === "connected" && (
                <div className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/8 px-4 py-3">
                  <CheckCircle2 className="size-4 shrink-0 text-positive" />
                  <span className="text-label font-semibold text-positive">
                    Connected{wpIntegration.credentials?.siteUrl ? ` — ${wpIntegration.credentials.siteUrl}` : ""}
                  </span>
                  <a
                    href={wpIntegration.credentials?.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-label text-positive/80 hover:text-positive focus-visible:outline-none"
                    aria-label="Open WordPress site"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="text-label font-semibold text-muted-foreground">Site URL</span>
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    placeholder="https://yoursite.com"
                    value={wpForm.siteUrl}
                    onChange={(e) => { setWpForm((f) => ({ ...f, siteUrl: e.target.value })); setWpTestResult(null); }}
                  />
                </label>
                <label className="block">
                  <span className="text-label font-semibold text-muted-foreground">Username</span>
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    placeholder="your-wp-username"
                    autoComplete="username"
                    value={wpForm.username}
                    onChange={(e) => { setWpForm((f) => ({ ...f, username: e.target.value })); setWpTestResult(null); }}
                  />
                </label>
                <label className="block">
                  <span className="text-label font-semibold text-muted-foreground">Application Password</span>
                  <input
                    className={cn(inputCls, "mt-1.5")}
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    autoComplete="new-password"
                    value={wpForm.appPassword}
                    onChange={(e) => { setWpForm((f) => ({ ...f, appPassword: e.target.value })); setWpTestResult(null); }}
                  />
                </label>
              </div>

              <p className="text-label text-muted-foreground">
                Use an{" "}
                <strong className="font-semibold text-foreground">Application Password</strong>
                {" "}— not your login password. Create one in WordPress{" "}
                <span className="font-medium text-foreground">→ Users → Edit Profile → Application Passwords</span>.
              </p>

              {/* Test result */}
              {wpTestResult && (
                <div className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-3",
                  wpTestResult.ok
                    ? "border-positive/30 bg-positive/8 text-positive"
                    : "border-negative/30 bg-negative/8 text-negative",
                )}>
                  {wpTestResult.ok
                    ? <CheckCircle2 className="size-4 shrink-0" />
                    : <XCircle className="size-4 shrink-0" />}
                  <span className="text-label font-semibold">
                    {wpTestResult.ok
                      ? `Connected${wpTestResult.user ? ` as ${wpTestResult.user}` : ""}`
                      : wpTestResult.error ?? "Connection failed"}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={testWordPress} disabled={wpTesting || wpSaving} loading={wpTesting}>
                  {!wpTesting && <PlugZap className="size-4" />}
                  Test connection
                </Button>
                <Button variant="brand" onClick={saveWordPress} disabled={wpSaving || wpTesting} loading={wpSaving}>
                  {!wpSaving && <Save className="size-4" />}
                  Save & enable
                </Button>
                {wpIntegration?.status === "connected" && (
                  <Button variant="outline" className="text-negative hover:border-negative/40 hover:bg-negative/8" onClick={disconnectWordPress}>
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </Panel>

          {/* Other integrations */}
          <Panel title="Other Integrations" description="Additional connectors — toggle to reflect your current setup.">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {settings.integrations.filter((i) => i.id !== "wordpress").map((integration) => (
                <div key={integration.id} className="rounded-xl border border-border bg-surface-sunken p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-h-card text-foreground">{integration.label}</div>
                      <p className="mt-1 text-label leading-relaxed text-muted-foreground">{integration.description}</p>
                    </div>
                    <Badge variant={statusVariant[integration.status]} className="capitalize">
                      {integration.status}
                    </Badge>
                  </div>
                  <Button variant="outline" className="mt-4 h-9 w-full" onClick={() => toggleIntegration(integration.id)}>
                    {integration.status === "connected" ? "Disable" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "team" && (
        <Panel title="Team" description="Add, view, and remove mock workspace users.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <input className={inputCls} placeholder="Name" aria-label="New member name" value={newMember.name} onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))} />
            <input className={inputCls} placeholder="Email" aria-label="New member email" value={newMember.email} onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))} />
            <select className={inputCls} aria-label="New member role" value={newMember.role} onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value as TeamMember["role"] }))}>
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
                  <div className="truncate text-label font-semibold text-foreground">{member.name}</div>
                  <div className="truncate text-label text-muted-foreground">{member.email}</div>
                </div>
                {member.role === "owner" ? (
                  <Badge variant="muted" className="capitalize">{member.role}</Badge>
                ) : (
                  <select
                    className="h-8 rounded-lg border border-border bg-surface-sunken px-2 text-label font-medium capitalize outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={member.role}
                    onChange={(e) => updateRole(member, e.target.value as TeamMember["role"])}
                    aria-label={`Role for ${member.name}`}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="marketer">Marketer</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
                <button
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
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
              <NotificationToggle
                key={key}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                checked={enabled}
                onCheckedChange={(next) =>
                  updateNotifications({ ...settings.notifications, [key]: next })
                }
              />
            ))}
          </div>
        </Panel>
      )}

      {tab === "billing" && (
        <Panel title="Billing" description="Mock billing state for the prototype.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-micro font-semibold uppercase text-muted-foreground">Plan</div>
              <div className="mt-1 text-kpi text-foreground">{settings.billing.plan}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-micro font-semibold uppercase text-muted-foreground">Status</div>
              <Badge variant="positive" className="mt-2 capitalize">
                <Check className="size-3.5" />
                {settings.billing.status}
              </Badge>
            </div>
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="text-micro font-semibold uppercase text-muted-foreground">Seats</div>
              <div className="mt-1 text-kpi text-foreground">
                {settings.billing.seatsUsed}/{settings.billing.seatsLimit}
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function NotificationToggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-sunken p-4">
      <label htmlFor={id} className="text-label font-semibold text-foreground select-none">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
