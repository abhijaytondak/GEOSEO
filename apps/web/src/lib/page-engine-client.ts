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

async function get<T>(path: string, fallback: () => Promise<T> | T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      cache: "no-store",
      headers: { accept: "application/json", ...authHeaders() },
    });
  } catch {
    return fallback();
  }
  if (res.status >= 400 && res.status < 500) throw new Error(`API ${res.status} for ${path}`);
  if (!res.ok) return fallback();
  const body = (await res.json()) as { success: boolean; data: T };
  if (!body.success) return fallback();
  return body.data;
}

async function send<T>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
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
