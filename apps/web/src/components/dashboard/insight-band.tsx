"use client";

import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

export type InsightStatus = "improving" | "stable" | "needs-attention" | "critical";

const STYLE: Record<InsightStatus, { label: string; cls: string; Icon: typeof TrendingUp }> = {
  improving: { label: "Improving", cls: "bg-positive/12 text-positive", Icon: TrendingUp },
  stable: { label: "Stable", cls: "bg-info/12 text-info", Icon: Minus },
  "needs-attention": { label: "Needs attention", cls: "bg-warning/15 text-warning", Icon: AlertTriangle },
  critical: { label: "Critical", cls: "bg-negative/12 text-negative", Icon: TrendingDown },
};

/**
 * Insight Summary Band (Authority HQ PRD §7): a human-readable interpretation of
 * the dashboard — status badge, the one-sentence "what changed + what to do",
 * a data-freshness/source hint, and a shortcut into the background-jobs drawer.
 */
export function InsightBand({
  status,
  headline,
}: {
  status: InsightStatus;
  headline: string;
  /** Accepted for backward-compat; no longer rendered (data-source labels removed). */
  source?: string;
}) {
  const { openJobs } = useAppFeedback();
  const s = STYLE[status];
  const Icon = s.Icon;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:gap-4">
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
          s.cls,
        )}
      >
        <Icon className="size-3.5" />
        {s.label}
      </span>
      <p className="flex-1 text-[13.5px] leading-relaxed text-foreground">{headline}</p>
      <button
        onClick={openJobs}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand transition-colors hover:underline sm:shrink-0"
      >
        <Activity className="size-3.5" />
        Jobs
      </button>
    </div>
  );
}
