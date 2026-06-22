"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  ArrowRight,
  Bot,
  Sparkles,
  TrendingDown,
  Unlink,
} from "lucide-react";
import type { Alert, AlertSeverity, AlertType } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppFeedback } from "@/components/system/app-feedback";

type Filter = "all" | AlertSeverity;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
  { key: "success", label: "Wins" },
];

const SUMMARY: {
  key: AlertSeverity;
  label: string;
  icon: typeof AlertTriangle;
  tint: string;
  iconCls: string;
}[] = [
  { key: "critical", label: "Critical", icon: AlertCircle, tint: "bg-negative/10", iconCls: "text-negative" },
  { key: "warning", label: "Warnings", icon: AlertTriangle, tint: "bg-warning/10", iconCls: "text-warning" },
  { key: "info", label: "Info", icon: Info, tint: "bg-info/10", iconCls: "text-info" },
  { key: "success", label: "Wins", icon: CheckCircle2, tint: "bg-positive/10", iconCls: "text-positive" },
];

const TYPE_ICON: Record<AlertType, typeof AlertTriangle> = {
  "rank-drop": TrendingDown,
  "traffic-drop": TrendingDown,
  "lost-backlink": Unlink,
  "broken-backlink": Unlink,
  "ai-underperform": Bot,
  opportunity: Sparkles,
};

export function AlertsFeed({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const { notify } = useAppFeedback();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<AlertSeverity, number> = { critical: 0, warning: 0, info: 0, success: 0 };
    for (const a of alerts) c[a.severity]++;
    return c;
  }, [alerts]);

  const visible = useMemo(
    () => (filter === "all" ? alerts : alerts.filter((a) => a.severity === filter)),
    [alerts, filter],
  );

  async function markRead(alert: Alert) {
    setAlerts((items) => items.map((item) => (item.id === alert.id ? { ...item, read: true } : item)));
    try {
      await api.markAlertRead(alert.id);
      notify({ kind: "success", title: "Alert marked read" });
    } catch (err) {
      setAlerts((items) => items.map((item) => (item.id === alert.id ? alert : item)));
      notify({ kind: "error", title: "Could not update alert", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function resolve(alert: Alert) {
    setAlerts((items) =>
      items.map((item) => (item.id === alert.id ? { ...item, read: true, resolved: true } : item)),
    );
    try {
      await api.resolveAlert(alert.id);
      notify({ kind: "success", title: "Alert resolved", message: alert.title });
    } catch (err) {
      setAlerts((items) => items.map((item) => (item.id === alert.id ? alert : item)));
      notify({ kind: "error", title: "Could not resolve alert", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  async function snooze(alert: Alert) {
    setAlerts((items) => items.map((item) => (item.id === alert.id ? { ...item, read: true } : item)));
    try {
      const { snoozedUntil } = await api.snoozeAlert(alert.id);
      setAlerts((items) => items.map((item) => (item.id === alert.id ? { ...item, read: true, snoozedUntil } : item)));
      notify({ kind: "success", title: "Alert snoozed", message: "Hidden for 7 days." });
    } catch (err) {
      setAlerts((items) => items.map((item) => (item.id === alert.id ? alert : item)));
      notify({ kind: "error", title: "Could not snooze alert", message: err instanceof Error ? err.message : "Try again." });
    }
  }

  return (
    <div className="space-y-5">
      {/* severity summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUMMARY.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter((f) => (f === s.key ? "all" : s.key))}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition-colors",
              filter === s.key ? "border-border-strong ring-1 ring-brand/30" : "border-border hover:border-border-strong",
            )}
          >
            <div className={cn("flex size-10 items-center justify-center rounded-xl", s.tint)}>
              <s.icon className={cn("size-5", s.iconCls)} strokeWidth={2} />
            </div>
            <div>
              <div className="tnum text-kpi font-semibold leading-none text-foreground">
                {counts[s.key]}
              </div>
              <div className="mt-1 text-label font-medium text-muted-foreground">{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const n = f.key === "all" ? alerts.length : counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-border",
              )}
            >
              {f.label}
              <span className={cn("tnum text-micro", filter === f.key ? "opacity-70" : "opacity-60")}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* feed */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {visible.map((a) => {
            const Icon = TYPE_ICON[a.type] ?? AlertTriangle;
            const dim = a.read || a.resolved;
            return (
              <article
                key={a.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-3.5 transition-all hover:border-border-strong hover:shadow-card",
                  dim && "bg-card/70 opacity-75",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-[18px] text-brand" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-label font-semibold text-foreground">{a.title}</p>
                      {a.metric && (
                        <Badge variant="muted" className="tnum">
                          {a.metric}
                        </Badge>
                      )}
                      {a.resolved && (
                        <Badge variant="positive">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-label leading-relaxed text-muted-foreground">
                      {a.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={a.recommendedAction.href}
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-brand px-3 text-label font-semibold text-brand-foreground transition-transform ease-expo hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {a.recommendedAction.label}
                        <ArrowRight className="size-3.5" />
                      </Link>
                      {!a.read && (
                        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => markRead(a)}>
                          Mark read
                        </Button>
                      )}
                      {!a.resolved && (
                        <Button variant="ghost" size="sm" className="h-9 rounded-full" onClick={() => resolve(a)}>
                          Resolve
                        </Button>
                      )}
                      {!a.resolved && !a.snoozedUntil && (
                        <Button variant="ghost" size="sm" className="h-9 rounded-full" onClick={() => snooze(a)}>
                          Snooze
                        </Button>
                      )}
                      <span className="ml-auto text-micro text-muted-foreground/70">
                        {relativeTime(a.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={`No ${filter} alerts`}
          description="You're all caught up here."
        />
      )}
    </div>
  );
}
