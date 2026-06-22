"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  RefreshCw,
  Link2,
  Loader2,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import type { KeywordOpportunity } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { api } from "@/lib/api-client";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { useAppFeedback } from "@/components/system/app-feedback";

/** How many pages a single "Initiate" run drafts in the background (bounded). */
const MAX_GENERATE = 6;

/**
 * Growth Plan — the dashboard's one-click action hub
 * (docs/PRD-workflow-navigation-optimization.md §6.1 "Next Best Actions").
 * Turns the completed analysis (opportunities, refresh recs, backlink prospects)
 * into a holistic, review-and-execute plan: e.g. "12 pages to create" → Initiate
 * → GEOSEO drafts them in the background, then they appear in Pipeline to review.
 * Self-fetching so it drops onto Home without changing its server load.
 */
export function GrowthPlan() {
  const { notify, confirm } = useAppFeedback();
  const [opps, setOpps] = useState<KeywordOpportunity[] | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [prospectCount, setProspectCount] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createdTotal, setCreatedTotal] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      const [o, pages, recs, prospects] = await Promise.all([
        pageEngineApi.getOpportunities().catch(() => [] as KeywordOpportunity[]),
        pageEngineApi.getPages().catch(() => []),
        pageEngineApi.getRefreshRecommendations().catch(() => []),
        api.getProspects().catch(() => []),
      ]);
      if (!live) return;
      setOpps(o);
      setPublishedCount(pages.filter((p) => p.status === "published").length);
      setRefreshCount(recs.length);
      setProspectCount(prospects.length);
    })();
    return () => {
      live = false;
    };
  }, []);

  const toCreate = (opps ?? []).filter((o) => o.status === "new" && !o.duplicate);
  const batchSize = Math.min(toCreate.length, MAX_GENERATE);
  const ready = opps !== null;

  async function initiate() {
    const batch = toCreate.slice(0, MAX_GENERATE);
    if (!batch.length) return;
    const ok = await confirm({
      title: `Initiate ${batch.length} page${batch.length > 1 ? "s" : ""}?`,
      message: `GEOSEO will draft ${batch.length} buyer-intent page${batch.length > 1 ? "s" : ""} from your top opportunities in the background. Review and publish them in Pipeline when ready.`,
      confirmLabel: "Initiate",
    });
    if (!ok) return;

    setProgress({ done: 0, total: batch.length });
    // Drop the drafted opportunities from the local plan up front so the count reflects intent.
    setOpps((prev) => (prev ? prev.filter((o) => !batch.some((b) => b.id === o.id)) : prev));
    try {
      // Server drafts the batch in the background; we just poll its progress.
      const job = await pageEngineApi.generatePagesBatch(batch.map((b) => b.id));
      notify({
        kind: "info",
        title: `Drafting ${job.total} page${job.total > 1 ? "s" : ""} in the background`,
        message: "You can keep working — they'll appear in Pipeline as they're ready.",
      });
      let latest = job;
      // Poll progress, capped (~5 min) so a stuck server can't hang the loop forever.
      for (let polls = 0; latest.status === "running" && polls < 200; polls++) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          latest = await pageEngineApi.getBatchProgress(job.id);
        } catch {
          break; // lost the handle (e.g. API restart) — drafts still persist server-side
        }
        setProgress({ done: latest.done, total: latest.total });
      }
      setProgress(null);
      setCreatedTotal((n) => n + latest.created);
      notify(
        latest.created
          ? { kind: "success", title: `${latest.created} page${latest.created > 1 ? "s" : ""} drafted`, message: "Review and publish them in Pipeline." }
          : { kind: "error", title: "Couldn't draft pages", message: "Try again, or generate from the Pipeline." },
      );
    } catch {
      setProgress(null);
      // Restore the plan since nothing was queued.
      setOpps((prev) => (prev ? [...batch, ...prev] : prev));
      notify({ kind: "error", title: "Couldn't start generation", message: "The API is unreachable. Try again, or generate from the Pipeline." });
    }
  }

  const running = progress !== null;

  return (
    <Panel
      title="Your Growth Plan"
      description="What the analysis recommends next — review and execute in one click."
    >
      {!ready ? (
        <div className="flex items-center gap-2 py-8 text-label text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Building your plan from the latest analysis…
        </div>
      ) : (
        <div className="space-y-3">
          {/* holistic one-line summary */}
          <p className="text-label leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{toCreate.length}</span> buyer-intent pages to create
            {" · "}
            <span className="font-semibold text-foreground">{refreshCount}</span> to refresh
            {" · "}
            <span className="font-semibold text-foreground">{prospectCount}</span> backlink opportunities
            {" · "}
            <span className="font-semibold text-foreground">{publishedCount}</span> live
            {createdTotal > 0 && (
              <span className="text-positive"> · {createdTotal} drafted this session</span>
            )}
          </p>

          {/* Action 1 — create pages (one-click background generation) */}
          <PlanRow
            icon={FileText}
            title={`Create ${toCreate.length} buyer-intent page${toCreate.length === 1 ? "" : "s"}`}
            detail={
              toCreate[0]?.query
                ? `Top: “${toCreate[0].query}”${toCreate.length > 1 ? ` + ${toCreate.length - 1} more` : ""}`
                : "Discover opportunities in Pipeline to populate this."
            }
          >
            {toCreate.length > 0 ? (
              <Button
                variant="brand"
                size="sm"
                onClick={initiate}
                loading={running}
                className="shrink-0"
              >
                {running ? (
                  <>Drafting {progress!.done}/{progress!.total}…</>
                ) : (
                  <>
                    <Wand2 className="size-3.5" aria-hidden="true" />
                    Initiate {batchSize}
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/pipeline?stage=discover" />}
                className="shrink-0"
              >
                Discover <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </PlanRow>

          {/* Action 2 — refresh slipping pages */}
          <PlanRow
            icon={RefreshCw}
            title={`Refresh ${refreshCount} page${refreshCount === 1 ? "" : "s"}`}
            detail="Pages losing rank — update them to protect traffic and leads."
          >
            <Link
              href="/pipeline?stage=refresh"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border px-3.5 py-2 text-[13px] font-semibold text-foreground hover:bg-muted"
            >
              Review <ArrowRight className="size-3.5" />
            </Link>
          </PlanRow>

          {/* Action 3 — pursue backlinks */}
          <PlanRow
            icon={Link2}
            title={`Pursue ${prospectCount} backlink opportunit${prospectCount === 1 ? "y" : "ies"}`}
            detail="High-authority, on-topic prospects ready for outreach."
          >
            <Link
              href="/authority?view=opportunities"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border px-3.5 py-2 text-[13px] font-semibold text-foreground hover:bg-muted"
            >
              Open <ArrowRight className="size-3.5" />
            </Link>
          </PlanRow>

          {createdTotal > 0 && (
            <Link
              href="/pipeline?stage=review"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand hover:underline"
            >
              <CheckCircle2 className="size-3.5" />
              Review the {createdTotal} drafted page{createdTotal > 1 ? "s" : ""} in Pipeline
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}

function PlanRow({
  icon: Icon,
  title,
  detail,
  children,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-sunken p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-foreground">{title}</div>
        <div className="truncate text-[12px] text-muted-foreground">{detail}</div>
      </div>
      {children}
    </div>
  );
}
