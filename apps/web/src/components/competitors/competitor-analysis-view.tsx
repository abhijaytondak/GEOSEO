"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Sparkles, Swords, ArrowUpRight, Info, Search, ShieldAlert, Check } from "lucide-react";
import type { CompetitorAnalysis, CompetitorSource, CompetitorPageAnalysis } from "@geoseo/types";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { puterReady, discoverCompetitorsWithPuter, type PuterCompetitor } from "@/lib/puter-ai";
import { useAppFeedback } from "@/components/system/app-feedback";
import { cn } from "@/lib/utils";

/** Build a CompetitorAnalysis from AI-discovered competitors (browser Puter path).
 *  Visibility is an estimate (ranked by discovery order); domains are real. */
function buildFromPuter(domain: string, comps: PuterCompetitor[], keywords: string[]): CompetitorAnalysis {
  const kw = keywords.slice(0, 6);
  const competitors = comps.slice(0, 8).map((c, i) => ({
    domain: c.domain,
    appearances: Math.max(1, Math.min(kw.length || 3, 5 - Math.floor(i / 2))),
    avgPosition: Math.min(10, i + 1),
    overlapKeywords: kw.slice(0, 3),
    visibilityScore: Math.max(20, 92 - i * 9),
  }));
  return {
    domain,
    keywords: kw,
    competitors,
    gaps: [],
    yourVisibility: 0,
    source: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}

function sourceBadge(source: CompetitorSource): { label: string; live: boolean; hint: string } {
  if (source === "brave") return { label: "Live · Brave Search", live: true, hint: "Real organic SERP data from the Brave Search API." };
  if (source === "duckduckgo") return { label: "Live · DuckDuckGo", live: true, hint: "Real organic SERP data from DuckDuckGo (keyless)." };
  return {
    label: "Estimated",
    live: false,
    hint: "Estimated from your declared competitors. Add a free BRAVE_SEARCH_API_KEY for live SERP data.",
  };
}

type BadgeVariant = "brand" | "positive" | "negative" | "warning" | "info" | "muted";
const INTENT_VARIANT: Record<string, BadgeVariant> = {
  transactional: "positive",
  commercial: "brand",
  comparison: "warning",
  informational: "muted",
  local: "muted",
  navigational: "muted",
};

type PageJob = { id: string; status: "running" | "completed" | "failed"; result?: CompetitorPageAnalysis; error?: string };

/** Self-contained call through the Next BFF (avoids the shared api-client). */
async function apiJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.errors?.[0] ?? `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

/** Competitor intelligence workspace — self-fetching (the server route stays static). */
export function CompetitorAnalysisView() {
  const { notify } = useAppFeedback();
  const [data, setData] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [pageResult, setPageResult] = useState<CompetitorPageAnalysis | null>(null);

  async function analyzePage() {
    const url = pageUrl.trim();
    if (!url) return;
    setAnalyzing(true);
    setPageResult(null);
    try {
      // LLM-backed crawl (~25s) exceeds the BFF budget → start a job and poll.
      let job = await apiJson<PageJob>("POST", "/api/v1/brand-analysis/competitor-page-async", { url });
      for (let i = 0; i < 40 && job.status === "running"; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        job = await apiJson<PageJob>("GET", `/api/v1/brand-analysis/competitor-page-async/${job.id}`);
      }
      if (job.status === "failed") throw new Error(job.error ?? "Analysis failed");
      if (job.status === "running" || !job.result) throw new Error("Analysis is still running — try again in a moment.");
      setPageResult(job.result);
      if (!job.result.crawled) notify({ kind: "info", title: "Could not crawl", message: job.result.summary });
    } catch (err) {
      notify({ kind: "error", title: "Analysis failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let res: CompetitorAnalysis | null = null;
      try {
        res = await api.getCompetitorAnalysis();
      } catch {
        /* fall through to browser AI */
      }
      // Brave SERP is the only trustworthy server tier; for empty results or the
      // noisy keyless DuckDuckGo/heuristic tiers, discover dynamically via browser
      // AI (Puter) — works for any company, no server key needed.
      if ((!res || res.competitors.length === 0 || res.source !== "brave") && puterReady()) {
        try {
          const brand = await api.getBrandProfile();
          const comps = await discoverCompetitorsWithPuter({
            company: brand.company,
            industry: brand.industry,
            valueProp: brand.valueProp,
            domain: brand.domain,
          });
          if (comps.length && !cancelled) {
            setData(
              buildFromPuter(
                brand.domain || res?.domain || "",
                comps,
                (brand.keywords?.length ? brand.keywords : res?.keywords) ?? [],
              ),
            );
            return;
          }
        } catch {
          /* keep the server result */
        }
      }
      if (!cancelled) setData(res);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setRunning(true);
    try {
      // Prefer dynamic browser-AI discovery (works for any company, no key).
      if (puterReady()) {
        const brand = await api.getBrandProfile();
        const comps = await discoverCompetitorsWithPuter({
          company: brand.company,
          industry: brand.industry,
          valueProp: brand.valueProp,
          domain: brand.domain,
        });
        if (comps.length) {
          setData(buildFromPuter(brand.domain || "", comps, brand.keywords ?? []));
          notify({ kind: "success", title: "Competitors found", message: `Discovered ${comps.length} competitors for ${brand.company}.` });
          return;
        }
      }
      const res = await api.runBrandAnalysis();
      setData(res.competitor);
      notify({ kind: "success", title: "Refreshed", message: `Competitor analysis updated for ${res.domain}.` });
    } catch (err) {
      notify({ kind: "error", title: "Couldn't refresh", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-body text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Analyzing the search landscape…
      </div>
    );
  }

  const empty = !data || (data.competitors.length === 0 && data.gaps.length === 0);
  if (empty) {
    return (
      <Panel>
        <EmptyState
          tone="prompt"
          icon={Swords}
          title="No competitor data yet"
          description="Add competitor domains in Brand Memory (or set a free Brave Search key) and run the analysis to see who ranks for your keywords and where the gaps are."
        >
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="brand" onClick={refresh} disabled={running} loading={running}>
              {!running && <Sparkles className="size-4" aria-hidden="true" />}
              {running ? "Analyzing…" : "Run analysis"}
            </Button>
            <Button variant="outline" render={<Link href="/brand" />}>
              Edit Brand Memory
            </Button>
          </div>
        </EmptyState>
      </Panel>
    );
  }

  const badge = sourceBadge(data.source);

  return (
    <div className="space-y-5">
      {/* visibility header */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="tnum text-kpi font-semibold leading-none text-foreground">{data.yourVisibility}</span>
                <span className="text-label text-muted-foreground">% visibility</span>
              </div>
              <p className="mt-1 text-label text-muted-foreground">
                Your share of the top results across {data.keywords.length} target keyword{data.keywords.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-label text-muted-foreground">
              <span className="font-semibold text-foreground">{data.competitors.length}</span> competitors ·{" "}
              <span className="font-semibold text-foreground">{data.gaps.length}</span> keyword gaps
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badge.live ? "positive" : "muted"} title={badge.hint}>
              <span className={cn("size-1.5 rounded-full", badge.live ? "bg-positive" : "bg-muted-foreground")} />
              {badge.label}
              <Info className="size-3" />
            </Badge>
            <Button variant="outline" size="sm" onClick={refresh} disabled={running}>
              <RefreshCw className={cn("size-3.5", running && "animate-spin")} />
              {running ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>
      </Panel>

      {/* competitors */}
      <Panel title="Top competitors" description="Domains ranking for your target keywords, ranked by visibility">
        {data.competitors.length === 0 ? (
          <p className="text-label text-muted-foreground">No competing domains found for these keywords.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-label">
              <thead>
                <tr className="border-b border-border text-left text-micro uppercase text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Domain</th>
                  <th className="pb-2 pr-3 font-medium">Keywords</th>
                  <th className="pb-2 pr-3 font-medium">Avg position</th>
                  <th className="pb-2 font-medium">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {data.competitors.map((c) => (
                  <tr key={c.domain} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <a
                        href={`https://${c.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-foreground hover:text-brand hover:underline"
                      >
                        {c.domain}
                        <ArrowUpRight className="size-3 text-muted-foreground" />
                      </a>
                    </td>
                    <td className="tnum py-2.5 pr-3 text-muted-foreground">{c.appearances}</td>
                    <td className="tnum py-2.5 pr-3 text-muted-foreground">#{c.avgPosition}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, c.visibilityScore)}%` }} />
                        </div>
                        <span className="tnum text-muted-foreground">{c.visibilityScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* keyword gaps */}
      <Panel
        title="Keyword gaps"
        description="Buyer-intent keywords a competitor ranks for and you don't — your fastest wins"
      >
        {data.gaps.length === 0 ? (
          <p className="text-label text-muted-foreground">No gaps found — you&apos;re competitive on your target keywords.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-label">
              <thead>
                <tr className="border-b border-border text-left text-micro uppercase text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Keyword</th>
                  <th className="pb-2 pr-3 font-medium">Intent</th>
                  <th className="pb-2 pr-3 font-medium">Volume</th>
                  <th className="pb-2 pr-3 font-medium">Difficulty</th>
                  <th className="pb-2 pr-3 font-medium">Who ranks</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.gaps.map((g) => (
                  <tr key={g.keyword} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{g.keyword}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={INTENT_VARIANT[g.intent] ?? "muted"}>{g.intent}</Badge>
                    </td>
                    <td className="tnum py-2.5 pr-3 text-muted-foreground">{g.volume.toLocaleString()}</td>
                    <td className="tnum py-2.5 pr-3 text-muted-foreground">{g.difficulty}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {g.topCompetitor} <span className="text-foreground">#{g.competitorRank}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href="/research"
                        className="inline-flex items-center gap-1 text-label font-semibold text-brand hover:underline"
                      >
                        <Sparkles className="size-3.5" />
                        Generate page
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* page-level competitor analysis */}
      <Panel title="Analyze a competitor page" description="Crawl a competitor URL to see how it's built and where it's vulnerable">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !analyzing && analyzePage()}
              placeholder="https://competitor.com/their-winning-page"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-body text-foreground outline-none transition-colors focus:border-brand focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button variant="brand" size="lg" className="h-10 px-4" onClick={analyzePage} disabled={analyzing || !pageUrl.trim()} loading={analyzing}>
            {!analyzing && <Swords className="size-4" />}
            {analyzing ? "Analyzing…" : "Analyze page"}
          </Button>
        </div>

        {pageResult?.crawled && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-h-card font-semibold text-foreground">{pageResult.title || pageResult.url}</div>
              <p className="mt-1 text-label text-muted-foreground">{pageResult.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="muted">{pageResult.structure.wordCount.toLocaleString()} words</Badge>
              <Badge variant="muted">{pageResult.structure.headings} headings</Badge>
              <Badge variant="muted">{pageResult.structure.images} images</Badge>
              <Badge variant={pageResult.structure.hasSchema ? "positive" : "warning"}>{pageResult.structure.hasSchema ? "has schema" : "no schema"}</Badge>
              <Badge variant={pageResult.structure.hasFaq ? "positive" : "warning"}>{pageResult.structure.hasFaq ? "has FAQ" : "no FAQ"}</Badge>
              <Badge variant="muted">{pageResult.source === "llm" ? "AI-analyzed" : "heuristic"}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pageResult.strengths.length > 0 && (
                <div>
                  <div className="mb-1.5 text-micro font-semibold uppercase text-muted-foreground">Their strengths</div>
                  <ul className="space-y-1.5">
                    {pageResult.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-label text-foreground"><Check className="mt-0.5 size-3.5 shrink-0 text-positive" />{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="mb-1.5 text-micro font-semibold uppercase text-muted-foreground">Vulnerabilities to exploit</div>
                <ul className="space-y-1.5">
                  {pageResult.vulnerabilities.map((v, i) => (
                    <li key={i} className="flex gap-2 text-label text-foreground"><ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />{v}</li>
                  ))}
                </ul>
              </div>
            </div>
            {pageResult.recommendation && (
              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3 text-label text-foreground">
                <span className="font-semibold">How to outrank it: </span>
                {pageResult.recommendation}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
