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

const API = (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/+$/, "");
const TOKEN = process.env.DEV_API_TOKEN;
const REQUIRE_AUTH =
  process.env.GEOSEO_REQUIRE_AUTH === "true" || (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo") === "production";

/** Public API surface — reachable without a session (feed capture, health, bots). */
function isPublic(path: string): boolean {
  return path === "health" || path.startsWith("public/");
}

function envelope(message: string, status: number): Response {
  return Response.json({ success: false, data: null, errors: [{ code: status, message }] }, { status });
}

async function forward(req: NextRequest, path: string): Promise<Response> {
  // Workspace derived from the VERIFIED Clerk session (never a client header), forwarded
  // to the API as x-workspace-id on the trusted dev-token path so it scopes by tenant (P0-5).
  let workspace: string | undefined;
  if (REQUIRE_AUTH && !isPublic(path)) {
    const { userId, orgId } = await auth();
    if (!userId) return envelope("Authentication required", 401);
    workspace = orgId ?? `u-${userId}`;
  }

  const target = `${API}/api/v1/${path}${req.nextUrl.search}`;
  const headers: Record<string, string> = { accept: "application/json" };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`; // service auth to the API
  if (workspace) headers["x-workspace-id"] = workspace; // verified tenant (trusted s2s)

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  let res: Response;
  try {
    res = await fetch(target, { method: req.method, headers, body, cache: "no-store" });
  } catch {
    return envelope("Upstream API unreachable", 502);
  }
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, (path ?? []).join("/"));
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
