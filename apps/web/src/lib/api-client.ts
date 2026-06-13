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
  Alert,
  Backlink,
  BacklinkProspect,
  BrandMemoryVersion,
  BrandProfile,
  ContentRefreshAction,
  DomainHealth,
  ImpressionPoint,
  InternalLinkSuggestion,
  JobRun,
  JobType,
  KpiMetric,
  OutreachTemplate,
  ProspectUpdate,
  RankPoint,
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

async function get<T>(path: string, fallback: () => Promise<T> | T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      cache: "no-store",
      headers: { accept: "application/json", ...authHeaders() },
    });
  } catch (err) {
    // Network/transport failure → degrade to mock so the UI never hard-fails.
    console.warn(`[api] network error for ${path}, using mock fallback`, err);
    return fallback();
  }

  // Client errors (incl. 401/403/404) are real bugs — surface them rather than
  // masking with believable-but-fake data.
  if (res.status >= 400 && res.status < 500) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  // Server errors (5xx) → degrade to mock.
  if (!res.ok) {
    console.warn(`[api] ${res.status} for ${path}, using mock fallback`);
    return fallback();
  }

  const body = (await res.json()) as { success: boolean; data: T };
  if (!body.success) {
    console.warn(`[api] success=false for ${path}, using mock fallback`);
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
};

export const api = {
  // dashboard / authority hq
  getKpis: () =>
    get<KpiMetric[]>("/dashboard/kpis", () => seoProvider.getKpis()).then(
      (d) => (Array.isArray(d) ? d : (d as { kpis: KpiMetric[] }).kpis),
    ),
  getDomainHealth: () => get<DomainHealth>("/performance/domain-health", () => seoProvider.getDomainHealth()),
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

  // opportunities
  getProspects: () =>
    get<{ opportunities: BacklinkProspect[] }>("/backlink/opportunities?limit=100", async () => ({
      opportunities: await seoProvider.getProspects(),
    })).then((d) => d.opportunities),
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
    get<{ signals: AiVisibilitySignal[] }>("/performance/ai-visibility", async () => ({ signals: await seoProvider.getAiVisibility() })).then((d) => d.signals),
  getTrackedPages: () =>
    get<{ pages: TrackedPage[] }>("/performance/pages?limit=100", async () => ({ pages: await seoProvider.getTrackedPages() })).then((d) => d.pages),

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
  removeTeamMember: (id: string) =>
    send<{ id: string; removed: boolean; settings: WorkspaceSettings }>(
      "DELETE",
      `/settings/team/${encodeURIComponent(id)}`,
    ),
};
