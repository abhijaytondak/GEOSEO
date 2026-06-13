/**
 * GEOSEO domain model — the contract every data source must satisfy.
 *
 * Real backends (DataForSEO, brand-memory, Claude) implement the provider
 * interfaces at the bottom of this file. The mock package in `@geoseo/mock`
 * provides in-memory implementations for the UI prototype.
 */

export type ISODate = string; // YYYY-MM-DD or full ISO timestamp

export type Direction = "up" | "down" | "flat";

/** A metric value plus its period-over-period movement. */
export interface Delta {
  /** Signed percentage change vs. the comparison period. */
  pct: number;
  direction: Direction;
  /** Whether an upward movement is good (backlinks) or bad (avg rank position). */
  goodWhen: "up" | "down";
}

/* ---------------------------------------------------------------- KPIs */

export type KpiId =
  | "total-backlinks"
  | "avg-rank"
  | "domain-authority"
  | "ai-visibility";

export interface KpiMetric {
  id: KpiId;
  label: string;
  value: number;
  /** "", "%", "/100", "#" — rendered verbatim after the value. */
  unit: string;
  /** Optional prefix like "#" for rank. */
  prefix?: string;
  delta: Delta;
  caption: string; // e.g. "vs last 30 days"
  /** Small sparkline series (oldest → newest). */
  spark: number[];
}

/* ------------------------------------------------------- Domain health */

export interface DomainHealthFactor {
  label: string;
  /** 0–100 */
  score: number;
}

export interface DomainHealth {
  /** 0–100 composite authority/health score. */
  score: number;
  grade: "A" | "B" | "C" | "D";
  delta: Delta;
  factors: DomainHealthFactor[];
  /** Acquired backlinks vs. total discovered opportunities. */
  backlinksAcquired: number;
  backlinksOpportunities: number;
}

/* ------------------------------------------------------- Backlinks */

export type ProspectStatus =
  | "new"
  | "contacted"
  | "replied"
  | "acquired"
  | "rejected";

export interface BacklinkProspect {
  id: string;
  domain: string;
  url: string;
  /** 0–100 domain authority. */
  domainAuthority: number;
  /** 0–100 topical relevance to the brand. */
  relevanceScore: number;
  /** 0–100 blended priority (DA × relevance × traffic). */
  impactScore: number;
  /** Estimated monthly organic traffic of the prospect site. */
  trafficEstimate: number;
  industry: string;
  tags: string[];
  status: ProspectStatus;
  contactEmail?: string;
  lastInteraction?: ISODate;
  /** One-line "why this prospect" rationale shown in the UI. */
  rationale: string;
}

export type BacklinkStatus = "live" | "pending" | "lost" | "broken";
export type BacklinkType = "editorial" | "guest" | "directory" | "citation";

export interface Backlink {
  id: string;
  sourceDomain: string;
  targetPage: string;
  anchorText: string;
  domainAuthority: number;
  status: BacklinkStatus;
  type: BacklinkType;
  acquiredAt: ISODate;
}

/* ------------------------------------------------------- Performance */

export interface RankPoint {
  date: ISODate;
  /** Average SERP position (lower is better). */
  rank: number;
}

export interface ImpressionPoint {
  date: ISODate;
  impressions: number;
  clicks: number;
}

export interface TrackedPage {
  id: string;
  path: string;
  title: string;
  currentRank: number;
  prevRank: number;
  impressions: number;
  clicks: number;
  /** Per-page rank history for drilldown. */
  ranks: RankPoint[];
  impressionsSeries: ImpressionPoint[];
}

export type AiEngine = "chatgpt" | "perplexity" | "gemini" | "google-ai";

export interface AiVisibilitySignal {
  engine: AiEngine;
  label: string;
  /** Times the brand was cited/mentioned in AI answers this period. */
  mentions: number;
  /** Share of voice 0–100 vs tracked competitors. */
  shareOfVoice: number;
  delta: Delta;
}

/* ------------------------------------------------------- Alerts */

export type AlertType =
  | "rank-drop"
  | "traffic-drop"
  | "lost-backlink"
  | "broken-backlink"
  | "ai-underperform"
  | "opportunity";

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendedAction: { label: string; href: string };
  createdAt: ISODate;
  /** Optional headline number, e.g. "-8%" or "3 pages". */
  metric?: string;
  read?: boolean;
  resolved?: boolean;
}

/* ------------------------------------------------------- Activity */

export type ActivityKind =
  | "backlink-acquired"
  | "outreach-sent"
  | "rank-improved"
  | "page-optimized"
  | "alert-resolved";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  at: ISODate;
}

/* ------------------------------------------------------- Brand + outreach */

export type BrandTone = "friendly" | "professional" | "concise";

export interface BrandProfile {
  company: string;
  domain: string;
  url: string;
  valueProp: string;
  topics: string[];
  industry: string;
  tone: BrandTone;
  contactName: string;
  contactEmail: string;
  /** Richer Brand-Memory fields (optional; power outreach + future content agents). */
  audience?: string;
  differentiators?: string[];
  competitors?: string[];
  keywords?: string[];
}

/** One immutable snapshot in the Brand Memory edit history. */
export interface BrandMemoryVersion {
  id: string;
  /** Monotonic version number (v1 = original onboarding capture). */
  version: number;
  profile: BrandProfile;
  updatedAt: ISODate;
  author: string;
  note: string;
}

export interface OutreachTemplate {
  id: string;
  prospectId: string;
  variantName: string; // "Warm intro" | "Value-first" | "Concise"
  subject: string;
  body: string;
}

/* ------------------------------------------------------- Mock-backed product operations */

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type JobType =
  | "audit"
  | "discover"
  | "acquire-backlinks"
  | "export"
  | "content-rescan"
  | "content-refresh"
  | "internal-links"
  | "settings-sync";

export interface JobRun {
  id: string;
  type: JobType;
  title: string;
  description: string;
  status: JobStatus;
  progress: number;
  createdAt: ISODate;
  completedAt?: ISODate;
  result?: string;
}

export interface ProspectUpdate {
  status?: ProspectStatus;
  contactEmail?: string;
  tags?: string[];
  notes?: string;
  archived?: boolean;
}

export interface ContentRefreshAction {
  pageIds: string[];
  mode: "single" | "bulk" | "rescan";
}

export interface InternalLinkSuggestion {
  id: string;
  fromPageId: string;
  toPageId: string;
  fromTitle: string;
  toPath: string;
  status: "suggested" | "applied";
}

export type IntegrationStatus = "connected" | "needs-attention" | "disabled";

export interface WorkspaceIntegration {
  id: string;
  label: string;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: ISODate;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "marketer" | "analyst";
}

export interface WorkspaceSettings {
  profile: {
    workspaceName: string;
    domain: string;
    defaultPublishPath: string;
    timezone: string;
  };
  notifications: {
    weeklyDigest: boolean;
    criticalAlerts: boolean;
    publishFailures: boolean;
    leadAlerts: boolean;
  };
  integrations: WorkspaceIntegration[];
  team: TeamMember[];
  billing: {
    plan: "Launch" | "Grow" | "Scale";
    status: "trial" | "active" | "past-due";
    seatsUsed: number;
    seatsLimit: number;
  };
}

/* ================================================================
   Provider interfaces — the swap seams for real backends.
   ================================================================ */

/** SEO data — implemented by DataForSEO in production. */
export interface SeoDataProvider {
  getDomainHealth(): Promise<DomainHealth>;
  getKpis(): Promise<KpiMetric[]>;
  getProspects(): Promise<BacklinkProspect[]>;
  getBacklinks(): Promise<Backlink[]>;
  getTrackedPages(): Promise<TrackedPage[]>;
  getRankSeries(): Promise<RankPoint[]>;
  getImpressionSeries(): Promise<ImpressionPoint[]>;
  getAiVisibility(): Promise<AiVisibilitySignal[]>;
  getAlerts(): Promise<Alert[]>;
  getActivity(): Promise<ActivityEvent[]>;
}

/** Brand profile — implemented by the brand-memory product in production. */
export interface BrandProfileSource {
  getBrandProfile(): Promise<BrandProfile>;
}

/**
 * Editable, versioned Brand Memory — Gushwork's "single source of truth"
 * injected into every downstream agent. Mock-backed now; the brand-memory
 * product (pgvector-backed) swaps in behind this interface later.
 */
export interface BrandMemoryStore extends BrandProfileSource {
  getVersions(): Promise<BrandMemoryVersion[]>;
  update(profile: BrandProfile, note?: string): Promise<BrandMemoryVersion>;
  revert(versionId: string): Promise<BrandMemoryVersion>;
}

/** Outreach drafting — implemented by Claude (prompt-cached) in production. */
export interface OutreachDrafter {
  draft(
    prospect: BacklinkProspect,
    brand: BrandProfile,
  ): Promise<OutreachTemplate[]>;
}

/* Page Creation & Publishing Engine model (separate module). */
export * from "./page-engine";
