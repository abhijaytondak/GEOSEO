"use client";

import { useMemo, useState } from "react";
import { Sparkles, Plus, Highlighter, Check, X, Target } from "lucide-react";
import type { GeneratedPage } from "@geoseo/types";
import { pageEngineApi } from "@/lib/page-engine-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** All searchable text on a page (for keyword coverage). */
function pageText(p: GeneratedPage): string {
  return [
    p.metaTitle,
    p.metaDescription,
    p.heroCopy,
    ...(p.sections ?? []).flatMap((s) => [s.heading, s.body]),
    ...(p.faqs ?? []).flatMap((f) => [f.q, f.a]),
  ]
    .filter(Boolean)
    .join("  ");
}

function countOccurrences(haystack: string, term: string): number {
  const t = term.trim();
  if (t.length < 2) return 0;
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (haystack.match(re) ?? []).length;
}

interface Props {
  page: GeneratedPage;
  onRewritten: (p: GeneratedPage) => void;
  highlightOn: boolean;
  onToggleHighlight: () => void;
  notify: (n: { kind: "success" | "error" | "info"; title: string; message?: string }) => void;
}

/**
 * Keyword analysis + add-keywords→LLM-rewrite, the core of the page-review loop.
 * Shows per-keyword coverage in the live content, lets the user add targets, then
 * the LLM rewrites the page in place weaving them in (async job + poll).
 */
export function KeywordReview({ page, onRewritten, highlightOn, onToggleHighlight, notify }: Props) {
  const [draftKw, setDraftKw] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [rewriting, setRewriting] = useState(false);

  const text = useMemo(() => pageText(page), [page]);
  const targets = useMemo(() => page.targetKeywords ?? [], [page.targetKeywords]);
  const coverage = useMemo(
    () => targets.map((k) => ({ k, n: countOccurrences(text, k) })),
    [targets, text],
  );
  const covered = coverage.filter((c) => c.n > 0).length;
  const total = targets.length || 1;
  const score = Math.round((covered / total) * 100);

  function addPending() {
    const parts = draftKw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !targets.some((t) => t.toLowerCase() === s.toLowerCase()) && !pending.includes(s));
    if (parts.length) setPending((p) => [...p, ...parts]);
    setDraftKw("");
  }

  async function rewrite() {
    const add = pending;
    if (add.length === 0) {
      notify({ kind: "error", title: "Add at least one keyword to rewrite for" });
      return;
    }
    setRewriting(true);
    try {
      const job = await pageEngineApi.startRewrite(page.id, add);
      let res = await pageEngineApi.getRewriteJob(job.id);
      for (let i = 0; i < 80 && res.job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await pageEngineApi.getRewriteJob(job.id);
      }
      if (res.job.status === "failed" || !res.page) throw new Error(res.job.error ?? "Rewrite failed");
      onRewritten(res.page);
      setPending([]);
      notify({ kind: "success", title: "Page rewritten", message: `Re-drafted around ${add.length} new keyword${add.length === 1 ? "" : "s"}.` });
    } catch (err) {
      notify({ kind: "error", title: "Rewrite failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setRewriting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-sunken p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand"><Target className="size-4" /></span>
          <div>
            <div className="text-label font-semibold text-foreground">Keyword coverage</div>
            <div className="text-micro text-muted-foreground">{covered} of {targets.length} target keywords appear in the page</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleHighlight}
          aria-pressed={highlightOn}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            highlightOn ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Highlighter className="size-3.5" /> Highlight
        </button>
      </div>

      {/* coverage bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-positive" : score >= 50 ? "bg-brand" : "bg-warning")} style={{ width: `${score}%` }} />
      </div>

      {/* target keyword chips with coverage */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {coverage.map(({ k, n }) => (
          <span
            key={k}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label",
              n > 0 ? "border-positive/30 bg-positive/8 text-foreground" : "border-warning/40 bg-warning/8 text-foreground",
            )}
            title={n > 0 ? `appears ${n}×` : "not found in the content yet"}
          >
            {n > 0 ? <Check className="size-3 text-positive" /> : <X className="size-3 text-warning" />}
            {k}
            <span className="tnum font-mono text-micro text-muted-foreground">{n}×</span>
          </span>
        ))}
        {pending.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-label text-brand">
            <Plus className="size-3" />
            {k}
            <button onClick={() => setPending((p) => p.filter((x) => x !== k))} aria-label={`Remove ${k}`} className="hover:text-foreground"><X className="size-3" /></button>
          </span>
        ))}
      </div>

      {/* add keywords + rewrite */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 transition-colors focus-within:border-brand">
          <Sparkles className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={draftKw}
            onChange={(e) => setDraftKw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addPending();
              }
            }}
            placeholder="Add target keywords (Enter to add)…"
            className="h-10 w-full border-0 bg-transparent text-body text-foreground outline-none"
          />
          {draftKw.trim() && (
            <button onClick={addPending} className="shrink-0 text-label font-medium text-brand hover:underline">Add</button>
          )}
        </div>
        <Button
          variant="brand"
          onClick={rewrite}
          disabled={pending.length === 0}
          loading={rewriting}
          className="h-10 shrink-0 rounded-xl px-4 text-body font-semibold"
        >
          {!rewriting && <Sparkles className="size-4" />}
          {rewriting ? "Rewriting…" : "Rewrite with keywords"}
        </Button>
      </div>
      {rewriting && (
        <p className="mt-2 text-label text-muted-foreground">The AI is re-drafting the page around your keywords — this takes a moment.</p>
      )}
    </section>
  );
}
