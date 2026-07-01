/**
 * IndexNow submission — pushes every public URL to IndexNow (Bing, Yandex, and other
 * participating engines) so they crawl/refresh them promptly. Google does NOT use IndexNow;
 * Google discovers via the sitemap + normal crawl (submit the sitemap in Search Console).
 *
 * Run after deploy (the key file must be live at https://citensity.com/<key>.txt):
 *   node apps/web/scripts/indexnow-submit.mjs
 *
 * Reads the published resource slugs from the generated resource-index so it stays in sync
 * with the live library, and includes the core marketing pages.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HOST = "citensity.com";
const KEY = "13ba25a1042452d6a6a73395c4cf93ce";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const here = dirname(fileURLToPath(import.meta.url));

// Pull published resource slugs straight from the generated index (body-free).
const indexSrc = readFileSync(resolve(here, "../src/components/resources/resource-index.ts"), "utf8");
const slugs = [...indexSrc.matchAll(/^\s+"([a-z0-9-]+)":\s*\{ metaDescription:/gm)].map((m) => m[1]);

const marketing = [
  "/",
  "/pricing",
  "/demo",
  "/resources",
  "/platform/brand-memory",
  "/platform/page-engine",
  "/platform/leads",
  "/platform/analytics",
  "/platform/ai-feed",
  "/platform/content-authority",
  "/solutions/ai-search",
  "/solutions/lead-conversion",
  "/solutions/paid-boost",
];

const urlList = [
  ...marketing.map((p) => `https://${HOST}${p}`),
  ...slugs.map((s) => `https://${HOST}/resources/${s}`),
];

console.log(`Submitting ${urlList.length} URLs to IndexNow (host=${HOST})...`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`IndexNow response: HTTP ${res.status} ${res.statusText}`);
const text = await res.text().catch(() => "");
if (text) console.log(text);
// 200 or 202 = accepted. 422 = key/URL mismatch. 403 = key not found at keyLocation.
process.exit(res.ok ? 0 : 1);
