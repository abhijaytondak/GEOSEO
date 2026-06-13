import Link from "next/link";
import {
  TrendingDown,
  Sparkles,
  Unlink,
  AlertTriangle,
  Bot,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { Alert, AlertSeverity, AlertType } from "@geoseo/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<AlertType, LucideIcon> = {
  "rank-drop": TrendingDown,
  "traffic-drop": TrendingDown,
  "lost-backlink": Unlink,
  "broken-backlink": Unlink,
  "ai-underperform": Bot,
  opportunity: Sparkles,
};

const SEVERITY: Record<AlertSeverity, { ring: string; icon: string; chip: string }> = {
  critical: { ring: "bg-negative/10", icon: "text-negative", chip: "bg-negative/12 text-negative" },
  warning: { ring: "bg-warning/10", icon: "text-warning", chip: "bg-warning/15 text-warning" },
  info: { ring: "bg-info/10", icon: "text-info", chip: "bg-info/12 text-info" },
  success: { ring: "bg-positive/10", icon: "text-positive", chip: "bg-positive/12 text-positive" },
};

export function AlertCard({ alert }: { alert: Alert }) {
  const Icon = TYPE_ICON[alert.type] ?? AlertTriangle;
  const s = SEVERITY[alert.severity];

  return (
    <Link
      href={alert.recommendedAction.href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:border-border-strong hover:shadow-card"
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.ring)}>
        <Icon className={cn("size-[18px]", s.icon)} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-foreground">
            {alert.title}
          </p>
          {alert.metric && (
            <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums", s.chip)}>
              {alert.metric}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {alert.description}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
            {alert.recommendedAction.label}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            · {relativeTime(alert.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <AlertCard key={a.id} alert={a} />
      ))}
    </div>
  );
}
