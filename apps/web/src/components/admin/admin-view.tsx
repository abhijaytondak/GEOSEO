"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platformApi, type AdminOverview, type ProviderHealth, type ProviderStatus } from "@/lib/platform-client";

const PROVIDER_ICON: Record<ProviderStatus["status"], { Icon: typeof CheckCircle2; cls: string }> = {
  connected: { Icon: CheckCircle2, cls: "text-positive" },
  not_configured: { Icon: CircleSlash, cls: "text-muted-foreground/60" },
  error: { Icon: XCircle, cls: "text-destructive" },
  disabled: { Icon: CircleSlash, cls: "text-muted-foreground/60" },
};

export function AdminView() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = () =>
    Promise.all([platformApi.getAdminOverview(), platformApi.getProviderHealth()])
      .then(([o, h]) => {
        setOverview(o);
        setHealth(h);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load admin diagnostics."))
      .finally(() => setLoading(false));
  useEffect(() => {
    void fetchAll();
  }, []);
  const reload = () => {
    setLoading(true);
    setError(null);
    void fetchAll();
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading diagnostics…</div>;
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[13px] text-foreground">
        <p className="font-semibold">Admin console unavailable.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          In non-demo environments this requires the <code>x-admin-token</code> header to match <code>ADMIN_API_TOKEN</code>.
        </p>
        <Button size="sm" variant="outline" className="mt-3" onClick={reload}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* system overview */}
      {overview && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Mode" value={overview.mode} />
          <Stat
            label="Database"
            value={overview.db.reachable ? "Reachable" : overview.db.configured ? "Unreachable" : "Not configured"}
            tone={overview.db.reachable ? "ok" : overview.db.configured ? "bad" : "muted"}
          />
          <Stat label="Queue" value={overview.queue.configured ? "Redis" : "In-memory"} tone={overview.queue.configured ? "ok" : "warn"} />
          <Stat label="Workspaces" value={String(overview.workspaces)} />
          <Stat label="Jobs total" value={String(overview.jobs.total)} />
          <Stat label="Jobs running" value={String(overview.jobs.running)} />
          <Stat label="Jobs failed" value={String(overview.jobs.failed)} tone={overview.jobs.failed > 0 ? "bad" : "ok"} />
          {health && <Stat label="Providers live" value={`${health.summary.connected}/${health.summary.total}`} />}
        </div>
      )}

      {/* provider health */}
      {health && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-foreground">Provider health</h3>
            <span className="text-[11.5px] text-muted-foreground">checked {new Date(health.checkedAt).toLocaleTimeString()}</span>
          </div>
          <div className="divide-y divide-border">
            {health.providers.map((p) => {
              const { Icon, cls } = PROVIDER_ICON[p.status];
              return (
                <div key={p.provider} className="flex items-start gap-3 py-2.5 text-[12.5px]">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", cls)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{p.label}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">{p.category}</span>
                    </div>
                    {(p.setupHint || p.message || p.reason) && (
                      <p className="mt-0.5 text-muted-foreground">{p.setupHint ?? p.message ?? p.reason}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11.5px] font-semibold capitalize text-muted-foreground">{p.status.replace("_", " ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* recent jobs */}
      {overview && overview.jobs.recent.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-[14px] font-semibold text-foreground">Recent jobs</h3>
          <div className="space-y-1.5">
            {overview.jobs.recent.slice(0, 12).map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="truncate text-foreground">{j.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  {j.error && <AlertTriangle className="size-3.5 text-destructive" />}
                  <span className="capitalize">{j.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "ok" | "bad" | "warn" | "muted" }) {
  const toneCls =
    tone === "ok" ? "text-positive" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-warning" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-[16px] font-semibold capitalize tnum", toneCls)}>{value}</div>
    </div>
  );
}
