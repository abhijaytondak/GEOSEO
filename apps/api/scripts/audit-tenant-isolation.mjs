#!/usr/bin/env node
/**
 * Tenant-isolation audit (Multi-Tenancy / P0-6 regression guard — docs/MULTI-TENANCY.md §15).
 *
 * Proves the per-tenant stores don't leak across workspaces: it mutates data under a
 * throwaway tenant `iso-alpha` and asserts that (a) `iso-beta` never sees it, and
 * (b) `ws-default` (the demo workspace) is unaffected. Tenants are selected via the
 * `x-workspace-id` header, which the API honors in DEMO mode (and on the trusted s2s
 * path in production) — so run this against a demo-mode API.
 *
 * Run:
 *   cd apps/api && GEOSEO_MODE=demo PORT=4000 pnpm start     # in one shell
 *   node apps/api/scripts/audit-tenant-isolation.mjs         # in another
 *
 * Env: API_BASE (default http://localhost:4000/api/v1). Exits non-zero on any leak — CI-suitable.
 */

const BASE = process.env.API_BASE ?? "http://localhost:4000/api/v1";
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 25_000;
const A = "iso-alpha";
const B = "iso-beta";

let pass = 0;
let fail = 0;
const failures = [];

async function req(method, path, { tenant, body } = {}) {
  const headers = { accept: "application/json", "content-type": "application/json" };
  if (tenant) headers["x-workspace-id"] = tenant;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, ok: res.ok, data: json && json.success ? json.data : undefined, json };
}

function ok(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`\nGEOSEO tenant-isolation audit → ${BASE}\n`);
  const stamp = Date.now();

  // 1. Opportunities (page-engine) ------------------------------------------------
  const oppKw = `iso-alpha-kw-${stamp}`;
  await req("POST", "/opportunities/discover", { tenant: A, body: { seeds: [oppKw] } });
  const oppsA = (await req("GET", "/opportunities", { tenant: A })).data?.opportunities ?? [];
  const oppsB = (await req("GET", "/opportunities", { tenant: B })).data?.opportunities ?? [];
  const oppsDefault = (await req("GET", "/opportunities")).data?.opportunities ?? [];
  ok("page-engine: alpha sees its new opportunity", oppsA.some((o) => o.query === oppKw));
  ok("page-engine: beta does NOT see alpha's opportunity", !oppsB.some((o) => o.query === oppKw));
  ok("page-engine: ws-default does NOT see alpha's opportunity", !oppsDefault.some((o) => o.query === oppKw));

  // 2. AI mentions → AI-visibility -------------------------------------------------
  await req("POST", "/ai-search/mentions", { tenant: A, body: { engine: "chatgpt", query: `iso-${stamp}` } });
  const visA = (await req("GET", "/performance/ai-visibility", { tenant: A })).data;
  const visB = (await req("GET", "/performance/ai-visibility", { tenant: B })).data;
  ok("ai-mentions: alpha visibility is tracked", visA?.source === "tracked");
  ok("ai-mentions: beta visibility is isolated (none)", visB?.source === "none", `beta source=${visB?.source}`);

  // 3. Brand library ---------------------------------------------------------------
  const prodName = `iso-product-${stamp}`;
  await req("PUT", "/brand-library", { tenant: A, body: { products: [{ name: prodName, description: "x" }], personas: [], proofPoints: [] } });
  const libA = (await req("GET", "/brand-library", { tenant: A })).data?.library;
  const libB = (await req("GET", "/brand-library", { tenant: B })).data?.library;
  ok("brand-library: alpha has its product", (libA?.products ?? []).some((p) => p.name === prodName));
  ok("brand-library: beta does NOT have alpha's product", !(libB?.products ?? []).some((p) => p.name === prodName));

  // 4. Onboarding ------------------------------------------------------------------
  await req("POST", "/onboarding/progress", { tenant: A, body: { workspaceName: `iso-alpha-${stamp}` } });
  const onbA = (await req("GET", "/onboarding/status", { tenant: A })).data?.onboarding;
  const onbB = (await req("GET", "/onboarding/status", { tenant: B })).data?.onboarding;
  ok("onboarding: alpha captured its workspace name", onbA?.workspaceName === `iso-alpha-${stamp}`);
  ok("onboarding: beta does NOT see alpha's name", onbB?.workspaceName !== `iso-alpha-${stamp}`);

  // 5. Lead routing rules ----------------------------------------------------------
  await req("POST", "/lead-routing/rules", {
    tenant: A,
    body: { name: `iso-rule-${stamp}`, field: "score", operator: "gte", value: "80", ownerId: "rep-1", enabled: true },
  });
  const rulesA = (await req("GET", "/lead-routing/rules", { tenant: A })).data?.rules ?? [];
  const rulesB = (await req("GET", "/lead-routing/rules", { tenant: B })).data?.rules ?? [];
  ok("lead-routing: alpha has its rule", rulesA.some((r) => r.name === `iso-rule-${stamp}`));
  ok("lead-routing: beta does NOT have alpha's rule", !rulesB.some((r) => r.name === `iso-rule-${stamp}`));

  // 6. Notification rules ----------------------------------------------------------
  await req("POST", "/lead-notification-rules", { tenant: A, body: { name: `iso-notify-${stamp}` } });
  const nrA = (await req("GET", "/lead-notification-rules", { tenant: A })).data?.rules ?? [];
  const nrB = (await req("GET", "/lead-notification-rules", { tenant: B })).data?.rules ?? [];
  ok("lead-notify: alpha has its rule", nrA.some((r) => r.name === `iso-notify-${stamp}`));
  ok("lead-notify: beta does NOT have alpha's rule", !nrB.some((r) => r.name === `iso-notify-${stamp}`));

  console.log(`\n${pass} passed, ${fail} failed.`);
  if (fail) {
    console.log("\nLeaks / failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("✅ No cross-tenant leakage detected.");
}

main().catch((e) => {
  console.error("audit-tenant-isolation crashed:", e);
  process.exit(1);
});
