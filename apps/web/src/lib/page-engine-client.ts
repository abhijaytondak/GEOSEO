/**
 * Typed client for the Page Engine API (apps/api, v1).
 * Kept separate from api-client.ts to stay collision-free. Same conventions:
 * server calls hit :4000 directly, browser calls hit the /api/v1 proxy, every
 * response unwraps the {success,data,errors} envelope, reads fall back to the
 * bundled mock so the UI never hard-fails.
 */
import { pageEngine } from "@geoseo/mock";
import type {
  AuditEntry,
  BrandProfile,
  GeneratedPage,
  KeywordOpportunity,
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadAssignment,
  LeadFormConfig,
  LeadJourneyEvent,
  LeadJourneyEventType,
  LeadJourneySummary,
  LeadNotification,
  LeadNotificationRule,
  LeadScore,
  LeadStatus,
  PageBlueprint,
  PageEdit,
  PageVersion,
} from "@geoseo/types";

export interface BrandDraft {
  draft: BrandProfile;
  completeness: number;
  context: string;
  source: string;
}

export interface LeadRoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  field: "score" | "company" | "spamStatus" | "pageTitle";
  operator: "gte" | "lte" | "eq" | "contains";
  value: string;
  ownerId: string;
}

export interface RefreshRec {
  pageId: string;
  title: string;
  slug: string;
  ageDays: number;
  failingSeo: number;
  action: "refresh" | "rebuild" | "no-action";
  reason: string;
}

function base(): string {
  if (typeof window === "undefined") {
    return `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1`;
  }
  return "/api/v1";
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined" && process.env.DEV_API_TOKEN) {
    return { authorization: `Bearer ${process.env.DEV_API_TOKEN}` };
  }
  return {};
}

/** Mock fallback is demo-mode only (PRD §4). Production/staging surfaces errors. */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const FALLBACK_ALLOWED = IS_BUILD || (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo").toLowerCase() === "demo";

async function get<T>(path: string, fallback: () => Promise<T> | T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      cache: "no-store",
      headers: { accept: "application/json", ...authHeaders() },
    });
  } catch (err) {
    if (!FALLBACK_ALLOWED) throw err instanceof Error ? err : new Error(`API unreachable for ${path}`);
    return fallback();
  }
  if (res.status >= 400 && res.status < 500) throw new Error(`API ${res.status} for ${path}`);
  if (!res.ok) {
    if (!FALLBACK_ALLOWED) throw new Error(`API ${res.status} for ${path}`);
    return fallback();
  }
  const body = (await res.json()) as { success: boolean; data: T };
  if (!body.success) {
    if (!FALLBACK_ALLOWED) throw new Error(`API returned success=false for ${path}`);
    return fallback();
  }
  return body.data;
}

async function send<T>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as { success: boolean; data: T; errors?: { message: string }[] };
  if (!res.ok || !json.success) throw new Error(json.errors?.[0]?.message ?? `API ${res.status}`);
  return json.data;
}

export const pageEngineApi = {
  getOpportunities: () =>
    get<{ opportunities: KeywordOpportunity[] }>("/opportunities", async () => ({
      opportunities: await pageEngine.getOpportunities(),
    })).then((d) => d.opportunities),
  getBlueprints: () =>
    get<{ blueprints: PageBlueprint[] }>("/page-blueprints", async () => ({
      blueprints: await pageEngine.getBlueprints(),
    })).then((d) => d.blueprints),
  getPages: () =>
    get<{ pages: GeneratedPage[] }>("/pages", async () => ({ pages: await pageEngine.getPages() })).then(
      (d) => d.pages,
    ),
  getLeads: () =>
    get<{ leads: Lead[] }>("/leads", async () => ({ leads: await pageEngine.getLeads() })).then(
      (d) => d.leads,
    ),

  // public surfaces
  getPublishedPages: () =>
    get<{ pages: GeneratedPage[] }>("/public/pages", async () => ({
      pages: (await pageEngine.getPages()).filter((p) => p.status === "published"),
    })).then((d) => d.pages),
  getPublishedBySlug: (slug: string) =>
    get<GeneratedPage | null>(`/public/pages/${slug.replace(/^\//, "")}`, async () => {
      const norm = slug.startsWith("/") ? slug : `/${slug}`;
      return (await pageEngine.getPages()).find((p) => p.slug === norm && p.status === "published") ?? null;
    }),
  captureLead: (input: {
    name?: string;
    email: string;
    company?: string;
    message?: string;
    slug?: string;
    sourceUrl?: string;
    utm?: string;
  }) => send<{ lead: Lead }>("POST", "/public/leads", input).then((d) => d.lead),

  // mutations (no fallback — surface errors)
  discoverOpportunities: (seeds: string[]) =>
    send<{ created: KeywordOpportunity[]; opportunities: KeywordOpportunity[] }>(
      "POST",
      "/opportunities/discover",
      { seeds },
    ),
  generatePage: (opportunityId: string, content?: import("./puter-ai").PuterDraft) =>
    send<GeneratedPage>("POST", "/pages/generate", { opportunityId, content }),
  submitPage: (id: string) => send<GeneratedPage>("POST", `/pages/${id}/submit`),
  approvePage: (id: string) => send<GeneratedPage>("POST", `/pages/${id}/approve`),
  publishPage: (id: string) => send<GeneratedPage>("POST", `/pages/${id}/publish`),
  validatePage: (id: string) =>
    send<{ blockers: string[]; canPublish: boolean }>("POST", `/pages/${id}/validate`),
  getLeadActivity: (id: string) =>
    get<{ activity: LeadActivity[] }>(`/leads/${id}/activity`, () => ({ activity: [] })).then((d) => d.activity),
  addLeadActivity: (id: string, type: LeadActivityType, body: string) =>
    send<{ activity: LeadActivity }>("POST", `/leads/${id}/activity`, { type, body }).then((d) => d.activity),
  getLeadJourney: (id: string) =>
    get<{ events: LeadJourneyEvent[]; summary: LeadJourneySummary }>(`/leads/${id}/journey`, () => ({
      events: [],
      summary: { sessionCount: 0, touchpointCount: 0, topPages: [] },
    })),
  linkLeadVisitor: (id: string, visitorId: string) =>
    send<{ events: LeadJourneyEvent[]; summary: LeadJourneySummary }>("POST", `/leads/${id}/link-visitor`, { visitorId }),
  recordVisitorEvent: (input: {
    anonymousVisitorId: string;
    sessionId: string;
    type: LeadJourneyEventType;
    url: string;
    pageId?: string;
    title?: string;
    referrer?: string;
    durationMs?: number;
    leadId?: string;
  }) => send<{ event: LeadJourneyEvent }>("POST", "/public/events", input).then((d) => d.event),
  assignLead: (id: string, ownerId: string) =>
    send<{ assignment: LeadAssignment }>("POST", `/leads/${id}/assign`, { ownerId }).then((d) => d.assignment),
  bulkAssignLeads: (ids: string[], ownerId: string) =>
    send<{ assignments: LeadAssignment[] }>("POST", "/leads/bulk-assign", { ids, ownerId }).then((d) => d.assignments),
  getLeadWorkload: () =>
    get<{ workload: Record<string, number>; assignments: LeadAssignment[] }>("/leads/assign/workload", () => ({
      workload: {},
      assignments: [],
    })),
  getLeadScore: (id: string) =>
    get<{ score: LeadScore }>(`/leads/${id}/score`, () => ({
      score: { total: 0, fit: 0, intent: 0, engagement: 0, spamRisk: 0, confidence: 0, reasons: [], recommendedAction: "" },
    })).then((d) => d.score),
  recalculateLeadScore: (id: string) =>
    send<{ score: LeadScore }>("POST", `/leads/${id}/recalculate-score`).then((d) => d.score),

  // lead routing rules → auto-assign owners by score/company/spam/page (Lead Conversion)
  getRoutingRules: () =>
    get<{ rules: LeadRoutingRule[] }>("/lead-routing/rules", () => ({ rules: [] })).then((d) => d.rules),
  createRoutingRule: (rule: Omit<LeadRoutingRule, "id">) =>
    send<{ rule: LeadRoutingRule }>("POST", "/lead-routing/rules", rule).then((d) => d.rule),
  updateRoutingRule: (id: string, patch: Partial<Omit<LeadRoutingRule, "id">>) =>
    send<{ rule: LeadRoutingRule }>("PATCH", `/lead-routing/rules/${id}`, patch).then((d) => d.rule),
  deleteRoutingRule: (id: string) => send<{ ok: boolean }>("DELETE", `/lead-routing/rules/${id}`),
  applyRouting: () => send<{ routed: number }>("POST", "/lead-routing/apply").then((d) => d.routed),

  // notification rules + delivery (Gap 5)
  getNotificationRules: () =>
    get<{ rules: LeadNotificationRule[] }>("/lead-notification-rules", () => ({ rules: [] })).then((d) => d.rules),
  createNotificationRule: (rule: Partial<LeadNotificationRule> & { name: string }) =>
    send<{ rule: LeadNotificationRule }>("POST", "/lead-notification-rules", rule).then((d) => d.rule),
  updateNotificationRule: (id: string, patch: Partial<LeadNotificationRule>) =>
    send<{ rule: LeadNotificationRule }>("PATCH", `/lead-notification-rules/${id}`, patch).then((d) => d.rule),
  deleteNotificationRule: (id: string) => send<{ id: string; deleted: boolean }>("DELETE", `/lead-notification-rules/${id}`),
  notifyLead: (id: string) => send<{ delivered: LeadNotification[]; evaluated: number }>("POST", `/leads/${id}/notify`),
  getLeadNotifications: (id: string) =>
    get<{ notifications: LeadNotification[] }>(`/leads/${id}/notifications`, () => ({ notifications: [] })).then((d) => d.notifications),

  // lead form config (Gap 11)
  getLeadForms: () => get<{ forms: LeadFormConfig[] }>("/lead-forms", () => ({ forms: [] })).then((d) => d.forms),
  createLeadForm: (form: Partial<LeadFormConfig> & { name: string }) =>
    send<{ form: LeadFormConfig }>("POST", "/lead-forms", form).then((d) => d.form),
  updateLeadForm: (id: string, patch: Partial<LeadFormConfig>) =>
    send<{ form: LeadFormConfig }>("PATCH", `/lead-forms/${id}`, patch).then((d) => d.form),
  deleteLeadForm: (id: string) => send<{ id: string; deleted: boolean }>("DELETE", `/lead-forms/${id}`),
  approveOpportunity: (id: string) =>
    send<KeywordOpportunity>("POST", `/opportunities/${id}/approve`),
  rejectOpportunity: (id: string) =>
    send<KeywordOpportunity>("POST", `/opportunities/${id}/reject`),
  deferOpportunity: (id: string) =>
    send<KeywordOpportunity>("POST", `/opportunities/${id}/defer`),
  approveBlueprint: (id: string) =>
    send<PageBlueprint>("POST", `/page-blueprints/${id}/approve`),

  // editing + versioning
  updatePage: (id: string, edit: PageEdit) => send<GeneratedPage>("PUT", `/pages/${id}`, edit),
  getPageVersions: (id: string) =>
    get<{ versions: PageVersion[] }>(`/pages/${id}/versions`, () => ({ versions: [] })).then(
      (d) => d.versions,
    ),
  rollbackPage: (id: string, versionId: string) =>
    send<GeneratedPage>("POST", `/pages/${id}/rollback/${versionId}`),

  // leads
  updateLeadStatus: (id: string, status: LeadStatus) =>
    send<Lead>("PUT", `/leads/${id}`, { status }),

  // monitoring
  getRefreshRecommendations: () =>
    get<{ recommendations: RefreshRec[] }>("/recommendations/refresh", () => ({
      recommendations: [],
    })).then((d) => d.recommendations),
  getAudit: () =>
    get<{ audit: AuditEntry[] }>("/audit", () => ({ audit: [] })).then((d) => d.audit),

  // leads ops
  syncLead: (id: string) => send<Lead>("POST", `/leads/${id}/sync`),
  deleteLead: (id: string) => send<{ id: string; deleted: boolean }>("DELETE", `/leads/${id}`),

  // onboarding (brand)
  extractBrand: (url: string) => send<BrandDraft>("POST", "/brand-profile/extract-from-site", { url }),
  saveBrand: (profile: BrandProfile) =>
    send<{ completeness: number }>("PUT", "/brand-profile", profile),
  generateBlueprint: (opportunityId: string) =>
    send<PageBlueprint>("POST", "/page-blueprints", { opportunityId }),
};
