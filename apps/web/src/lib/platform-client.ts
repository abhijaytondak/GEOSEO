/**
 * Typed client for the production-readiness platform APIs: billing, provider health,
 * and admin diagnostics.
 *
 * Deliberately **mock-free** (No-Dummy-Data PRD): there is NO `@geoseo/mock` import
 * and NO silent fallback. A failed read throws so the calling view renders an honest
 * error/unavailable state instead of fake rows. Same envelope + proxy conventions as
 * page-engine-client.ts.
 */

export type PlanId = "launch" | "grow" | "scale";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export interface PlanEntitlements {
  id: PlanId;
  label: string;
  priceMonthlyUsd: number;
  pagesPerMonth: number;
  leadsPerMonth: number;
  teamSeats: number;
  features: string[];
  stripePriceEnv: string;
}

export interface Subscription {
  workspaceId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  source: "stripe" | "none";
  updatedAt: string;
}

export interface BillingStatus {
  configured: boolean;
  setupRequired: boolean;
  provider: "stripe" | "none";
  subscription: Subscription;
  plan: PlanEntitlements;
  plans: PlanEntitlements[];
  message?: string;
}

export interface ProviderStatus {
  provider: string;
  category: string;
  label: string;
  status: "connected" | "not_configured" | "error" | "disabled";
  lastCheckedAt?: string;
  setupHint?: string;
  message?: string;
  reason?: string;
}

export interface ProviderHealth {
  providers: ProviderStatus[];
  summary: { total: number; connected: number; notConfigured: number; error: number; mode: string };
  checkedAt: string;
}

export interface AdminOverview {
  mode: string;
  db: { configured: boolean; reachable: boolean; error?: string };
  queue: { configured: boolean };
  workspaces: number;
  jobs: {
    total: number;
    running: number;
    failed: number;
    recent: { id: string; type: string; title: string; status: string; createdAt: string; error?: string }[];
  };
  recentAudit: { id: string; action: string; entity: string; at?: string; createdAt?: string }[];
  generatedAt: string;
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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    cache: "no-store",
    headers: { accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  const body = (await res.json()) as { success: boolean; data: T };
  if (!body.success) throw new Error(`API returned success=false for ${path}`);
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

export const platformApi = {
  getBillingStatus: () => get<BillingStatus>("/billing/status"),
  startCheckout: (plan: PlanId) => send<{ url: string | null; setupRequired: boolean; message?: string }>("POST", "/billing/checkout", { plan }),
  openPortal: () => send<{ url: string | null; setupRequired: boolean; message?: string }>("POST", "/billing/portal"),
  getProviderHealth: () => get<ProviderHealth>("/integrations/health"),
  getAdminOverview: () => get<AdminOverview>("/admin/overview"),
};
