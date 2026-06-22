"use client";

import { useState } from "react";
import { Sparkles, Search, Loader2, Check, FileText, Bot } from "lucide-react";
import type { GeneratedPage, KeywordOpportunity, SearchIntent } from "@geoseo/types";
import { draftWithPuter } from "@/lib/puter-ai";
import { pageEngineApi } from "@/lib/page-engine-client";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

/** Self-contained BFF call (mirrors the pattern in opportunities-explorer / competitor view —
 *  keeps the static server route untouched and avoids threading the shared client). */
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("network", 0); // backend unreachable (offline / no host)
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.errors?.[0]?.message ?? json?.errors?.[0] ?? `Request failed (${res.status})`, res.status);
  return (json?.data ?? json) as T;
}

type DiscoverJob = { id: string; status: "running" | "completed" | "failed"; created: number; error?: string };

export type ComposerType = "auto" | "guide" | "comparison" | "landing";

/** Composer page-type → the discover intent that yields that page type server-side. */
const TYPE_OPTIONS: { value: ComposerType; label: string; intent?: SearchIntent }[] = [
  { value: "auto", label: "Auto", intent: undefined },
  { value: "guide", label: "Guide", intent: "informational" },
  { value: "comparison", label: "Comparison", intent: "comparison" },
  { value: "landing", label: "Landing", intent: "commercial" },
];

type Step = "idle" | "research" | "draft" | "optimize" | "done";
const STEPS: { key: Exclude<Step, "idle">; label: string; icon: typeof Search }[] = [
  { key: "research", label: "Researching intent", icon: Search },
  { key: "draft", label: "Drafting sections", icon: FileText },
  { key: "optimize", label: "Optimizing for AI search", icon: Bot },
];
const ORDER: Step[] = ["research", "draft", "optimize", "done"];

interface Props {
  topic: string;
  onTopicChange: (v: string) => void;
  pageType: ComposerType;
  onTypeChange: (v: ComposerType) => void;
  /** Opp ids that exist before this generation — used to find the freshly-created one. */
  existingOppIds: string[];
  onGenerated: (page: GeneratedPage) => void;
  /** Surface newly-discovered opportunities so the parent can refresh its backlog. */
  onNewOpps?: (opps: KeywordOpportunity[]) => void;
}

/**
 * "Create a page" composer — type a topic, pick a type, generate. Pipelines
 * discover → draft → save behind a 3-step progress display so the ~LLM wait
 * feels intentional rather than broken.
 */
export function PageComposer({ topic, onTopicChange, pageType, onTypeChange, existingOppIds, onGenerated, onNewOpps }: Props) {
  const { notify } = useAppFeedback();
  const [step, setStep] = useState<Step>("idle");
  const busy = step !== "idle" && step !== "done";

  function norm(s: string) {
    return s.toLowerCase().trim();
  }

  async function generate() {
    const t = topic.trim();
    if (!t || busy) return;
    const intent = TYPE_OPTIONS.find((o) => o.value === pageType)?.intent;
    try {
      // 1) Research — discover buyer-intent keywords for the topic. LLM-backed → exceeds
      //    the BFF budget, so run it as a polled job (same pattern as the explorer).
      setStep("research");
      let job = await apiJson<DiscoverJob>("POST", "/api/v1/opportunities/discover-async", { seeds: [t], intent });
      for (let i = 0; i < 40 && job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        job = await apiJson<DiscoverJob>("GET", `/api/v1/opportunities/discover-async/${job.id}`);
      }
      if (job.status === "failed") throw new Error(job.error ?? "Could not research this topic.");

      const { opportunities } = await apiJson<{ opportunities: KeywordOpportunity[] }>("GET", "/api/v1/opportunities");
      const seen = new Set(existingOppIds);
      const fresh = opportunities.filter((o) => !seen.has(o.id));
      if (onNewOpps && fresh.length) onNewOpps(fresh);
      // Prefer the opp that matches the typed topic; else the first fresh one; else any match.
      const pick =
        fresh.find((o) => norm(o.query) === norm(t)) ??
        fresh.find((o) => norm(o.query).includes(norm(t)) || norm(t).includes(norm(o.query))) ??
        fresh[0] ??
        opportunities.find((o) => norm(o.query) === norm(t));
      if (!pick) throw new Error("Couldn't turn that topic into a keyword — try rephrasing it.");

      // 2) Draft — in-browser with Puter (user-pays); null → the server drafts on save.
      setStep("draft");
      const content = await draftWithPuter(pick.query, pick.recommendedPageType);

      // 3) Optimize + persist — assemble the page (per-type structure, schema, brand hero).
      setStep("optimize");
      let page;
      if (content) {
        // Puter drafted in-browser → server skips the LLM, so the sync call is fast.
        page = await pageEngineApi.generatePage(pick.id, content);
      } else {
        // No browser draft → server drafts via the LLM (~30-80s on a slow/host-limited
        // backend). Run it as a background job + poll so it isn't cut by the sync request
        // budget (e.g. Render's ~30s inbound limit).
        const job = await pageEngineApi.generatePagesBatch([pick.id]);
        let prog = job;
        for (let i = 0; i < 80 && prog.status === "running"; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          prog = await pageEngineApi.getBatchProgress(job.id);
        }
        const newId = prog.pageIds?.[prog.pageIds.length - 1];
        if (!newId) throw new Error("Generation didn't finish — try again in a moment.");
        const pages = await pageEngineApi.getPages();
        page = pages.find((p) => p.id === newId);
        if (!page) throw new Error("Generated page not found — check Pipeline.");
      }

      setStep("done");
      onGenerated(page);
      onTopicChange("");
      notify({
        kind: "success",
        title: content ? "AI page generated" : "Page generated",
        message: `"${pick.query}" → a new ${page.pageType} draft is ready to review.`,
      });
      setTimeout(() => setStep("idle"), 1200);
    } catch (err) {
      setStep("idle");
      const status = err instanceof ApiError ? err.status : undefined;
      // 0 = unreachable, 502/503 = the BFF couldn't reach the API (e.g. the hosted demo
      // has no backend). Explain instead of showing a raw error.
      const backendDown = status === 0 || status === 502 || status === 503;
      if (backendDown) {
        notify({
          kind: "info",
          title: "Backend not connected",
          message: "Live AI generation needs the connected API, which isn't reachable here. It works in the full app (local or a hosted backend).",
        });
      } else {
        notify({ kind: "error", title: "Generation failed", message: err instanceof Error ? err.message : "Try again." });
      }
    }
  }

  const activeIdx = ORDER.indexOf(step);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* signature aurora wash behind the composer header */}
      <div className="relative bg-gradient-to-br from-brand/10 via-card to-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <Sparkles className="size-4" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Create a page</h2>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Describe what this page should rank for. We&apos;ll research the intent, draft it from your Brand Memory, and structure it for AI search.
        </p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              disabled={busy}
              placeholder="e.g. best CRM for early-stage startups"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13.5px] text-foreground shadow-sm outline-none transition-colors focus:border-brand disabled:opacity-60"
            />
          </div>
          <button
            onClick={generate}
            disabled={busy || !topic.trim()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13.5px] font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Generating…" : "Generate page"}
          </button>
        </div>

        {/* page-type selector */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11.5px] font-medium text-muted-foreground">Type</span>
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onTypeChange(o.value)}
              disabled={busy}
              aria-pressed={pageType === o.value}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors disabled:opacity-60",
                pageType === o.value
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* generation stepper — appears while a page is being built */}
      {step !== "idle" && (
        <div className="border-t border-border bg-surface-sunken px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {STEPS.map((s, i) => {
              const idx = ORDER.indexOf(s.key);
              const state = idx < activeIdx ? "done" : idx === activeIdx ? "active" : "pending";
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        state === "done" && "border-positive/40 bg-positive/15 text-positive",
                        state === "active" && "border-brand/40 bg-brand/15 text-brand",
                        state === "pending" && "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="size-3.5" />
                      ) : state === "active" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Icon className="size-3.5" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "truncate text-[12px] font-medium",
                        state === "pending" ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className={cn("hidden h-px flex-1 sm:block", idx < activeIdx ? "bg-positive/40" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
