"use client";

import { useState } from "react";
import { Plug, Check, ExternalLink, ShieldCheck, History, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type PublishingPolicy = { requireApproval: boolean; autoSitemap: boolean; autoLlms: boolean };

function Toggle({
  on,
  busy,
  onChange,
}: {
  on: boolean;
  busy?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-60",
        on ? "bg-brand" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      >
        {busy && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
      </span>
    </button>
  );
}

export function PublishingSettings() {
  const { notify } = useAppFeedback();
  const [policy, setPolicy] = useState<PublishingPolicy | null>(null);
  const [domain, setDomain] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof PublishingPolicy | null>(null);

  // Lazy-load the persisted policy the first time the sheet is opened.
  async function ensureLoaded(open: boolean) {
    if (!open || loaded) return;
    try {
      const settings = await api.getSettings();
      setPolicy(settings.publishing);
      setDomain((settings.profile?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""));
    } catch {
      setPolicy({ requireApproval: true, autoSitemap: true, autoLlms: true });
    } finally {
      setLoaded(true);
    }
  }

  // Persist a single toggle, optimistic with rollback on failure.
  async function save(key: keyof PublishingPolicy, value: boolean, label: string) {
    if (!policy) return;
    const previous = policy;
    setPolicy({ ...policy, [key]: value });
    setSavingKey(key);
    try {
      const { settings } = await api.updateSettings({ publishing: { ...policy, [key]: value } });
      setPolicy(settings.publishing);
      notify({ kind: "success", title: "Publishing settings saved", message: `${label} ${value ? "enabled" : "disabled"}.` });
    } catch (err) {
      setPolicy(previous);
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Sheet onOpenChange={ensureLoaded}>
      <SheetTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted">
        <Plug className="size-4" />
        Publishing settings
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <SheetTitle className="text-lg">Publishing</SheetTitle>
          <SheetDescription>Where pages go live and how AI crawlers find them.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {/* destination */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Destination</h3>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-positive/12 text-positive">
                <Check className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-foreground">Managed subdirectory</div>
                <div className="font-mono text-[12px] text-muted-foreground">{(domain || "your-domain.com") + "/feeds/…"}</div>
              </div>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-semibold text-positive">Active</span>
            </div>
          </section>

          {/* AI crawler surfaces */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Crawler surfaces</h3>
            <div className="mt-2 space-y-2">
              {([
                { label: "sitemap.xml", href: "/sitemap.xml", key: "autoSitemap" as const },
                { label: "llms.txt", href: "/llms.txt", key: "autoLlms" as const },
              ]).map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[13px] font-medium text-foreground">{row.label}</div>
                    <div className="text-[11.5px] text-muted-foreground">Auto-updated on publish</div>
                  </div>
                  <a href={row.href} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-brand" aria-label={`View ${row.label}`}>
                    <ExternalLink className="size-4" />
                  </a>
                  <Toggle
                    on={policy?.[row.key] ?? true}
                    busy={savingKey === row.key || !loaded}
                    onChange={(v) => save(row.key, v, row.label)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* policy */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Policy</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
                  Require human approval before publish
                </div>
                <Toggle
                  on={policy?.requireApproval ?? true}
                  busy={savingKey === "requireApproval" || !loaded}
                  onChange={(v) => save("requireApproval", v, "Approval gate")}
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <History className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground">Rollback retention</div>
                  <div className="text-[11.5px] text-muted-foreground">Keep the last 10 published versions per page</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
