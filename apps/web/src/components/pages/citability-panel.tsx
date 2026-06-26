"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, X, Sparkles } from "lucide-react";
import { pageEngineApi, type CitabilityReport } from "@/lib/page-engine-client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Grade = CitabilityReport["grade"];
type Status = CitabilityReport["findings"][number]["status"];

/** Grade → semantic tone (matches conversion-audit / scorecard convention). */
const GRADE_TONE: Record<Grade, { badge: "positive" | "info" | "warning" | "negative"; ring: string; text: string }> = {
  A: { badge: "positive", ring: "var(--positive)", text: "text-positive" },
  B: { badge: "info", ring: "var(--info)", text: "text-info" },
  C: { badge: "warning", ring: "var(--warning)", text: "text-warning" },
  D: { badge: "negative", ring: "var(--negative)", text: "text-negative" },
  F: { badge: "negative", ring: "var(--negative)", text: "text-negative" },
};

const STATUS_META: Record<Status, { Icon: typeof Check; cls: string; variant: "positive" | "warning" | "negative" }> = {
  pass: { Icon: Check, cls: "text-positive", variant: "positive" },
  warn: { Icon: AlertTriangle, cls: "text-warning", variant: "warning" },
  fail: { Icon: X, cls: "text-negative", variant: "negative" },
};

/** Self-contained 270° radial score ring (unique gradient id, grade-toned, reduced-motion safe). */
function ScoreRing({ score, grade, size = 132 }: { score: number; grade: Grade; size?: number }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc = 0.75; // 270°
  const track = circ * arc;
  const fill = track * (Math.max(0, Math.min(100, score)) / 100);
  const tone = GRADE_TONE[grade];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[135deg]" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${track} ${circ}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-[1100ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("tnum text-kpi font-semibold leading-none", tone.text)}>{score}</span>
        <span className="mt-1 text-micro font-semibold uppercase tracking-wide text-muted-foreground">AEO · {grade}</span>
      </div>
    </div>
  );
}

export function CitabilityPanel({ pageId, updatedAt }: { pageId: string; updatedAt?: string }) {
  const [report, setReport] = useState<CitabilityReport | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let live = true;
    setState("loading");
    pageEngineApi
      .getCitability(pageId)
      .then((r) => {
        if (!live) return;
        setReport(r);
        setState("ready");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [pageId, updatedAt]);

  return (
    <section aria-labelledby="citability-heading">
      <div className="flex items-center gap-2">
        <h3 id="citability-heading" className="text-micro font-semibold uppercase text-muted-foreground">
          Citability · AEO
        </h3>
        <Sparkles className="size-3 text-brand" aria-hidden="true" />
      </div>
      <p className="mt-1 text-label text-muted-foreground">
        How readily AI answer engines (ChatGPT, Perplexity, AI Overviews) can extract and cite this page.
      </p>

      <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        {state === "loading" && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="size-[132px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7 w-full rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <ErrorState
            title="Couldn't score citability"
            description="The AEO analysis couldn't be loaded for this page."
            onRetry={() => {
              setState("loading");
              pageEngineApi
                .getCitability(pageId)
                .then((r) => {
                  setReport(r);
                  setState("ready");
                })
                .catch(() => setState("error"));
            }}
          />
        )}

        {state === "ready" && report && report.passages === 0 && (
          <EmptyState
            icon={Sparkles}
            tone="prompt"
            title="Not enough content to score yet"
            description="Add substantive section and FAQ copy (aim for answer-first passages of 130–170 words) to measure how citable this page is."
          />
        )}

        {state === "ready" && report && report.passages > 0 && (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-2 sm:w-[148px]">
              <ScoreRing score={report.score} grade={report.grade} />
              <Badge variant={GRADE_TONE[report.grade].badge} className="gap-1">
                <span className={cn("size-1.5 rounded-full", GRADE_TONE[report.grade].text.replace("text-", "bg-"))} />
                Grade {report.grade}
              </Badge>
              <span className="text-micro text-muted-foreground">
                {report.passages} passage{report.passages === 1 ? "" : "s"} scored
              </span>
            </div>

            <ul className="min-w-0 flex-1 space-y-1.5">
              {report.findings.map((f) => {
                const m = STATUS_META[f.status];
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl p-2.5",
                      f.status === "pass" ? "" : "bg-surface-sunken",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface-sunken",
                        m.cls,
                      )}
                    >
                      <m.Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-label font-medium text-foreground">{f.label}</span>
                        <span className="tnum shrink-0 text-micro text-muted-foreground">{f.detail}</span>
                      </div>
                      {f.status !== "pass" && (
                        <p className="mt-0.5 text-label text-muted-foreground">
                          <span className="font-medium text-brand">Fix:</span> {f.recommendation}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
