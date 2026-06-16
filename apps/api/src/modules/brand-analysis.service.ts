import { Inject, Injectable } from "@nestjs/common";
import type {
  BrandAnalysis,
  BrandProfile,
  BrandScorecard,
  BrandScorecardItem,
  CompetitorAnalysis,
  SearchIntent,
} from "@geoseo/types";
import { DocStore } from "../db/db";
import { BrandMemoryStore } from "./brand.service";
import { KeywordResearchService } from "./keyword-research.service";
import { ConversionAuditStore, type ConversionAudit } from "./conversion-audit.service";
import { CompetitorAnalysisService, type KeywordSeed } from "./competitor-analysis.service";

type AnalysisState = { analysis: BrandAnalysis | null };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

function gradeFor(score: number): BrandScorecard["grade"] {
  return score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";
}

/** Brand-Memory completeness (0–100) from how many identity fields are filled. */
function brandCompleteness(b: BrandProfile): number {
  const checks = [
    !!b.company,
    !!b.valueProp,
    (b.topics?.length ?? 0) > 0,
    !!b.industry,
    !!b.audience,
    (b.differentiators?.length ?? 0) > 0,
    (b.competitors?.length ?? 0) > 0,
    (b.keywords?.length ?? 0) > 0,
  ];
  return clamp((checks.filter(Boolean).length / checks.length) * 100, 0, 100);
}

/** Lightweight buyer-intent classifier (mirrors the page-engine heuristic). */
function classifyIntent(keyword: string): SearchIntent {
  const s = keyword.toLowerCase();
  if (/\b(vs|versus|alternative|alternatives|compare|comparison)\b/.test(s)) return "comparison";
  if (/\b(buy|price|pricing|cost|quote|demo|trial|sign ?up|free)\b/.test(s)) return "transactional";
  if (/\b(how|what|why|guide|tutorial|examples?|ideas?|tips|best way)\b/.test(s)) return "informational";
  if (/\bnear me\b/.test(s)) return "local";
  return "commercial";
}

function brandDomain(b: BrandProfile): string {
  const raw = (b.domain || b.url || "").trim();
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/**
 * Pure scorecard synthesis — turns the raw signals (conversion audit + competitor
 * visibility + Brand-Memory completeness) into "what's strong / weak / to do next".
 * Exported so it can be unit-tested without the network-bound orchestrator.
 */
export function computeScorecard(
  brand: BrandProfile,
  audit: ConversionAudit,
  competitor: CompetitorAnalysis,
  completeness: number,
): BrandScorecard {
  const strengths: BrandScorecardItem[] = [];
  const weaknesses: BrandScorecardItem[] = [];
  const actions: BrandScorecardItem[] = [];

  const auditScore = audit.crawled ? audit.score : 0;
  const passes = audit.findings.filter((f) => f.status === "pass");
  const fails = audit.findings.filter((f) => f.status === "fail");
  const warns = audit.findings.filter((f) => f.status === "warn");
  const vis = competitor.yourVisibility;
  const gaps = competitor.gaps;

  /* ---- strengths ---- */
  if (audit.crawled && auditScore >= 70)
    strengths.push({
      kind: "strength",
      title: "Conversion-ready homepage",
      detail: `${auditScore}/100 — ${passes.length} of ${audit.findings.length} conversion checks pass.`,
    });
  if (vis >= 40)
    strengths.push({
      kind: "strength",
      title: "Solid search visibility",
      detail: `You hold ~${vis}% of the top results across your target keywords.`,
    });
  if (completeness >= 80)
    strengths.push({
      kind: "strength",
      title: "Well-defined brand",
      detail: "Your Brand Memory is rich enough to ground page generation and outreach.",
    });
  if (!strengths.length && passes.length)
    strengths.push({
      kind: "strength",
      title: `${passes.length} conversion basics in place`,
      detail: passes.slice(0, 3).map((p) => p.label).join(", ") + ".",
    });

  /* ---- weaknesses ---- */
  for (const f of fails.slice(0, 3))
    weaknesses.push({ kind: "weakness", title: f.label, detail: f.detail, severity: "high" });
  if (vis < 25)
    weaknesses.push({
      kind: "weakness",
      title: "Low search visibility",
      detail: competitor.competitors.length
        ? `${competitor.competitors[0].domain} and ${Math.max(0, competitor.competitors.length - 1)} others outrank you on your own topics.`
        : "You're barely visible for your target keywords.",
      severity: "high",
    });
  if (gaps.length >= 5)
    weaknesses.push({
      kind: "weakness",
      title: `${gaps.length} keyword gaps`,
      detail: "Competitors rank for buyer-intent keywords where you don't appear.",
      severity: "medium",
    });
  if (completeness < 60)
    weaknesses.push({
      kind: "weakness",
      title: "Brand Memory incomplete",
      detail: "Missing audience, differentiators, or competitors weakens generated content.",
      severity: "medium",
    });

  /* ---- actions (prioritized, top 3) ---- */
  if (fails.length)
    actions.push({
      kind: "action",
      title: `Fix: ${fails[0].label}`,
      detail: fails[0].recommendation,
      severity: "high",
    });
  const topGap = gaps[0];
  if (topGap)
    actions.push({
      kind: "action",
      title: `Win "${topGap.keyword}"`,
      detail: `${topGap.topCompetitor} ranks #${topGap.competitorRank} and you don't — ~${topGap.volume.toLocaleString()} searches/mo, difficulty ${topGap.difficulty}.`,
      severity: "medium",
    });
  if (completeness < 70)
    actions.push({
      kind: "action",
      title: "Complete your Brand Memory",
      detail: "Add your audience, differentiators, and competitors so generation is grounded in real facts.",
      severity: "medium",
    });
  // Top up to 3 with the next gaps.
  for (const g of gaps.slice(1)) {
    if (actions.length >= 3) break;
    actions.push({
      kind: "action",
      title: `Publish a page for "${g.keyword}"`,
      detail: `Buyer-intent (${g.intent}), ~${g.volume.toLocaleString()} searches/mo.`,
      severity: "low",
    });
  }
  if (!actions.length && warns.length)
    actions.push({ kind: "action", title: `Improve: ${warns[0].label}`, detail: warns[0].recommendation, severity: "low" });

  const score = clamp(0.4 * auditScore + 0.4 * vis + 0.2 * completeness, 0, 100);
  const status: BrandScorecard["status"] = score >= 75 ? "strong" : score >= 55 ? "mixed" : "needs-attention";

  return { score, grade: gradeFor(score), status, strengths, weaknesses, actions: actions.slice(0, 3) };
}

/**
 * Orchestrates the post-onboarding brand analysis: keyword discovery → conversion audit →
 * competitor SERP → scorecard. Per-tenant store (`cx_brand_analysis`) following the
 * `ConversionAuditStore` reference pattern. Never throws — every seam degrades safely.
 */
@Injectable()
export class BrandAnalysisStore {
  private cache = new Map<string, AnalysisState>();
  private db = new DocStore<AnalysisState>("cx_brand_analysis");

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(KeywordResearchService) private readonly keywords: KeywordResearchService,
    @Inject(ConversionAuditStore) private readonly audit: ConversionAuditStore,
    @Inject(CompetitorAnalysisService) private readonly competitor: CompetitorAnalysisService,
  ) {}

  private async state(tenantId: string): Promise<AnalysisState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { analysis: null };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  private commit(tenantId: string, analysis: BrandAnalysis): BrandAnalysis {
    const next: AnalysisState = { analysis };
    this.cache.set(tenantId, next);
    this.db.saveForTenant(tenantId, next);
    return analysis;
  }

  /** Cached analysis, or a `status:"pending"` stub if none has run (never blocks to compute). */
  async latest(tenantId: string): Promise<BrandAnalysis> {
    const { analysis } = await this.state(tenantId);
    if (analysis) return analysis;
    const brand = this.brand.current();
    return pendingAnalysis(brandDomain(brand));
  }

  /** Run a fresh analysis end-to-end and cache it. */
  async run(tenantId: string, now: string): Promise<BrandAnalysis> {
    const brand = this.brand.current();
    const domain = brandDomain(brand);
    const seeds = (brand.topics?.length ? brand.topics : [brand.company]).filter(Boolean);

    // 1. Keyword ideas (DataForSEO if keyed, else free Google Autocomplete, else seed fallback).
    const ideas = await this.keywords.researchKeywords(seeds, { limit: 24 }).catch(() => []);
    const ranked = [...ideas].sort((a, b) => b.searchVolume - a.searchVolume);
    const topKeywords = ranked.slice(0, 12).map((k) => ({
      keyword: k.keyword,
      volume: k.searchVolume,
      difficulty: k.difficulty,
    }));
    const targetSeeds: KeywordSeed[] = ranked.slice(0, 8).map((k) => ({
      keyword: k.keyword,
      volume: k.searchVolume,
      difficulty: k.difficulty,
      intent: classifyIntent(k.keyword),
    }));

    // 2. Conversion audit of the homepage (SSRF-guarded live crawl; never throws).
    const audit = await this.audit
      .run(tenantId, brand.url || `https://${domain}`, now)
      .catch((): ConversionAudit => ({ url: brand.url, score: 0, grade: "D", findings: [], crawled: false, auditedAt: now }));

    // 3. Competitor discovery: Brave SERP → dynamic LLM discovery → DDG → heuristic.
    const competitor = await this.competitor
      .analyze(domain, targetSeeds, brand.competitors ?? [], now, {
        company: brand.company,
        industry: brand.industry,
        valueProp: brand.valueProp,
        domain,
      })
      .catch(
        (): CompetitorAnalysis => ({
          domain,
          keywords: targetSeeds.map((k) => k.keyword),
          competitors: [],
          gaps: [],
          yourVisibility: 0,
          source: "heuristic",
          generatedAt: now,
        }),
      );

    // 4. Synthesize the scorecard.
    const scorecard = computeScorecard(brand, audit, competitor, brandCompleteness(brand));

    return this.commit(tenantId, {
      domain,
      scorecard,
      competitor,
      auditScore: audit.crawled ? audit.score : 0,
      auditGrade: audit.grade,
      topKeywords,
      source: `${competitor.source} + ${this.keywords.source}`,
      status: "ready",
      generatedAt: now,
    });
  }

  /** Competitor slice only (for the Competitors page) — computes if absent. */
  async competitors(tenantId: string, now: string): Promise<CompetitorAnalysis> {
    const { analysis } = await this.state(tenantId);
    if (analysis?.status === "ready") return analysis.competitor;
    return (await this.run(tenantId, now)).competitor;
  }
}

/** Empty `status:"pending"` shell so the frontend always gets a consistent shape. */
function pendingAnalysis(domain: string): BrandAnalysis {
  return {
    domain,
    scorecard: { score: 0, grade: "D", status: "needs-attention", strengths: [], weaknesses: [], actions: [] },
    competitor: { domain, keywords: [], competitors: [], gaps: [], yourVisibility: 0, source: "heuristic", generatedAt: "" },
    auditScore: 0,
    auditGrade: "D",
    topKeywords: [],
    source: "pending",
    status: "pending",
    generatedAt: "",
  };
}
