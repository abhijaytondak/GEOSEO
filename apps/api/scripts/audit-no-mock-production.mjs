#!/usr/bin/env node
/**
 * No-Dummy-Data audit (PRD §15 / Gate A / §6.1).
 *
 * Fails (exit 1) when production runtime code imports `@geoseo/mock`, when the API
 * binds mock DI for production, or when the web clients keep a silent mock fallback.
 * This is the enforcement mechanism the No-Dummy-Data PRD demands — keep it in CI.
 *
 * Usage: node apps/api/scripts/audit-no-mock-production.mjs
 *
 * Files that legitimately reference the mock package (tests, explicit demo-only modules)
 * can be added to ALLOWLIST only after they are isolated behind demo-mode gates per §6.1.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../..", import.meta.url).pathname; // repo root
const SCAN_DIRS = ["apps/web/src", "apps/api/src"];
const NEEDLE = "@geoseo/mock";
// Match real module loads only (import/require), not comments mentioning the package.
const IMPORT_RE = /(?:from\s*|require\(\s*|import\(\s*)["']@geoseo\/mock["']/;

// Files allowed to reference the mock package (must be test-only or demo-isolated, §6.1).
// These are the ONLY production-tree files permitted to import @geoseo/mock: each is a
// demo-isolated module loaded behind a demo-mode gate (web: FALLBACK_ALLOWED; API: dynamic
// import only when resolveMode()==="demo"), so mock is never served/loaded in production.
const ALLOWLIST = [
  "apps/web/src/lib/demo/demo-data.ts",
  "apps/api/src/seo/providers/demo.providers.ts",
  "apps/api/src/modules/demo-seed.ts",
];

function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === "dist") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|mjs|js)$/.test(e)) out.push(p);
  }
  return out;
}

const violations = [];
for (const d of SCAN_DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.includes(rel)) continue;
    const isTest = /\.(test|spec)\.|__tests__|\/scripts\//.test(rel);
    if (isTest) continue;
    const text = readFileSync(file, "utf8");
    if (IMPORT_RE.test(text)) {
      const lines = text.split("\n");
      const hits = lines
        .map((l, i) => (IMPORT_RE.test(l) ? `${i + 1}: ${l.trim()}` : null))
        .filter(Boolean);
      violations.push({ file: rel, hits });
    }
  }
}

console.log("\n=== No-Dummy-Data audit: @geoseo/mock in production runtime ===\n");
if (violations.length === 0) {
  console.log("✅ No production runtime imports of @geoseo/mock found.");
  process.exit(0);
}

for (const v of violations) {
  console.log(`❌ ${v.file}`);
  for (const h of v.hits) console.log(`     ${h}`);
}
console.log(
  `\n${violations.length} file(s) still reference ${NEEDLE} in production runtime.\n` +
    "These are the No-Dummy-Data P0 gaps (see docs/LIVE_API_GAP_REGISTER.md).\n" +
    "Resolve by isolating demo-only code per PRD §6.1, then add to ALLOWLIST or remove.\n",
);
process.exit(1);
