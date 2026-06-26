import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * BFF auth proxy for browser → API calls (P0.1/P0.2). Replaces the static
 * next.config rewrite so we can: (a) require a Clerk session for non-public
 * endpoints when GEOSEO_REQUIRE_AUTH=true, and (b) inject the server-only API
 * token (the browser never holds it). The NestJS BearerGuard trusts the token.
 *
 * Mode-driven: the proxy is transparent in demo (open-beta behavior); it requires
 * a Clerk session when GEOSEO_REQUIRE_AUTH=true OR NEXT_PUBLIC_GEOSEO_MODE=production
 * (so production can't silently stay open) — pair with API_AUTH_REQUIRED=true on the
 * API. RSC calls go straight to the API (not here).
 */
export const dynamic = "force-dynamic";
// Allow the handler to wait out a Render free-tier cold-start (~15-60s) instead of erroring.
export const maxDuration = 30;

const API = (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/+$/, "");
const TOKEN = process.env.DEV_API_TOKEN;
const REQUIRE_AUTH =
  process.env.GEOSEO_REQUIRE_AUTH === "true" || (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo") === "production";

/** Public API surface — reachable without a session (feed capture, health, bots). */
function isPublic(path: string): boolean {
  return path === "health" || path.startsWith("public/");
}

/**
 * Default Cache-Control by route class when the upstream sets none (perf audit 2026-06-26):
 * public SEO/feed surfaces are edge-cacheable; health is uncached; every authenticated app
 * route is `private, no-store` so workspace/lead/billing data never lands in a shared CDN.
 */
function cachePolicy(path: string): string {
  if (path === "public/llms.txt" || path === "public/sitemap.xml" || path.startsWith("public/pages")) {
    return "public, s-maxage=300, stale-while-revalidate=3600";
  }
  if (path === "health") return "no-store";
  return "private, no-store";
}

/** Upstream headers worth preserving through the proxy (caching, validators, downloads). */
const PASS_THROUGH_HEADERS = ["content-type", "cache-control", "etag", "last-modified", "vary", "content-disposition"];

function envelope(message: string, status: number): Response {
  return Response.json({ success: false, data: null, errors: [{ code: status, message }] }, { status });
}

async function forward(req: NextRequest, path: string): Promise<Response> {
  // Workspace derived from the VERIFIED Clerk session (never a client header), forwarded
  // to the API as x-workspace-id on the trusted dev-token path so it scopes by tenant (P0-5).
  let workspace: string | undefined;
  let verifiedUserId: string | undefined;
  let verifiedRole: string | undefined;
  if (REQUIRE_AUTH && !isPublic(path)) {
    const { userId, orgId, orgRole } = await auth();
    if (!userId) return envelope("Authentication required", 401);
    workspace = orgId ?? `u-${userId}`;
    verifiedUserId = userId;
    verifiedRole = orgRole ?? undefined; // e.g. "org:admin" — RolesGuard normalizes the prefix
  }

  const reqId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const handlerStart = Date.now();
  const target = `${API}/api/v1/${path}${req.nextUrl.search}`;
  // Accept any content type — public routes return text/plain (llms.txt), application/xml
  // (sitemap), and text/html (reports), not just JSON (perf audit P0).
  const headers: Record<string, string> = { accept: "*/*", "x-request-id": reqId };
  const requestContentType = req.headers.get("content-type");
  if (requestContentType) headers["content-type"] = requestContentType;
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`; // service auth to the API
  // Verified Clerk context, forwarded ONLY on the trusted dev-token path so the API's
  // RolesGuard authorizes by the real org role instead of collapsing every user to viewer
  // (audit 2026-06-24). Derived from the verified session, never from a client header.
  if (workspace) headers["x-workspace-id"] = workspace;
  if (verifiedRole) headers["x-workspace-role"] = verifiedRole;
  if (verifiedUserId) headers["x-workspace-user"] = verifiedUserId;

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  // Render's free tier returns a gateway 502/503/504 (or refuses the connection) while it
  // cold-starts after idle (~15-60s) or during a redeploy. Retry within a time budget so a waking
  // API is absorbed transparently instead of erroring. Read-only calls wait longer (page loads);
  // mutations retry briefly — a gateway 5xx means the request never reached the app, so retry is safe.
  const RETRYABLE = new Set([502, 503, 504]);
  const readOnly = req.method === "GET" || req.method === "HEAD";
  const budgetMs = readOnly ? 22_000 : 6_000;
  const startedAt = Date.now();
  let res: Response | null = null;
  for (let attempt = 0; ; attempt += 1) {
    try {
      res = await fetch(target, { method: req.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(25000) });
      if (!RETRYABLE.has(res.status)) break;
    } catch {
      res = null; // connection failure / timeout (API down or waking) → retry
    }
    if (Date.now() - startedAt >= budgetMs) break;
    await new Promise((r) => setTimeout(r, Math.min(2500, 600 * (attempt + 1))));
  }
  const upstreamMs = Date.now() - startedAt;
  if (!res) return envelope("The API is temporarily unavailable (it may be waking up). Please retry in a moment.", 503);

  // Upstream 5xx is a gateway / cold-start / crash — NEVER echo its body (it can be a huge
  // styled HTML error page). Return a clean, retryable envelope.
  if (res.status >= 500) {
    return envelope("The API is temporarily unavailable (it may be waking up). Please retry in a moment.", res.status);
  }

  // Success or 4xx (JSON envelopes): pass the body THROUGH with its real content-type, so
  // text/plain (llms.txt), application/xml (sitemap), and text/html (report) are no longer
  // turned into 502s (perf audit P0). Stream the body (no full buffer) and preserve useful
  // upstream headers; default a route-class cache policy when the upstream sets none.
  const out = new Headers();
  for (const h of PASS_THROUGH_HEADERS) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("content-type")) out.set("content-type", "application/json");
  if (!out.has("cache-control")) out.set("cache-control", cachePolicy(path));
  out.set("x-request-id", reqId);
  out.set("x-upstream-ms", String(upstreamMs));
  out.set("x-bff-ms", String(Date.now() - handlerStart));
  return new Response(res.body, { status: res.status, headers: out });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, (path ?? []).join("/"));
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
