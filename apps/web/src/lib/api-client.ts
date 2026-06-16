/**
 * Typed client for the GEOSEO API (apps/api, v1).
 *
 * - Server (RSC): calls the API directly via API_INTERNAL_URL (default :4000).
 * - Client (browser): calls the relative /api/v1 path, which the Next rewrite
 *   proxies to the API — so it works through the ngrok tunnel too.
 *
 * Every call unwraps the `{ success, data, errors }` envelope. If the API is
 * unreachable, it falls back to the bundled mock so the UI never hard-fails.
 */
import { seoProvider, brandSource, outreachDrafter } from "@geoseo/mock";
import type {
  ActivityEvent,
  AiVisibilitySignal,
  AiBotHit,
  AiMention,
  AiMentionEngine,
  AiSearchOverview,
  Alert,
  AuditEntry,
  AuthorityOverview,
  Backlink,
  SiteThemeProfile,
  ThemeFidelity,
  SolutionReadiness,
  BacklinkProspect,
  BrandAnalysis,
  CompetitorAnalysis,
  BrandMemoryVersion,
  BrandProfile,
  ContentRefreshAction,
  DomainHealth,
  ImpressionPoint,
  InternalLinkSuggestion,
  JobRun,
  JobType,
  KpiMetric,
  OnboardingStatus,
  OutreachTemplate,
  PerformanceOverview,
  ProspectUpdate,
  RankPoint,
  SearchResponse,
  TrackedPage,
  WorkspaceSettings,
} from "@geoseo/types";

export interface BrandMemory {
  profile: BrandProfile;
  completeness: number;
  context: string;
}

export interface AlertThresholds {
  rankDrop: number;
  trafficDrop: number;
  brokenBacklinks: boolean;
  aiVisibilityDrop: number;
}

function base(): string {
  if (typeof window === "undefined") {
    return `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1`;
  }
  return "/api/v1";
}

/** Auth header. On the server we forward the configured token directly; in the
 *  browser the Next rewrite proxy is responsible for attaching credentials
 *  (the token is never exposed client-side). */
function authHeaders(): Record<string, string> {
  if (typeof window === "undefined" && process.env.DEV_API_TOKEN) {
    return { authorization: `Bearer ${process.env.DEV_API_TOKEN}` };
  }
  return {};
}

/** During `next build` the API isn't running, so every prerender probe fails and
 *  falls back to mock — that's expected, not an error. Stay quiet then; only warn
 *  at runtime where an unreachable API is a real signal. */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

/** Web runtime mode (PRD §4). The mock fallback is a DEMO-MODE safety net only:
 *  production/staging must surface real errors (no silent dummy data). Default
 *  `demo` keeps local dev resilient; set NEXT_PUBLIC_GEOSEO_MODE=production to fail closed. */
const MODE = (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo").toLowerCase();
const FALLBACK_ALLOWED = IS_BUILD || MODE === "demo";

function warnFallback(message: string): void {
  if (IS_BUILD) return;
  console.warn(`[api] ${message}`);
  // Make the demo fallback non-silent: signal the UI so it can surface a banner
  // ("showing demo data") instead of passing mock off as live. Browser-only.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("geoseo:degraded", { detail: { message } }));
  }
}

async function get<T>(path: string, fallback: () => Promise<T> | T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      cache: "no-store",
      headers: { accept: "application/json", ...authHeaders() },
    });
  } catch (err) {
    // Network/transport failure. In demo/build, degrade to mock so the UI never
    // hard-fails; in production/staging, surface the error to the route boundary.
    if (!FALLBACK_ALLOWED) throw err instanceof Error ? err : new Error(`API unreachable for ${path}`);
    warnFallback(`${path} unreachable — using mock fallback`);
    return fallback();
  }

  // Client errors (incl. 401/403/404) are real bugs — always surface them.
  if (res.status >= 400 && res.status < 500) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  // Server errors (5xx): demo/build → mock; production/staging → surface.
  if (!res.ok) {
    if (!FALLBACK_ALLOWED) throw new Error(`API ${res.status} for ${path}`);
    warnFallback(`${res.status} for ${path} — using mock fallback`);
    return fallback();
  }

  const body = (await res.json()) as { success: boolean; data: T };
  if (!body.success) {
    if (!FALLBACK_ALLOWED) throw new Error(`API returned success=false for ${path}`);
    warnFallback(`success=false for ${path} — using mock fallback`);
    return fallback();
  }
  return body.data;
}

/** Mutating call. No silent fallback — surfaces errors to the UI. */
async function send<T>(
  method: "PUT" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as { success: boolean; data: T; errors?: { message: string }[] };
  if (!res.ok || !json.success) {
    throw new Error(json.errors?.[0]?.message ?? `API ${res.status}`);
  }
  return json.data;
}

const fallbackSettings: WorkspaceSettings = {
  profile: {
    workspaceName: "Northwind Labs",
    domain: "northwindlabs.io",
    defaultPublishPath: "/feeds",
    timezone: "Asia/Kolkata",
  },
  notifications: {
    weeklyDigest: true,
    criticalAlerts: true,
    publishFailures: true,
    leadAlerts: false,
  },
  integrations: [
    {
      id: "webflow",
      label: "Webflow",
      description: "Publish generated pages to the marketing site.",
      status: "connected",
      lastSyncAt: "2026-06-12T00:00:00.000Z",
    },
    {
      id: "search-console",
      label: "Google Search Console",
      description: "Read impressions, clicks, ranking changes, and index state.",
      status: "needs-attention",
    },
    {
      id: "hubspot",
      label: "HubSpot",
      description: "Sync qualified leads and source-page attribution.",
      status: "disabled",
    },
  ],
  team: [
    { id: "tm-1", name: "Maya Chen", email: "maya@northwindlabs.io", role: "owner" },
    { id: "tm-2", name: "Ari Patel", email: "ari@northwindlabs.io", role: "marketer" },
  ],
  billing: { plan: "Grow", status: "trial", seatsUsed: 2, seatsLimit: 5 },
  publishing: { requireApproval: true, autoSitemap: true, autoLlms: true },
};

// Mirrors apps/api OverviewController so the UI degrades cleanly when the API is down.
const BACKLINK_WEIGHT: Record<Backlink["status"], number> = { live: 1, pending: 0.4, lost: 0, broken: 0 };
const authGrade = (s: number): "A" | "B" | "C" | "D" => (s >= 80 ? "A" : s >= 65 ? "B" : s >= 50 ? "C" : "D");

async function authorityOverviewFallback(): Promise<AuthorityOverview> {
  const [health, backlinks, alerts, ranks] = await Promise.all([
    seoProvider.getDomainHealth(),
    seoProvider.getBacklinks(),
    seoProvider.getAlerts(),
    seoProvider.getRankSeries(),
  ]);
  const breakdown = { live: 0, pending: 0, lost: 0, broken: 0 };
  for (const b of backlinks) breakdown[b.status] += 1;
  const totalDA = backlinks.reduce((a, b) => a + b.domainAuthority, 0) || 1;
  const weightedDA = backlinks.reduce((a, b) => a + b.domainAuthority * BACKLINK_WEIGHT[b.status], 0);
  const qScore = Math.round((weightedDA / totalDA) * 100);
  const live = backlinks.filter((b) => b.status === "live");
  const avgLiveAuthority = live.length ? Math.round(live.reduce((a, b) => a + b.domainAuthority, 0) / live.length) : 0;
  const open = alerts.filter((a) => !a.resolved);
  const tail = ranks.slice(-30);
  const first = tail[0]?.rank ?? 0;
  const last = tail[tail.length - 1]?.rank ?? 0;
  const change = first - last;
  const pct = first ? Math.round((change / first) * 1000) / 10 : 0;
  const direction = change > 0.5 ? "up" : change < -0.5 ? "down" : "flat";
  const projectedScore = Math.max(20, Math.min(99, Math.round(health.score + change)));
  const summary =
    direction === "up"
      ? `Rankings improving ${Math.abs(pct)}% — health projected to reach ${projectedScore}/100 in ~30 days.`
      : direction === "down"
        ? `Rankings slipping ${Math.abs(pct)}% — health projected at ${projectedScore}/100 in ~30 days without action.`
        : `Rankings holding steady — health projected near ${projectedScore}/100 in ~30 days.`;
  return {
    health,
    backlinkQuality: { score: qScore, grade: authGrade(qScore), total: backlinks.length, breakdown, avgLiveAuthority },
    alerts: {
      open: open.length,
      critical: open.filter((a) => a.severity === "critical").length,
      warning: open.filter((a) => a.severity === "warning").length,
    },
    momentum: { direction, pct, projectedScore, summary },
  };
}

const PERF_RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "8w": 56, quarter: 90 };

async function performanceOverviewFallback(range: string): Promise<PerformanceOverview> {
  const days = PERF_RANGE_DAYS[range] ?? 56;
  const [ranks, impressions, signals, pages] = await Promise.all([
    seoProvider.getRankSeries(),
    seoProvider.getImpressionSeries(),
    seoProvider.getAiVisibility(),
    seoProvider.getTrackedPages(),
  ]);
  const win = ranks.slice(-days);
  const prior = ranks.slice(-days * 2, -days);
  const avg = (xs: { rank: number }[]) => (xs.length ? xs.reduce((a, p) => a + p.rank, 0) / xs.length : 0);
  const avgRank = Math.round(avg(win) * 10) / 10;
  const rankDelta = prior.length ? Math.round((avg(prior) - avgRank) * 10) / 10 : 0;
  const impr = impressions.slice(-days);
  const totalImpr = impr.reduce((a, p) => a + p.impressions, 0);
  const totalClicks = impr.reduce((a, p) => a + p.clicks, 0);
  const ctr = totalImpr ? Math.round((totalClicks / totalImpr) * 1000) / 10 : 0;
  const aiMentions = signals.reduce((a, s) => a + s.mentions, 0);
  const avgShareOfVoice = signals.length ? Math.round(signals.reduce((a, s) => a + s.shareOfVoice, 0) / signals.length) : 0;
  const topMovers = [...pages]
    .map((p) => ({ id: p.id, title: p.title, path: p.path, rankDelta: p.prevRank - p.currentRank }))
    .sort((a, b) => Math.abs(b.rankDelta) - Math.abs(a.rankDelta))
    .slice(0, 5);
  return { range, days, avgRank, rankDelta, impressions: totalImpr, clicks: totalClicks, ctr, aiMentions, avgShareOfVoice, trackedPages: pages.length, topMovers, source: "heuristic" };
}

// Demo-mode fallback for the brand auto-analysis (Vercel mock deployment has no live API).
// Derived from the mock Brand Memory so the Scorecard + Competitors view look coherent.
async function competitorAnalysisDemo(): Promise<CompetitorAnalysis> {
  const brand = await brandSource.getBrandProfile();
  const domain = (brand.domain || "example.com").toLowerCase();
  const rivals = (brand.competitors?.length ? brand.competitors : ["amplitude.com", "mixpanel.com", "heap.io"]).slice(0, 4);
  const kws = (brand.keywords?.length ? brand.keywords : brand.topics?.length ? brand.topics : ["product analytics", "cohort retention", "customer data platform", "session replay", "funnel analysis"]).slice(0, 6);
  const competitors = rivals.map((d, i) => ({
    domain: d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, ""),
    appearances: Math.max(1, kws.length - i),
    avgPosition: 2 + i,
    overlapKeywords: kws.slice(0, Math.max(1, kws.length - i)),
    visibilityScore: Math.max(8, 62 - i * 14),
  }));
  const gaps = kws.slice(0, 6).map((keyword, i) => ({
    keyword,
    volume: 2400 - i * 320,
    difficulty: 42 + i * 6,
    intent: (i % 2 ? "commercial" : "comparison") as CompetitorAnalysis["gaps"][number]["intent"],
    yourRank: null,
    topCompetitor: competitors[i % competitors.length]?.domain ?? rivals[0],
    competitorRank: 1 + (i % 3),
  }));
  return { domain, keywords: kws, competitors, gaps, yourVisibility: 28, source: "heuristic", generatedAt: new Date().toISOString() };
}

async function brandAnalysisDemo(): Promise<BrandAnalysis> {
  const competitor = await competitorAnalysisDemo();
  const lead = competitor.competitors[0]?.domain ?? "a competitor";
  return {
    domain: competitor.domain,
    scorecard: {
      score: 64,
      grade: "B",
      status: "mixed",
      strengths: [
        { kind: "strength", title: "Conversion-ready homepage", detail: "72/100 — 5 of 7 conversion checks pass." },
        { kind: "strength", title: "Clear value proposition", detail: "Your positioning is well-defined in Brand Memory." },
      ],
      weaknesses: [
        { kind: "weakness", title: "Low search visibility", detail: `${lead} outranks you on your own topics.`, severity: "high" },
        { kind: "weakness", title: `${competitor.gaps.length} keyword gaps`, detail: "Competitors rank for buyer-intent keywords where you don't appear.", severity: "medium" },
      ],
      actions: [
        { kind: "action", title: `Win "${competitor.gaps[0]?.keyword ?? "your top keyword"}"`, detail: `${lead} ranks and you don't — high-intent and winnable.`, severity: "medium" },
        { kind: "action", title: "Complete your Brand Memory", detail: "Add audience, differentiators, and competitors so generated pages stay on-brand.", severity: "medium" },
        { kind: "action", title: `Publish a page for "${competitor.gaps[1]?.keyword ?? "a target keyword"}"`, detail: "Buyer-intent keyword with no page yet.", severity: "low" },
      ],
    },
    competitor,
    auditScore: 72,
    auditGrade: "B",
    topKeywords: competitor.gaps.slice(0, 6).map((g) => ({ keyword: g.keyword, volume: g.volume, difficulty: g.difficulty })),
    source: `${competitor.source} + autocomplete`,
    status: "ready",
    generatedAt: new Date().toISOString(),
  };
}

export const api = {
  // dashboard / authority hq
  getKpis: () =>
    get<KpiMetric[]>("/dashboard/kpis", () => seoProvider.getKpis()).then(
      (d) => (Array.isArray(d) ? d : (d as { kpis: KpiMetric[] }).kpis),
    ),
  getDomainHealth: () => get<DomainHealth>("/performance/domain-health", () => seoProvider.getDomainHealth()),
  getAuthorityOverview: () => get<AuthorityOverview>("/overview/authority", authorityOverviewFallback),
  getSolutionReadiness: () =>
    get<{ solutions: SolutionReadiness[] }>("/solutions/readiness", () => ({ solutions: [] })).then((d) => d.solutions),

  // brand auto-analysis (scorecard + competitor intelligence)
  getBrandAnalysis: () =>
    get<{ analysis: BrandAnalysis }>("/brand-analysis", async () => ({ analysis: await brandAnalysisDemo() })).then((d) => d.analysis),
  runBrandAnalysis: () =>
    send<{ analysis: BrandAnalysis }>("POST", "/brand-analysis/run").then((d) => d.analysis),
  getCompetitorAnalysis: () =>
    get<{ competitor: CompetitorAnalysis }>("/brand-analysis/competitors", async () => ({ competitor: await competitorAnalysisDemo() })).then((d) => d.competitor),

  // AI Search engine (mentions + bot crawl tracking)
  getAiSearchOverview: () =>
    get<AiSearchOverview>("/ai-search/overview", () => ({
      activePages: 0, aiMentions: 0, botCrawls: 0, pagesIndexed: 0, qualifiedLeads: 0, authorityLinks: 0, byEngine: [], byBot: [],
    })),
  getAiMentions: () =>
    get<{ mentions: AiMention[] }>("/ai-search/mentions", () => ({ mentions: [] })).then((d) => d.mentions),
  checkAiMentions: (query: string) =>
    send<{ recorded: AiMention[]; live: boolean }>("POST", "/ai-search/mentions/check", { query }),
  recordAiMention: (engine: AiMentionEngine, query: string) =>
    send<{ mention: AiMention }>("POST", "/ai-search/mentions", { engine, query }).then((d) => d.mention),
  getAiBotActivity: () =>
    get<{ hits: AiBotHit[]; byBot: { bot: string; hits: number }[] }>("/ai-search/bot-activity", () => ({ hits: [], byBot: [] })),
  /** Fire-and-forget AI-crawler hit (public; server no-ops for non-bot agents). */
  recordBotHit: (slug: string, userAgent: string) =>
    send<{ recorded: boolean; bot?: string }>("POST", "/public/ai-bot-hit", { slug, userAgent }),

  // onboarding journey
  getOnboardingStatus: () =>
    get<{ onboarding: OnboardingStatus }>("/onboarding/status", () => ({
      onboarding: {
        completed: false,
        requestedIntegrations: [],
        steps: { websiteScanned: false, brandSaved: false, themeScanned: false, publishingConfigured: false, opportunitiesSeeded: false },
      },
    })).then((d) => d.onboarding),
  completeOnboarding: (body: {
    workspaceName: string;
    domain: string;
    websiteUrl?: string;
    requestedIntegrations?: string[];
  }) => send<{ onboarding: OnboardingStatus; settings: WorkspaceSettings }>("POST", "/onboarding/complete", body),
  getBacklinks: () =>
    get<{ backlinks: Backlink[] }>("/backlinks", async () => ({ backlinks: await seoProvider.getBacklinks() })).then((d) => d.backlinks),
  getActivity: () =>
    get<{ activity: ActivityEvent[] }>("/activity", async () => ({ activity: await seoProvider.getActivity() })).then((d) => d.activity),

  // alerts
  getAlerts: () =>
    get<{ alerts: Alert[] }>("/alerts", async () => ({ alerts: await seoProvider.getAlerts() })).then((d) => d.alerts),
  markAlertRead: (id: string) => send<{ id: string; read: boolean }>("PATCH", `/alerts/${id}`, { read: true }),
  markAllAlertsRead: async (ids: string[]) => {
    await send<{ ids: string[]; read: boolean }>("POST", "/alerts/mark-all-read", { ids });
  },
  resolveAlert: (id: string) =>
    send<{ id: string; read: boolean; resolved: boolean }>("POST", `/alerts/${id}/resolve`),
  snoozeAlert: (id: string, until?: string) =>
    send<{ id: string; snoozedUntil: string }>("POST", `/alerts/${encodeURIComponent(id)}/snooze`, { until }),
  getAlertThresholds: () =>
    get<{ thresholds: AlertThresholds }>("/alerts/thresholds", () => ({
      thresholds: { rankDrop: 5, trafficDrop: 8, brokenBacklinks: true, aiVisibilityDrop: 10 },
    })).then((d) => d.thresholds),
  updateAlertThresholds: (thresholds: Partial<AlertThresholds>) =>
    send<{ thresholds: AlertThresholds }>("PUT", "/alerts/thresholds", thresholds).then((d) => d.thresholds),

  // jobs
  getJobs: () => get<{ jobs: JobRun[] }>("/jobs", () => ({ jobs: [] })).then((d) => d.jobs),
  getJob: (id: string) => get<JobRun>(`/jobs/${encodeURIComponent(id)}`, () => {
    throw new Error(`Job ${id} unavailable`);
  }),
  startJob: (type: JobType, description?: string) =>
    send<JobRun>("POST", "/jobs", { type, description }),
  retryJob: (id: string) => send<JobRun>("POST", `/jobs/${encodeURIComponent(id)}/retry`),
  cancelJob: (id: string) => send<JobRun>("POST", `/jobs/${encodeURIComponent(id)}/cancel`),

  // audit log (core workflows — PRD §10)
  getAuditLog: (limit = 100) =>
    get<{ audit: AuditEntry[] }>(`/audit/log?limit=${limit}`, () => ({ audit: [] })).then((d) => d.audit),

  // site theme profiles (Page Engine theme matching — PRD §7)
  getSiteThemes: () =>
    get<{ profiles: SiteThemeProfile[] }>("/site-theme", () => ({ profiles: [] })).then((d) => d.profiles),
  scanSiteTheme: (url: string) =>
    send<{ profile: SiteThemeProfile; job: JobRun }>("POST", "/site-theme/scan", { url }),
  updateSiteTheme: (id: string, patch: Partial<SiteThemeProfile>) =>
    send<{ profile: SiteThemeProfile }>("PUT", `/site-theme/${encodeURIComponent(id)}`, patch).then((d) => d.profile),
  confirmSiteTheme: (id: string) =>
    send<{ profile: SiteThemeProfile }>("POST", `/site-theme/${encodeURIComponent(id)}/confirm`).then((d) => d.profile),
  getThemeFidelity: (id?: string) =>
    get<{ themeId: string | null; fidelity: ThemeFidelity }>(
      id ? `/site-theme/${encodeURIComponent(id)}/fidelity` : "/site-theme/fidelity",
      () => ({
        themeId: null,
        fidelity: {
          score: 0,
          grade: "needs-review" as const,
          breakdown: [],
          blockers: ["No site theme profile yet."],
          recommendedAction: "Run a site-theme scan and confirm it.",
        },
      }),
    ),

  // global search (PRD — Best-in-Class Global Search)
  search: (q: string, opts?: { type?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams({ q });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    // Empty fallback (never the mock) — search degrades to "no results", not a crash.
    return get<SearchResponse>(`/search?${params.toString()}`, () => ({
      results: [],
      total: 0,
      facets: [],
      suggestions: [],
    }));
  },

  // opportunities
  getProspects: () =>
    get<{ opportunities: BacklinkProspect[] }>("/backlink/opportunities?limit=100", async () => ({
      opportunities: await seoProvider.getProspects(),
    })).then((d) => d.opportunities),
  getArchivedProspects: () =>
    get<{ opportunities: BacklinkProspect[] }>("/backlink/opportunities/archived", () => ({ opportunities: [] })).then(
      (d) => d.opportunities,
    ),
  discoverProspect: () =>
    send<{ opportunity: BacklinkProspect; job: JobRun }>("POST", "/backlink/opportunities/discover"),
  updateProspect: (id: string, update: ProspectUpdate) =>
    send<{ opportunity: BacklinkProspect }>(
      "PATCH",
      `/backlink/opportunities/${encodeURIComponent(id)}`,
      update,
    ).then((d) => d.opportunity),
  archiveProspect: (id: string) =>
    send<{ id: string; archived: boolean }>(
      "DELETE",
      `/backlink/opportunities/${encodeURIComponent(id)}`,
    ),
  restoreProspect: (id: string) =>
    send<{ opportunity: { id: string; archived: boolean } }>(
      "POST",
      `/backlink/opportunities/${encodeURIComponent(id)}/restore`,
    ).then((d) => d.opportunity),
  bulkProspects: (ids: string[], action: "archive" | "restore" | "status", status?: BacklinkProspect["status"]) =>
    send<{ updated: string[] }>("POST", "/backlink/opportunities/bulk", { ids, action, status }),
  getBrandProfile: () =>
    get<BrandMemory>("/brand-profile", async () => ({
      profile: await brandSource.getBrandProfile(),
      completeness: 100,
      context: "",
    })).then((d) => d.profile),

  // brand memory (S6)
  getBrandMemory: () =>
    get<BrandMemory>("/brand-profile", async () => ({
      profile: await brandSource.getBrandProfile(),
      completeness: 100,
      context: "",
    })),
  getBrandVersions: () =>
    get<{ versions: BrandMemoryVersion[] }>("/brand-profile/versions", () => ({ versions: [] })).then(
      (d) => d.versions,
    ),
  updateBrandMemory: (profile: BrandProfile, note?: string) =>
    send<{ version: BrandMemoryVersion; completeness: number; context: string }>(
      "PUT",
      "/brand-profile",
      { ...profile, note },
    ),
  revertBrandVersion: (versionId: string) =>
    send<{ version: BrandMemoryVersion; completeness: number }>(
      "POST",
      `/brand-profile/revert/${encodeURIComponent(versionId)}`,
    ),

  // performance
  getRankSeries: () =>
    get<{ series: RankPoint[] }>("/performance/rank-series", async () => ({ series: await seoProvider.getRankSeries() })).then((d) => d.series),
  getImpressionSeries: () =>
    get<{ series: ImpressionPoint[] }>("/performance/impression-series", async () => ({ series: await seoProvider.getImpressionSeries() })).then((d) => d.series),
  getAiVisibility: () =>
    // No-Dummy-Data §7.6: AI-citation counts must be real. When the live API is
    // unreachable, return an empty set (UI shows an honest empty state) rather than
    // the fabricated mock sample. Real numbers come from recorded checks server-side.
    get<{ signals: AiVisibilitySignal[] }>("/performance/ai-visibility", async () => ({ signals: [] as AiVisibilitySignal[] })).then((d) => d.signals),
  getTrackedPages: () =>
    get<{ pages: TrackedPage[] }>("/performance/pages?limit=100", async () => ({ pages: await seoProvider.getTrackedPages() })).then((d) => d.pages),
  getPerformanceOverview: (range = "8w") =>
    get<PerformanceOverview>(
      `/performance/overview?range=${encodeURIComponent(range)}`,
      () => performanceOverviewFallback(range),
    ),
  // Google Search Console seam (real rankings when GSC creds configured)
  getGscStatus: () =>
    get<{ configured: boolean; siteUrl?: string }>("/gsc/status", () => ({ configured: false })),
  getGscSearchAnalytics: (range = "30d", dimension: "date" | "query" | "page" = "date") =>
    get<{ configured: boolean; dimension: string; range: string; rows: { key: string; clicks: number; impressions: number; ctr: number; position: number }[] }>(
      `/gsc/search-analytics?range=${encodeURIComponent(range)}&dimension=${dimension}`,
      () => ({ configured: false, dimension, range, rows: [] }),
    ),

  // content optimization
  getInternalLinkSuggestions: () =>
    get<{ suggestions: InternalLinkSuggestion[] }>("/content/internal-links", () => ({ suggestions: [] })).then(
      (d) => d.suggestions,
    ),
  rescanContent: () =>
    send<{ scanCount: number; scannedAt: string; job: JobRun }>("POST", "/content/rescan"),
  refreshContent: (action: ContentRefreshAction) =>
    send<{ queued: string[]; refreshed: string[]; job: JobRun }>(
      "POST",
      "/content/refresh",
      { pageIds: action.pageIds, mode: action.mode },
    ),
  applyInternalLinks: (ids: string[]) =>
    send<{ applied: string[]; job: JobRun }>("POST", "/content/internal-links/apply", { ids }),

  // outreach (client-side, via proxy)
  getOutreachTemplates: (prospectId: string) =>
    get<{ templates: OutreachTemplate[] }>(`/outreach/templates?prospectId=${encodeURIComponent(prospectId)}`, async () => {
      const prospects = await seoProvider.getProspects();
      const prospect = prospects.find((p) => p.id === prospectId) ?? prospects[0];
      const brand = await brandSource.getBrandProfile();
      return { templates: await outreachDrafter.draft(prospect, brand) };
    }).then((d) => d.templates),
  updateOutreachTemplate: (id: string, draft: { subject?: string; body?: string }) =>
    send<{ id: string; subject?: string; body?: string }>(
      "PUT",
      `/outreach/templates/${encodeURIComponent(id)}`,
      draft,
    ),

  // settings
  getSettings: () =>
    get<{ settings: WorkspaceSettings }>("/settings", () => ({ settings: fallbackSettings })).then((d) => d.settings),
  updateSettings: (settings: Partial<WorkspaceSettings>) =>
    send<{ settings: WorkspaceSettings; job: JobRun }>("PUT", "/settings", settings),
  updateIntegration: (id: string, update: Partial<WorkspaceSettings["integrations"][number]>) =>
    send<{ integration: WorkspaceSettings["integrations"][number]; job: JobRun }>(
      "PATCH",
      `/settings/integrations/${encodeURIComponent(id)}`,
      update,
    ),
  addTeamMember: (member: Omit<WorkspaceSettings["team"][number], "id">) =>
    send<{ member: WorkspaceSettings["team"][number]; settings: WorkspaceSettings }>("POST", "/settings/team", member),
  updateTeamMember: (id: string, patch: Partial<Omit<WorkspaceSettings["team"][number], "id">>) =>
    send<{ member: WorkspaceSettings["team"][number]; settings: WorkspaceSettings }>(
      "PATCH",
      `/settings/team/${encodeURIComponent(id)}`,
      patch,
    ),
  removeTeamMember: (id: string) =>
    send<{ id: string; removed: boolean; settings: WorkspaceSettings }>(
      "DELETE",
      `/settings/team/${encodeURIComponent(id)}`,
    ),
};
