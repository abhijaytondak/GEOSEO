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
  /** One-line "what this measures / how to improve" — surfaced on hover (Authority HQ §Phase2). */
  explanation?: string;
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

/* ----------------- Authority overview aggregate (Authority HQ §Phase2/3) */

/** DA- and status-weighted quality of the backlink profile. */
export interface BacklinkQuality {
  /** 0–100 weighted quality score (live links on high-DA domains score highest). */
  score: number;
  grade: "A" | "B" | "C" | "D";
  total: number;
  breakdown: { live: number; pending: number; lost: number; broken: number };
  /** Average domain authority across live links. */
  avgLiveAuthority: number;
}

/** Trajectory + 30-day projection derived from the rank-series trend. */
export interface AuthorityMomentum {
  direction: Direction;
  /** Signed % change over the trend window. */
  pct: number;
  /** Projected composite health score ~30 days out. */
  projectedScore: number;
  summary: string;
}

/** One server round-trip backing the Authority HQ overview. */
export interface AuthorityOverview {
  health: DomainHealth;
  backlinkQuality: BacklinkQuality;
  alerts: { open: number; critical: number; warning: number };
  momentum: AuthorityMomentum;
}

/* ----------------- AI Search engine (mentions + bot crawl tracking) */

export type AiMentionEngine = "chatgpt" | "perplexity" | "gemini" | "claude" | "copilot" | "grok" | "google-ai";

/** A tracked brand mention/citation in an AI answer engine. */
export interface AiMention {
  id: string;
  engine: AiMentionEngine;
  query: string;
  mentioned: boolean;
  /** Citation rank within the AI answer, if cited. */
  position?: number;
  snippet?: string;
  pageId?: string;
  pageUrl?: string;
  /** How the mention was determined — provider tracking activates with keys. */
  source: "manual" | "heuristic" | "provider";
  checkedAt: ISODate;
}

export type AiCrawlerBot =
  | "GPTBot"
  | "OAI-SearchBot"
  | "PerplexityBot"
  | "ClaudeBot"
  | "Google-Extended"
  | "Bingbot"
  | "Other";

/** A recorded AI-crawler visit to a published page. */
export interface AiBotHit {
  id: string;
  bot: AiCrawlerBot;
  url: string;
  pageId?: string;
  userAgent?: string;
  at: ISODate;
}

/** Aggregate backing the AI Search workspace overview. */
export interface AiSearchOverview {
  activePages: number;
  aiMentions: number;
  botCrawls: number;
  pagesIndexed: number;
  qualifiedLeads: number;
  authorityLinks: number;
  byEngine: { engine: AiMentionEngine; mentions: number }[];
  byBot: { bot: AiCrawlerBot; hits: number }[];
}

/* ----------------- Onboarding journey (self-serve company setup) */

export interface OnboardingStatus {
  completed: boolean;
  /** Company / workspace identity captured during setup. */
  workspaceName?: string;
  domain?: string;
  websiteUrl?: string;
  /** Integrations the company asked to connect (real OAuth wired later). */
  requestedIntegrations: string[];
  /** Which setup steps have been finished. */
  steps: {
    websiteScanned: boolean;
    brandSaved: boolean;
    themeScanned: boolean;
    publishingConfigured: boolean;
    opportunitiesSeeded: boolean;
  };
  completedAt?: ISODate;
  startedAt?: ISODate;
}

/* ----------------- Solution readiness (Solution Parity PRD §13 Phase 1) */

export type SolutionStatus = "available" | "partial" | "planned";
export type CapabilityStatus = "built" | "partial" | "gap";

export interface SolutionCapability {
  label: string;
  status: CapabilityStatus;
  note?: string;
}

/** Honest, self-reported readiness of a commercial solution package. */
export interface SolutionReadiness {
  id: "ai-search" | "lead-conversion" | "paid-boost";
  name: string;
  status: SolutionStatus;
  /** % of capabilities built (built=1, partial=0.5, gap=0). */
  completeness: number;
  summary: string;
  primaryQuestion: string;
  capabilities: SolutionCapability[];
  safeClaims: string[];
  avoidClaims: string[];
}

/* ----------------- Lead activity timeline (Leads PRD §11 / Gap 3) */

export type LeadActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "status_change"
  | "assignment"
  | "crm_sync"
  | "notification"
  | "spam_override"
  | "delete"
  | "export";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  body: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODate;
}

export interface LeadAssignment {
  leadId: string;
  ownerId: string;
  assignedAt: ISODate;
  assignedBy: string;
}

export interface LeadScoreReason {
  label: string;
  impact: "positive" | "negative" | "neutral";
  points: number;
  explanation: string;
}

/** Explainable lead score (Leads PRD §11 / Gap 7). */
export interface LeadScore {
  total: number;
  fit: number;
  intent: number;
  engagement: number;
  spamRisk: number;
  confidence: number;
  reasons: LeadScoreReason[];
  recommendedAction: string;
}

export type LeadNotificationChannel = "in_app" | "email" | "slack" | "webhook";

/** Routing/alerting rule for inbound leads (Leads PRD §11 / Gap 5). */
export interface LeadNotificationRule {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  channels: LeadNotificationChannel[];
  /** Only notify for leads at/above this score. */
  minScore?: number;
  /** Only notify for these lead statuses. */
  statuses?: string[];
  /** Only notify for leads from these page ids. */
  pages?: string[];
  ownerOnly?: boolean;
  quietHours?: { start: string; end: string; timezone: string };
}

/** A delivered (or suppressed) notification for a lead. */
export interface LeadNotification {
  id: string;
  leadId: string;
  ruleId?: string;
  channels: LeadNotificationChannel[];
  message: string;
  status: "sent" | "suppressed";
  createdAt: ISODate;
}

export type LeadFormFieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "hidden";

export interface LeadFormField {
  id: string;
  type: LeadFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

/** Per-workspace / per-page lead capture form configuration (Leads PRD §11 / Gap 11). */
export interface LeadFormConfig {
  id: string;
  workspaceId: string;
  pageId?: string;
  name: string;
  fields: LeadFormField[];
  ctaText: string;
  thankYouTitle: string;
  thankYouBody: string;
  consentRequired: boolean;
  consentText?: string;
  spamProtection: { honeypot: boolean; rateLimit: boolean; disposableEmailCheck: boolean };
  styleMode: "geoseo_default" | "match_page_theme";
}

export type LeadJourneyEventType =
  | "page_view"
  | "cta_click"
  | "form_start"
  | "form_submit"
  | "download"
  | "external_click";

export interface LeadJourneyEvent {
  id: string;
  leadId?: string;
  anonymousVisitorId: string;
  sessionId: string;
  type: LeadJourneyEventType;
  pageId?: string;
  url: string;
  title?: string;
  referrer?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  occurredAt: ISODate;
}

export interface LeadJourneySummary {
  anonymousVisitorId?: string;
  sessionCount: number;
  touchpointCount: number;
  firstSeenAt?: ISODate;
  convertedAt?: ISODate;
  timeToConvertSeconds?: number;
  topPages: Array<{ pageId?: string; title: string; url: string; views: number }>;
}

/* ----------------- Site theme profile (Page Engine theme matching PRD §7) */

export interface ComponentStyle {
  background?: string;
  foreground?: string;
  border?: string;
  radius?: number;
  padding?: string;
  shadow?: string;
  fontWeight?: number;
}

/** Extracted/confirmed visual identity of a customer's website — styles generated pages. */
export interface SiteThemeProfile {
  id: string;
  workspaceId: string;
  sourceUrls: string[];
  status: "draft" | "confirmed" | "needs-review";
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary?: string;
    accent?: string;
    muted?: string;
    border?: string;
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    scale: string[];
    headingWeight?: number;
    bodyWeight?: number;
  };
  layout: {
    maxWidth: number;
    sectionSpacing: number;
    gridGap: number;
    headerStyle: "centered" | "split" | "minimal" | "editorial" | "custom";
    radius: number;
  };
  components: {
    button: ComponentStyle;
    card: ComponentStyle;
    input: ComponentStyle;
    badge?: ComponentStyle;
  };
  assets: {
    logoUrl?: string;
    faviconUrl?: string;
    sampleImages: string[];
  };
  /** 0–100 extraction confidence. */
  confidence: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Range-aware aggregate backing the Performance page summary strip. */
export interface PerformanceOverview {
  range: string;
  days: number;
  avgRank: number;
  /** Positive ⇒ ranking improved vs. the prior equal-length window. */
  rankDelta: number;
  impressions: number;
  clicks: number;
  /** Click-through rate, %. */
  ctr: number;
  aiMentions: number;
  avgShareOfVoice: number;
  trackedPages: number;
  topMovers: { id: string; title: string; path: string; rankDelta: number }[];
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
  /** ISO timestamp until which the alert is snoozed (hidden from the default view). */
  snoozedUntil?: ISODate;
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

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

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
  startedAt?: ISODate;
  completedAt?: ISODate;
  cancelledAt?: ISODate;
  result?: string;
  /** Failure reason, set when status is "failed". */
  error?: string;
  /** Download URL for a produced artifact (e.g. an export file), when available. */
  artifactUrl?: string;
}

/** Workspace = tenant root (PRD §11.1). CRUD is unblocked; per-entity
 *  tenant-scoping + RBAC arrives with Clerk JWT auth. */
export interface Workspace {
  id: string;
  name: string;
  domain: string;
  industry: string;
  status: "active" | "paused" | "archived";
  createdAt: ISODate;
  updatedAt: ISODate;
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
  /** Page Engine publishing policy — surfaced in the Pages → Publishing settings sheet. */
  publishing: {
    /** Require human approval before a page goes live. */
    requireApproval: boolean;
    /** Regenerate sitemap.xml automatically on every publish. */
    autoSitemap: boolean;
    /** Regenerate llms.txt automatically on every publish. */
    autoLlms: boolean;
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

/** Authority HQ prioritized next-action (Authority HQ PRD §23). */
export interface AuthorityAction {
  id: string;
  title: string;
  reason: string;
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  status: "new" | "in-progress" | "done" | "snoozed" | "failed";
  href: string;
  primaryAction: { label: string; kind: "navigate" | "job" | "mutation" };
}

/* ================================================================
   Global Search (PRD — Best-in-Class Global Search §12).
   ================================================================ */

export type SearchEntityType =
  | "prospect"
  | "outreach"
  | "tracked-page"
  | "alert"
  | "content"
  | "brand"
  | "setting"
  | "page-opportunity"
  | "generated-page"
  | "lead"
  | "job"
  | "audit"
  | "command";

export interface SearchResultAction {
  id: string;
  label: string;
  kind: "navigate" | "mutation" | "copy" | "download";
  href?: string;
  /** Value to place on the clipboard for `kind: "copy"`. */
  copyValue?: string;
  mutation?: {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    body?: unknown;
  };
  destructive?: boolean;
}

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  excerpt?: string;
  href?: string;
  /** Lucide icon name resolved on the client. */
  icon?: string;
  status?: string;
  badges?: string[];
  metrics?: Array<{ label: string; value: string | number }>;
  score: number;
  updatedAt?: ISODate;
  actions: SearchResultAction[];
}

export interface SearchFacet {
  type: SearchEntityType;
  label: string;
  count: number;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  query: string;
  reason?: string;
}

export interface SearchInterpretation {
  raw: string;
  terms: string[];
  filters: Array<{ key: string; operator: string; value: string | number | boolean }>;
  intent?: "navigate" | "analyze" | "act" | "export" | "create";
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  interpretedQuery?: SearchInterpretation;
}

/* Page Creation & Publishing Engine model (separate module). */
export * from "./page-engine";
