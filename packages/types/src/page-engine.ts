/**
 * Page Creation & Publishing Engine domain model
 * (PRD: Automatic Page Creation and Publishing Engine).
 *
 * Distinct from the backlinking surface: here an "Opportunity" is a buyer-intent
 * KEYWORD opportunity (not a backlink prospect). Kept in a separate module so the
 * page-engine can evolve independently of the authority/backlinking types.
 */
import type { ISODate } from "./index";

export type PageType =
  | "landing"
  | "guide"
  | "faq"
  | "comparison"
  | "resource"
  | "service"
  | "local";

export type SearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational"
  | "local"
  | "comparison";

/** Buyer funnel stage — research-mode vs ready-to-buy (Gushwork "Intent Mapping" #2). */
export type FunnelStage = "research" | "consideration" | "ready-to-buy";

/* ----------------------------------------------- Research → Opportunity */

export type OpportunityStatus = "new" | "approved" | "rejected" | "deferred";

export interface KeywordOpportunity {
  id: string;
  query: string;
  clusterId: string;
  clusterLabel: string;
  intent: SearchIntent;
  /** Research-mode vs ready-to-buy signal (Intent Mapping). */
  funnelStage?: FunnelStage;
  /** Estimated monthly search volume. */
  volume: number;
  /** 0–100 keyword difficulty. */
  difficulty: number;
  /** 0–100 commercial value. */
  commercialValue: number;
  /** Estimated cost-per-click (USD) — real buyer-value signal when available. */
  cpc?: number;
  /** 0–100 model confidence in the recommendation. */
  confidence: number;
  /** 0–100 blended opportunity score (volume reach × value × winnability) — the default sort. */
  score?: number;
  /** True for question / "People Also Ask"-style queries — prime AEO (answer-engine) targets. */
  question?: boolean;
  recommendedPageType: PageType;
  competitorUrls: string[];
  /** One-line "why this is recommended" evidence (PRD acceptance criteria). */
  evidence: string;
  status: OpportunityStatus;
  /** Flagged when it cannibalizes an existing page (PRD §7.2 dedupe). */
  duplicate?: boolean;
  createdAt: ISODate;
}

/* ----------------------------------------------- Strategy → Blueprint */

export type BlueprintStatus = "draft" | "approved" | "rejected";

export interface OutlineSection {
  heading: string;
  summary: string;
}

export interface PageBlueprint {
  id: string;
  opportunityId: string;
  title: string;
  slug: string;
  pageType: PageType;
  targetKeywords: string[];
  intentSummary: string;
  audience: string;
  outline: OutlineSection[];
  ctaPlan: string;
  internalLinkPlan: string[];
  schemaPlan: string[];
  differentiationNotes: string;
  /** net-new vs refresh vs merge candidate (PRD §7.3 acceptance). */
  changeKind: "net-new" | "refresh" | "merge";
  status: BlueprintStatus;
  createdAt: ISODate;
  approvedAt?: ISODate;
}

/* ----------------------------------------------- Content → GeneratedPage */

export type PageStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "published"
  | "needs-refresh";

export interface PageSection {
  heading: string;
  body: string;
}

export interface PageFaq {
  q: string;
  a: string;
}

export interface SeoCheck {
  label: string;
  pass: boolean;
}

/**
 * In-page infographic specs (PRD Phase 3 — Infographics Engine). Rendered as
 * semantic HTML on the published page — not raster images — so AI crawlers can
 * read every label and value (a deliberate edge over image-only infographics).
 *
 * Each variant is a distinct interface in a discriminated union keyed on `kind`.
 * The legacy `InfographicSpec` interface (single optional-field shape) is kept
 * for backward-compat with existing `buildInfographic` callers; the new
 * discriminated-union types coexist alongside it.
 */
export type InfographicKind =
  | "comparison-table"
  | "process-flow"
  | "stat-grid"
  | "pros-cons"
  | "timeline";

/* -- discriminated-union variants (Phase 3) -------------------------------- */

export interface ComparisonTableSpec {
  kind: "comparison-table";
  title: string;
  /** Column headers, e.g. ["Feature", "Us", "Competitor A"] */
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
}

export interface ProcessFlowSpec {
  kind: "process-flow";
  title: string;
  steps: Array<{ number: number; heading: string; detail: string }>;
}

export interface StatGridSpec {
  kind: "stat-grid";
  title: string;
  stats: Array<{ value: string; label: string; note?: string }>;
}

export interface ProsConsSpec {
  kind: "pros-cons";
  title: string;
  pros: string[];
  cons: string[];
}

export interface TimelineSpec {
  kind: "timeline";
  title: string;
  events: Array<{ date: string; heading: string; detail: string }>;
}

/** Discriminated union of all infographic variants (Phase 3). */
export type InfographicSpecV2 =
  | ComparisonTableSpec
  | ProcessFlowSpec
  | StatGridSpec
  | ProsConsSpec
  | TimelineSpec;

/* -- legacy flat interface (Phase 6 / backward-compat) --------------------- */

/** @deprecated Use `InfographicSpecV2` for new code. Kept for backward-compat. */
export interface InfographicSpec {
  kind: InfographicKind;
  title: string;
  /** process-flow (legacy) */
  steps?: { label: string; detail?: string }[];
  /** comparison-table (legacy) */
  columns?: string[];
  rows?: { label: string; cells: string[] }[];
  /** stat-grid (legacy) */
  stats?: { value: string; label: string }[];
  /** pros-cons (legacy) */
  pros?: string[];
  cons?: string[];
}

export interface GeneratedPage {
  id: string;
  blueprintId: string;
  opportunityId: string;
  title: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: PageSection[];
  faqs: PageFaq[];
  cta: { label: string; href: string };
  /** JSON-LD structured data (stringified). */
  schemaJson: string;
  /**
   * Hero image for the page. When an image-gen provider is configured this is a
   * hosted brand image URL; otherwise the published page renders a theme-matched
   * branded hero (no generic stock) — see docs/PRD-page-engine-gushwork-parity.md
   * Phase 2.
   */
  heroImageUrl?: string;
  heroImageAlt?: string;
  /** Open Graph image URL for social sharing. Defaults to heroImageUrl when not set separately. */
  ogImageUrl?: string;
  /** Optional in-page infographic (crawlable HTML/SVG) — PRD Phase 6 (legacy). */
  infographic?: InfographicSpec;
  /** AI-crawlable structured infographics embedded in the published page — PRD Phase 3. */
  infographics?: InfographicSpecV2[];
  targetKeywords: string[];
  wordCount: number;
  brandMemoryVersion: number;
  seoChecks: SeoCheck[];
  /** Content QA: similarity / readability / policy (PRD §7.4). */
  qualityChecks?: SeoCheck[];
  /** Citability / AEO score (0–100) + grade — how citable the page is by AI answer engines.
   *  Computed deterministically alongside seoChecks; surfaced at-a-glance on page cards. */
  citabilityScore?: number;
  citabilityGrade?: "A" | "B" | "C" | "D" | "F";
  publishedUrl?: string;
  publishedAt?: ISODate;
  lastRefreshedAt?: ISODate;
  /** When true, the page is automatically re-drafted when flagged stale (autopilot). */
  autopilot?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** An immutable snapshot of a page's content + metadata (PRD §11.6). */
export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroCopy: string;
  sections: PageSection[];
  faqs: PageFaq[];
  cta: { label: string; href: string };
  changeSummary: string;
  authorType: "ai" | "human" | "system";
  createdAt: ISODate;
}

/** Partial page edit payload (PRD §9.4 page editor). */
export interface PageEdit {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroCopy?: string;
  sections?: PageSection[];
  faqs?: PageFaq[];
  cta?: { label: string; href: string };
}

/* ----------------------------------------------- Leads */

export type LeadStatus = "new" | "qualified" | "contacted" | "won" | "lost";
export type SpamStatus = "clean" | "spam" | "duplicate";

export interface Lead {
  id: string;
  pageId: string;
  pageTitle: string;
  name: string;
  email: string;
  company: string;
  message: string;
  sourceUrl: string;
  utm?: string;
  /** 0–100 lead score. */
  score: number;
  status: LeadStatus;
  spamStatus: SpamStatus;
  crmSyncStatus?: "none" | "pending" | "synced";
  createdAt: ISODate;
}

/** Audit trail entry for sensitive actions (PRD §10.1/§15.2). */
export interface AuditEntry {
  id: string;
  /** Page-engine actions plus the core-workflow actions (PRD §10 audit logging). */
  action:
    | "generate" | "edit" | "publish" | "approve" | "reject" | "defer" | "rollback" | "delete"
    | "create" | "update" | "discover" | "archive" | "restore" | "resolve" | "snooze"
    | "export" | "integration" | "bulk" | "notification";
  entity: "page" | "opportunity" | "blueprint" | "lead" | "prospect" | "alert" | "settings" | "job" | "brand" | "content";
  entityId: string;
  actor: string;
  workspaceId: string;
  at: ISODate;
}

/* ----------------------------------------------- Provider seam */

/** Page-engine data source — mock today; real research/LLM/CMS behind this later. */
export interface PageEngineSource {
  getOpportunities(): Promise<KeywordOpportunity[]>;
  getBlueprints(): Promise<PageBlueprint[]>;
  getPages(): Promise<GeneratedPage[]>;
  getPage(id: string): Promise<GeneratedPage | undefined>;
  getLeads(): Promise<Lead[]>;
}
