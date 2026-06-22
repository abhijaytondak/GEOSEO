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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

const GRADE_TONE: Record<string, string> = {
  A: "text-positive",
  B: "text-brand",
  C: "text-warning",
  D: "text-negative",
};

const STATUS_META: Record<
  BrandAnalysis["scorecard"]["status"],
  { label: string; variant: "positive" | "warning" | "negative" }
> = {
  strong: { label: "Strong", variant: "positive" },
  mixed: { label: "Mixed", variant: "warning" },
  "needs-attention": { label: "Needs attention", variant: "negative" },
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
        <div className="flex items-center gap-2 py-2 text-label text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your brand analysis…
        </div>
      </Panel>
    );
  }

  // No analysis yet (status pending) → prompt to run the first one.
  if (!analysis || analysis.status === "pending") {
    return (
      <Panel title="Brand Scorecard" description="What's strong, what's weak, what to do next">
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-label text-muted-foreground">
            Run an analysis of your domain to see a brand-specific scorecard and competitor gaps.
          </p>
          <Button variant="brand" size="sm" onClick={run} loading={running}>
            {!running && <Sparkles className="size-3.5" aria-hidden="true" />}
            {running ? "Analyzing…" : "Run your first analysis"}
          </Button>
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
          <Badge
            variant={badge.live ? "positive" : "muted"}
            title={badge.live ? "Real SERP data" : "Estimated — add a Brave key or competitors for live data"}
          >
            <span className={cn("size-1.5 rounded-full", badge.live ? "bg-positive" : "bg-muted-foreground")} />
            {badge.label}
          </Badge>
          <Button variant="outline" size="xs" onClick={run} disabled={running}>
            <RefreshCw className={cn("size-3", running && "animate-spin")} aria-hidden="true" />
            {running ? "Re-running…" : "Re-run"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        {/* score */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-1.5 sm:border-r sm:border-border sm:pr-6">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-kpi font-bold tabular-nums leading-none", tone)}>{scorecard.score}</span>
            <span className="text-label text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-label font-bold", tone)}>Grade {scorecard.grade}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
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
        <span className="text-label text-muted-foreground">
          {competitor.competitors.length} competitors · {competitor.gaps.length} keyword gaps
        </span>
        <Link
          href="/competitors"
          className="inline-flex items-center gap-1 rounded-md text-label font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          View competitors
          <ArrowRight className="size-3.5" aria-hidden="true" />
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
        <h3 className={cn("text-label font-semibold", accent)}>{heading}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-label text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="text-label leading-snug">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-micro text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
