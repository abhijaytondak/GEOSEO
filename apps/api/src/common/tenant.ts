import type { Request } from "express";
import { resolveMode } from "./mode";

/**
 * Multi-tenant resolution (docs/MULTI-TENANCY.md).
 *
 * Production source of truth is the **verified Clerk org** (`req.auth.orgId`, set by
 * BearerGuard). A client-supplied `x-workspace-id` is NOT trusted in production — it is
 * honored only for demo (testing) or for the trusted server-to-server BFF path
 * (`req.auth.trusted`, where the BFF derives the workspace from the user's verified
 * session). This closes the cross-tenant spoofing hole (No-Dummy-Data §6, P0-5).
 */
export const DEFAULT_TENANT_ID = "ws-default";

/** Express request augmented with the resolved tenant + verified auth claims. */
export type TenantRequest = Request & {
  tenantId?: string;
  /**
   * Set by BearerGuard. `trusted` marks the server-to-server BFF (DEV_API_TOKEN) path;
   * `userId`/`orgId`/`role` are verified Clerk claims for direct JWT requests.
   */
  auth?: { userId?: string; orgId?: string; role?: string; trusted?: boolean };
};

/** Normalize an arbitrary id into a safe tenant slug (lowercase, `[a-z0-9_-]`, ≤64). */
export function normalizeTenantId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

function headerTenant(req: TenantRequest): string | null {
  const header = req.headers?.["x-workspace-id"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw === "string") {
    const slug = normalizeTenantId(raw);
    if (slug) return slug;
  }
  return null;
}

/**
 * Resolve the tenant for a request. Precedence:
 *  1. `req.tenantId` if a prior guard (TenantGuard, after BearerGuard) already set it.
 *  2. Verified Clerk org (`req.auth.orgId`) — the production source of truth.
 *  3. Verified Clerk user (`req.auth.userId`) — personal workspace when there's no org.
 *  4. `x-workspace-id` header — ONLY in demo, or on the trusted s2s BFF path; never from
 *     an untrusted production request.
 *  5. `DEFAULT_TENANT_ID`.
 */
export function resolveTenantId(req: TenantRequest): string {
  if (req.tenantId) return req.tenantId;

  const org = req.auth?.orgId;
  if (org) {
    const slug = normalizeTenantId(org);
    if (slug) return slug;
  }

  const user = req.auth?.userId;
  if (user) {
    const slug = normalizeTenantId(`u-${user}`);
    if (slug) return slug;
  }

  // Client-controlled header: trusted only in demo or from the s2s BFF (req.auth.trusted).
  const headerTrusted = resolveMode() === "demo" || req.auth?.trusted === true;
  if (headerTrusted) {
    const slug = headerTenant(req);
    if (slug) return slug;
  }

  return DEFAULT_TENANT_ID;
}
