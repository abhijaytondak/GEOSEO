"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { BrandAnalysis, BrandScorecardItem, CompetitorSource } from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { api } from "@/lib/api-client";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

const GRADE_TONE: Record<string, string> = {
  A: "text-positive",
  B: "text-brand",
  C: "text-warning",
  D: "text-negative",
};

const STATUS_META: Record<BrandAnalysis["scorecard"]["status"], { label: string; cls: string }> = {
  strong: { label: "Strong", cls: "bg-positive/12 text-positive" },
  mixed: { label: "Mixed", cls: "bg-warning/12 text-warning" },
  "needs-attention": { label: "Needs attention", cls: "bg-negative/12 text-negative" },
};

/** Real-vs-estimated label from the SERP tier that produced the competitor data. */
function sourceBadge(source: CompetitorSource): { label: string; live: boolean } {
  if (source === "brave") return { label: "Live · Brave Search", live: true };
  if (source === "duckduckgo") return { label: "Live · DuckDuckGo", live: true };
  return { label: "Estimated", live: false };
}

/**
 * Auto-generated brand scorecard on Authority HQ: what's strong / weak / to do next,
 * derived from the conversion audit + competitor visibility + Brand Memory. Self-fetching
 * so the server dashboard stays a single round-trip; re-runnable on demand.
 */
export function BrandScorecard() {
  const { notify } = useAppFeedback();
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getBrandAnalysis()
      .then((res) => !cancelled && setAnalysis(res))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setRunning(true);
    try {
      const res = await api.runBrandAnalysis();
      setAnalysis(res);
      notify({ kind: "success", title: "Analysis complete", message: `Brand scorecard refreshed for ${res.domain}.` });
    } catch (err) {
      notify({ kind: "error", title: "Analysis failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <Panel title="Brand Scorecard" description="What's strong, what's weak, what to do next">
        <div className="flex items-center gap-2 py-2 text-[13px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your brand analysis…
        </div>
      </Panel>
    );
  }

  // No analysis yet (status pending) → prompt to run the first one.
  if (!analysis || analysis.status === "pending") {
    return (
      <Panel title="Brand Scorecard" description="What's strong, what's weak, what to do next">
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-[13px] text-muted-foreground">
            Run an analysis of your domain to see a brand-specific scorecard and competitor gaps.
          </p>
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {running ? "Analyzing…" : "Run your first analysis"}
          </button>
        </div>
      </Panel>
    );
  }

  const { scorecard, competitor } = analysis;
  const tone = GRADE_TONE[scorecard.grade] ?? "text-foreground";
  const status = STATUS_META[scorecard.status];
  const badge = sourceBadge(competitor.source);

  return (
    <Panel
      title="Brand Scorecard"
      description={`${analysis.domain} · auto-analyzed`}
      action={
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              badge.live ? "bg-positive/10 text-positive" : "bg-muted text-muted-foreground",
            )}
            title={badge.live ? "Real SERP data" : "Estimated — add a Brave key or competitors for live data"}
          >
            <span className={cn("size-1.5 rounded-full", badge.live ? "bg-positive" : "bg-muted-foreground")} />
            {badge.label}
          </span>
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={cn("size-3.5", running && "animate-spin")} />
            {running ? "Re-running…" : "Re-run"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        {/* score */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-1.5 sm:border-r sm:border-border sm:pr-6">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-bold tabular-nums leading-none", tone)}>{scorecard.score}</span>
            <span className="text-[12px] text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[13px] font-bold", tone)}>Grade {scorecard.grade}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", status.cls)}>{status.label}</span>
          </div>
        </div>

        {/* three columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Column
            icon={<CheckCircle2 className="size-4 text-positive" />}
            heading="What's strong"
            items={scorecard.strengths}
            empty="No clear strengths surfaced yet."
            accent="text-positive"
          />
          <Column
            icon={<AlertTriangle className="size-4 text-warning" />}
            heading="What's weak"
            items={scorecard.weaknesses}
            empty="No major weaknesses found."
            accent="text-warning"
          />
          <Column
            icon={<Target className="size-4 text-brand" />}
            heading="Top actions"
            items={scorecard.actions}
            empty="You're all caught up."
            accent="text-brand"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[12px] text-muted-foreground">
          {competitor.competitors.length} competitors · {competitor.gaps.length} keyword gaps
        </span>
        <Link
          href="/competitors"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
        >
          View competitors
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}

function Column({
  icon,
  heading,
  items,
  empty,
  accent,
}: {
  icon: React.ReactNode;
  heading: string;
  items: BrandScorecardItem[];
  empty: string;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {icon}
        <h3 className={cn("text-[12.5px] font-semibold", accent)}>{heading}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="text-[12.5px] leading-snug">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
