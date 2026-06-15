#!/usr/bin/env node
// Deep liveness audit: hit EVERY GET route, resolving path params from live data.
const BASE = "http://localhost:4000/api/v1";
const H = { accept: "application/json", "content-type": "application/json" };

async function get(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: H });
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json };
  } catch (e) {
    return { status: 0, json: null, err: e.message };
  }
}

// pull first id-ish value out of a list payload (handles {pages:[…]}, {leads:[…]} wrappers)
function firstId(data, keys = ["id", "slug", "pageId"]) {
  let arr = Array.isArray(data) ? data : null;
  if (!arr && data && typeof data === "object") {
    arr = Object.values(data).find((v) => Array.isArray(v) && v.length) ?? null;
  }
  if (!Array.isArray(arr) || !arr.length) return null;
  const o = arr[0];
  for (const k of keys) if (o && o[k] != null) return String(o[k]);
  return null;
}

// 1) resolve real ids from list endpoints
const ids = {};
for (const [name, path, keys] of [
  ["opp", "/opportunities", ["id"]],
  ["blueprint", "/page-blueprints", ["id"]],
  ["page", "/pages", ["id"]],
  ["pageSlug", "/pages", ["slug"]],
  ["lead", "/leads", ["id"]],
  ["form", "/lead-forms", ["id"]],
  ["job", "/jobs", ["id"]],
  ["backlink", "/backlink/opportunities", ["id"]],
  ["theme", "/site-theme", ["id"]],
  ["workspace", "/workspaces", ["id"]],
  ["pubPage", "/public/pages", ["slug", "id"]],
]) {
  const { json } = await get(path);
  ids[name] = firstId(json?.data, keys);
}
console.log("Resolved ids:", JSON.stringify(ids));

// 2) GET routes with param substitution
const ROUTES = [
  "/activity", "/backlinks", "/dashboard/kpis",
  "/ai-search/bot-activity", "/ai-search/mentions", "/ai-search/overview",
  "/alerts", "/alerts/thresholds", "/audit", "/audit/log",
  "/backlink/opportunities", "/backlink/opportunities/archived", `/backlink/opportunities/${ids.backlink}`,
  "/brand-analysis", "/brand-analysis/competitors", "/brand-library",
  "/brand-profile", "/brand-profile/versions",
  "/content/internal-links", "/conversion-audit",
  "/gsc/search-analytics", "/gsc/status", "/gsc/top-queries",
  "/health", "/images", "/jobs", `/jobs/${ids.job}`,
  "/lead-forms", `/lead-forms/${ids.form}`, "/lead-notification-rules", "/lead-routing/rules",
  "/leads", `/leads/${ids.lead}`, `/leads/${ids.lead}/activity`, `/leads/${ids.lead}/crm-sync`,
  `/leads/${ids.lead}/followup`, `/leads/${ids.lead}/journey`, `/leads/${ids.lead}/notifications`,
  `/leads/${ids.lead}/score`, "/leads/assign/workload",
  `/monitoring/pages/${ids.page}`, "/onboarding/status",
  "/opportunities", `/opportunities/${ids.opp}`, `/outreach/templates?prospectId=${ids.backlink}`, "/overview/authority",
  "/page-blueprints", `/page-blueprints/${ids.blueprint}`,
  "/pages", `/pages/${ids.page}`, `/pages/${ids.page}/versions`, "/pages/cms/status",
  "/performance/ai-visibility", "/performance/domain-health", "/performance/impression-series",
  "/performance/overview", "/performance/pages", `/performance/pages/${ids.page}`, "/performance/rank-series",
  "/public/pages", `/public/pages/${ids.pubPage ?? ids.pageSlug}`, "/publishing/integrations",
  "/recommendations/refresh", "/search?q=seo", "/settings",
  "/site-theme", `/site-theme/${ids.theme}`, `/site-theme/${ids.theme}/fidelity`, "/site-theme/fidelity",
  "/solutions/readiness", "/tenant/context", "/workspaces", `/workspaces/${ids.workspace}`,
];

let ok = 0, bad = 0, skipped = 0;
const problems = [];
const sources = {};
for (const path of ROUTES) {
  if (/\/(null|undefined)(\/|$|\?)/.test(path)) { skipped++; console.log(`  ⊘ SKIP ${path} (no id resolved)`); continue; }
  const { status, json, err } = await get(path);
  const success = json?.success;
  const src = json?.data?.source;
  if (src) sources[path] = src;
  const good = status >= 200 && status < 300 && success === true;
  if (good) { ok++; }
  else { bad++; problems.push(`${path} → HTTP ${status} success=${success} ${err ?? JSON.stringify(json?.errors ?? "").slice(0,120)}`); }
  console.log(`  ${good ? "✓" : "✗"} GET ${path}  [${status}${src ? " src="+src : ""}]`);
}

console.log(`\n=== GET AUDIT: ${ok} ok, ${bad} failed, ${skipped} skipped (of ${ROUTES.length}) ===`);
if (problems.length) { console.log("\nPROBLEMS:"); problems.forEach(p => console.log("  ✗ " + p)); }
console.log("\nDATA-SOURCE flags (live-vs-mock honesty):");
for (const [p, s] of Object.entries(sources)) console.log(`  ${p}: ${s}`);
