import type { Request } from "express";

/**
 * Multi-tenant groundwork (deferred big-rock — see docs/MULTI-TENANCY.md).
 *
 * Today the product is single-tenant: every store resolves to ONE workspace.
 * This module introduces a request-scoped **tenant id** so the storage layer and
 * services can be migrated to per-tenant data incrementally. Until Clerk org-based
 * auth lands, the tenant resolves from an `x-workspace-id` header (dev/testing) or
 * the default — so behavior is unchanged (everything is `ws-default`).
 */
export const DEFAULT_TENANT_ID = "ws-default";

/** Express request augmented with the resolved tenant (set by TenantGuard). */
export type TenantRequest = Request & {
  tenantId?: string;
  /** Populated by BearerGuard after Clerk JWT verification (verified claims). */
  auth?: { userId?: string; orgId?: string; role?: string };
};

/** Normalize an arbitrary id into a safe tenant slug (lowercase, `[a-z0-9_-]`, ≤64). */
export function normalizeTenantId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

/**
 * Resolve the tenant for a request. Precedence:
 *  1. `req.tenantId` if a prior guard already set it.
 *  2. Clerk org claim (`req.auth.orgId`) — the production source once auth lands.
 *  3. `x-workspace-id` header — dev/testing + service-to-service.
 *  4. `DEFAULT_TENANT_ID`.
 */
export function resolveTenantId(req: TenantRequest): string {
  if (req.tenantId) return req.tenantId;

  const org = req.auth?.orgId;
  if (org) {
    const slug = normalizeTenantId(org);
    if (slug) return slug;
  }

  const header = req.headers?.["x-workspace-id"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw === "string") {
    const slug = normalizeTenantId(raw);
    if (slug) return slug;
  }

  return DEFAULT_TENANT_ID;
}
