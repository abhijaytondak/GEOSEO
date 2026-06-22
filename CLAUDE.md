# GEOSEO — Project Context (read first)

AI-powered **Backlinking & Continuous SEO / Page-Creation Engine** (Gushwork-class).
Monorepo. This file is the current source of truth for picking up work; deeper detail
in `docs/` (see bottom).

## Stack & layout
- **Monorepo** (pnpm + Turborepo): `apps/web` (Next.js 16, App Router, `src/`, Tailwind/shadcn),
  `apps/api` (NestJS, run via **tsx**), `packages/{types,mock}`.
- **Data:** Supabase Postgres (JSONB `DocStore` per entity) + RLS. **Auth:** Clerk (web).
  **Queue:** BullMQ on Upstash Redis. **LLM:** DeepSeek (content gen) + Puter (browser AI).
- Web data flows through `apps/web/src/lib/api-client.ts` → Next rewrite proxy (`/api/v1/* → :4000`)
  → NestJS. Falls back to `@geoseo/mock` if the API is unreachable.

## How to run (gotchas — follow exactly)
- **API (port 4000):** `cd apps/api && set -a; . ./.env; set +a; PORT=4000 pnpm start`
  — the start script (`tsx src/main.ts`) does **not** auto-load `.env`; you must source it
  or `DATABASE_URL`/`REDIS_URL`/`DEV_API_TOKEN` won't load.
  - ⚠️ Auth is **mode-driven + fail-closed** (`mode.ts`): `GEOSEO_MODE` wins, else `DATABASE_URL`
    implies `production`. In production/staging auth is forced on and you **cannot** disable it —
    `assertModeConfig` aborts boot if `API_AUTH_REQUIRED=false`. The local `.env` therefore sets
    **`GEOSEO_MODE=demo`** (explicit open beta: permissive + persistence on). For production set
    `GEOSEO_MODE=production` + `API_AUTH_REQUIRED=true` + `DEV_API_TOKEN` (the web BFF injects it).
    `bearer.guard.ts` now enforces via `authRequired()`; real Clerk JWT verify still slots in here.
- **Web (port 3001):** `cd apps/web && PORT=3001 pnpm dev` (3000 is often taken).
- **Public preview:** ngrok tunnel → `:3001` (Cloudflare quick-tunnels were flaky here).
- **Vercel deploy (live):** project `geoseo` (team `rajputabhijay1-gmailcoms-projects`), **https://geoseo-tau.vercel.app**.
  Root Directory = `apps/web` (set via API); `apps/web/vercel.json` installs from the monorepo root
  (`cd ../.. && pnpm install`); `.vercelignore` keeps the upload small. Deployed in **demo mode**
  (`NEXT_PUBLIC_GEOSEO_MODE=demo`) → reads use the mock fallback since the NestJS API isn't hosted; **mutations
  won't persist there**. Clerk pk/sk passed as build+runtime env. Redeploy: `vercel deploy --prod --yes` from repo
  root (Clerk keys via `--build-env`/`-e` from `apps/web/.env.local`). For a fully-working deploy, host `apps/api`
  (Railway/Render) and set `API_INTERNAL_URL` on the Vercel project.
- **Live full-stack link (local-backed):** **https://nectar-polo-parameter.ngrok-free.dev** — reserved ngrok tunnel →
  local web `:3001` (which proxies `/api/v1` → local API `:4000`, real Supabase data, production mode). Fully live
  while the local web+API+tunnel run. Ephemeral/machine-bound — use Railway for durable.
- **Durable API host:** `railway.json` (root, Nixpacks, `pnpm --filter @geoseo/api start`, healthcheck `/api/v1/health`)
  is ready. One human step: `railway login`, then set env from `apps/api/.env` + `railway up`, then point Vercel's
  `API_INTERNAL_URL` at the Railway URL. Full steps in **`docs/DEPLOY.md`**.
- **Verify before claiming done:** `tsc --noEmit` in the changed app + a real `curl`/screenshot.
  Restart the API after backend edits (no watch in `pnpm start`).

## Integration state (2026-06-13)
- **Clerk** — wired into `apps/web` (`src/proxy.ts` clerkMiddleware, `<ClerkProvider>` in
  `app/layout.tsx`, auth controls in `components/shell/topbar.tsx`). **Real test-mode keys now
  in `apps/web/.env.local`** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`; gitignored,
  out of keyless mode). Restart the web dev server to pick them up.
  Backend JWT verification in `apps/api/.../bearer.guard.ts` is still a TODO (the API uses the
  static `DEV_API_TOKEN`; `CLERK_SECRET_KEY` is available to wire real verification when desired).
- **Redis/BullMQ** — `REDIS_URL` (Upstash, TLS) in `apps/api/.env`; `queue.service.ts` runs a real
  Worker, `JobsStore` enqueues when active (status `queued`→`running`→`completed`), in-memory
  sim when `REDIS_URL` absent. ⚠️ `ioredis` is **pinned to 5.10.1** to match BullMQ's bundled
  version (don't bump it — causes a TS connection-type clash).
- **Supabase persistence is intentional** (see `docs/DECISIONS.md` — supersedes the old
  "mock-only prototype" framing). RLS auto-enabled on every table via `db.ts` `ensureTable`.
  No `DATABASE_URL` ⇒ pure in-memory; the prototype still runs DB-less.
- **CMS publishing (WordPress + Webflow)** — **seam now wired** (`modules/cms-publish.service.ts`, `CmsPublishStore`,
  `cx_cms_publish`): `POST /pages/:id/publish` pushes to the connected CMS + sets `publishedUrl` to the live URL; unset ⇒
  managed `/feeds` (unchanged). Provider auto-detected from creds (or forced via `CMS_PROVIDER`). **WordPress:**
  `WORDPRESS_BASE_URL` + `WORDPRESS_USERNAME` + `WORDPRESS_APP_PASSWORD` → `/wp-json/wp/v2/posts`. **Webflow:**
  `WEBFLOW_API_TOKEN` + `WEBFLOW_COLLECTION_ID` + `WEBFLOW_SITE_HOST` (+ optional `WEBFLOW_COLLECTION_PATH`,
  `WEBFLOW_CONTENT_FIELD` default `post-body`) → `/v2/collections/:id/items/live`. **Shopify:** `SHOPIFY_STORE_DOMAIN`
  + `SHOPIFY_ACCESS_TOKEN` (+ optional `SHOPIFY_PUBLIC_HOST`, `SHOPIFY_API_VERSION` default `2024-10`,
  `SHOPIFY_ADMIN_BASE_URL`) → Online Store Pages `POST /admin/api/:ver/pages.json`, URL `https://{publicHost}/pages/{handle}`.
  `GET /pages/cms/status` reports provider + recorded pushes. All three verified live (mock) + fallback. HubSpot next (same switch).
- **DataForSEO** (research) — **seam now wired** (`modules/keyword-research.service.ts`, `KeywordResearchService`):
  set `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` (+ optional `DATAFORSEO_BASE_URL`) and `discover()` returns real
  keyword ideas (volume/difficulty/CPC, DataForSEO Labs); unset ⇒ deterministic seed fallback. Verified live against a
  mock server + fallback. **GSC/Analytics** (monitoring) still mock/heuristic — need keys; GSC moot until pages publish
  on an owned domain.

## ▶ Pick up here — current state & handoff (updated 2026-06-17)

> **MULTI-ACCOUNT REPO.** Several Claude Code accounts **and** a Codex agent edit this repo concurrently.
> Read this whole block first, then run `git status` — there is usually uncommitted in-flight work from
> another agent on disk. **Do not commit/clobber files you didn't author.**

### Session 2026-06-17 (latest — work is on branch `nav-workflow-optimization` / PR #1, **NOT merged to `main`**)

**Runtime right now:** API on `:4000` (tsx, `GEOSEO_MODE=demo`, Supabase live), web on `:3001`, public tunnel
`https://nectar-polo-parameter.ngrok-free.dev`. Vercel prod `https://geoseo-tau.vercel.app` (demo/mock mode, open).
PR #1: `https://github.com/abhijaytondak/GEOSEO/pull/1` (clean fast-forward over `main`; merge needs explicit OK —
a direct push to `main` was blocked by policy).

**A. Workflow-first IA refactor** — `docs/PRD-workflow-navigation-optimization.md`, Phases 1–6, committed
`2749643` + `13f2352` on the branch. Sidebar collapsed 17→**6** (Home/Pipeline/Authority/Leads/Analytics/Settings);
command palette keeps every route via `commandDestinations` in `shell/nav-config.ts` (FR8). New: `/pipeline?stage=`
stage board, `/authority?view=` (Competitors+Backlink-Opportunities merged), `/` = **Growth Command Center**,
`/analytics` gained Leads+Authority lenses (`?view=`), Settings **Brand Context** tab (`?tab=`). All old routes still
resolve (non-breaking). Also corrected two stale "Done recently" claims (AI-search readiness is 42% not 29%;
"saved searches" was never built).

**B. Dynamic competitor discovery** — committed `545b603` on the branch. Now works for **any** company, not just
declared competitors: `apps/api/src/llm/competitors.ts` (LLM discovery tier, OpenAI-compatible via the `DEEPSEEK_*`
env, returns `[]` on 402/no-key); `competitor-analysis.service.ts` tier order **Brave → LLM → noise-filtered
DuckDuckGo → heuristic** (added a denylist so keyless SERP stops returning search-engines/wiki/gov/edu/marketplaces);
`brand-analysis.service.ts` passes brand company/industry/valueProp/domain. Frontend `competitor-analysis-view.tsx` +
`puter-ai.ts` prefer **Puter browser-AI** over the noisy non-Brave server tiers — dynamic for any company, **no key**
(user clicks the Puter "Continue" consent once). Authority workspace defaults to **Opportunities** (Competitors is
empty until a Brave key or declared competitors exist).

**C. Growth Plan dashboard** — `components/dashboard/growth-plan.tsx` on Home (+ `outcome-strip.tsx`, `setup-health.tsx`
from Phase 4). Holistic, one-click-actionable hub: "Create N pages" → **Initiate** drafts the top opportunities via
`pageEngineApi.generatePage` (in-loop with progress; appear in Pipeline). **⚠️ UNCOMMITTED — still on disk only.**
This is v1 of the user's onboarding→auto-analysis→actionable-dashboard vision (see "Open product vision" below).

**D. Auth + onboarding** — Clerk enforcement is env-driven (`GEOSEO_REQUIRE_AUTH=true` in `apps/web/.env.local`,
consumed by `proxy.ts`); sign-up routes to `/onboarding` (`NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`). **Currently
flipped OFF locally** (`=false`) so the dashboard is viewable during iteration — flip back to `true` when done.
**Prod auth was reverted**: Clerk **test/dev keys cannot guard a production domain** (`dev-browser-missing` → 404 on
`geoseo-tau`). Enabling prod auth needs a **Clerk production instance** (pk_live/sk_live, domain configured).

**E. Brand profile** is now **Optimist / Air Conditioning** (`optimist.in`) with AC keywords + competitors (was a
stale `SalarySe` seed). Set via `PUT /brand-profile`.

**F. Deploys / infra:** Vercel prod redeployed (demo mode). **Railway is BLOCKED** — `railway init` fails "trial
expired, select a plan" (needs a paid plan). A `DEV_API_TOKEN` was generated into `apps/api/.env` (gitignored) for
when prod auth is wired.

**Blocked / needs the operator (not code):**
- 🔑 **Gemini key** (free tier) to make server-side LLM discovery real without Puter — paste it; the classifier
  blocks harvesting it from the AdSmart project. To wire: set `DEEPSEEK_API_KEY=<gemini>`,
  `DEEPSEEK_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, `DEEPSEEK_MODEL=gemini-2.0-flash`.
- 🔑 **Clerk production keys** → prod auth. 💳 **Railway plan** → durable API host. DataForSEO/Brave/HubSpot/GSC seams still unkeyed.

**⚠️ Codex's concurrent UNCOMMITTED WIP on disk (NOT this account's — leave it; Codex must commit it):**
`apps/api/src/modules/{admin,billing,provider-health}.controller.ts`, `billing.service.ts`,
`common/{observability.ts,request-log.interceptor.ts}`, `app.module.ts` (registers them), and `shell/nav-config.ts`
(Codex added `/billing` + `/admin` palette entries on top of the IA refactor — additive, kept).

**Open product vision (IN PROGRESS, top priority):** the operator wants sign-up → a real onboarding questionnaire
about the business → **auto-run ALL analysis** (competitors, keyword opportunities, leads, backlinks) so the dashboard
is fully populated on first landing → a holistic site summary with **one-click actionable items** ("12 pages
suggested" → Initiate → background generation). Growth Plan (C) is v1; remaining: deeper onboarding capture,
fire-and-complete full analysis on onboarding, and real background job orchestration.

**Coordination:** the IA refactor touched Codex-lane files (`nav-config.ts`, `command-palette.tsx`, `settings-view.tsx`,
`analytics-workspace.tsx`) — all on the branch/PR #1. After PR #1 merges, Codex should rebase its WIP onto it.

### Prior session (2026-06-14)

**Session just completed (this account, all committed + pushed to `main`, see "Done recently"):**
the launch-readiness P0 hardening (auth fail-closed, de-brand, ingestion), the two no-keys Gushwork
"buildable-now" items (Brand Memory→generation, native theme on published pages), and **five env-gated
provider seams** — all verified live (mock) + fallback, all activate with creds, **no code change**:

| Capability | Activate by setting (on the API) | Endpoint / where |
|---|---|---|
| Keyword research | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` (+ `DATAFORSEO_BASE_URL`) | `POST /opportunities/discover` (reports `source`) |
| CMS — WordPress | `WORDPRESS_BASE_URL` + `WORDPRESS_USERNAME` + `WORDPRESS_APP_PASSWORD` | `POST /pages/:id/publish` |
| CMS — Webflow | `WEBFLOW_API_TOKEN` + `WEBFLOW_COLLECTION_ID` + `WEBFLOW_SITE_HOST` | same; `GET /pages/cms/status` |
| CMS — Shopify | `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ACCESS_TOKEN` (+ `SHOPIFY_PUBLIC_HOST`) | same (`CMS_PROVIDER` forces choice) |
| Image generation | `IMAGE_GEN_API_KEY` (+ `IMAGE_GEN_BASE_URL`/`_MODEL`) | `POST /images/generate` |
| Competitor SERP | `BRAVE_SEARCH_API_KEY` (free; else keyless DuckDuckGo, else heuristic) | `POST /brand-analysis/run`, `GET /brand-analysis/competitors` (reports `source`) |

All seams live in `apps/api/src/modules/{keyword-research,cms-publish,image-gen}.service.ts` and follow the
same shape: env-gated, **return null/[] on any failure → safe fallback**, never throw.

**What's left to close the Gushwork gap (none are no-code):**
- 🔑 Provide the keys above (DataForSEO is the single biggest unlock — flips research fake→real).
- 🟢 Wire generated images into the **page model + `/feeds` rendering** (image slots — needs a `GeneratedPage` field; coordinate on the contested type) — buildable now.
- 🔑 More provider seams (same `switch`/pattern): **HubSpot CMS**, **GSC/Analytics** (real perf data — moot until pages publish on an owned domain), real per-engine **AI-citation** tracking.
- 🟢 **Theme fidelity score** in the page list + component-level matching; dark-theme card handling on `/feeds`.

**Lane boundaries (do NOT clobber):**
- The **other account owns auth**: Clerk JWT verify in `bearer.guard.ts` (currently static `DEV_API_TOKEN`) — when it
  lands it sets `req.auth.orgId`, which the tenant layer already consumes. **Multi-tenant isolation groundwork is now
  landed** (tenant context + guard + per-tenant `DocStore` primitive — see `docs/MULTI-TENANCY.md`); the remaining
  per-store migration + RLS-by-tenant + RBAC is incremental and follows the auth landing.
- Tasks **#38** (Authority HQ Phase 2/3 + search analytics) and **#48** (topbar 375px overflow) are the other account's.
- The earlier Global Search / Authority HQ / route-state PRD phases are largely DONE (see "Done recently").

**Biggest non-code unlock:** host `apps/api` on Railway (`railway.json` ready, see `docs/DEPLOY.md`) so the live
Vercel demo runs the real backend (with these seams active) instead of the mock fallback.

## Done recently (don't redo)
- **Brand-Memory gap-closing — batch 2 (2026-06-22; API+web, UNCOMMITTED on disk, api+web tsc clean + web eslint clean + runtime/screenshot-verified; NOT deployed):**
  closed the "Brand Memory grounds page-gen only" gap + made generated pages render the brand's visual identity. **(1) Lead follow-up now uses the RICH Brand Memory** — `lead-followup.service.ts` injects `BrandLibraryStore` + `composeBrandContext(brand, library)` and feeds it into the LLM follow-up prompt ("ground every claim, match tone, never fabricate"); was previously the basic `BrandProfile` (company/valueProp/contact) only. DI verified (boots; BrandLibraryStore already in app.module providers); template-fallback draft verified end-to-end (no LLM key locally → rich path is code/tsc-verified only). **(2) Generated `/feeds` pages now render brand TYPOGRAPHY too** — `feed-theme.ts themeStyle()` now emits `--font-heading` (typography.headingFont ?? bodyFont) + `--brand-accent` (colors.accent) on top of the existing `--brand`/surfaces/body-font/radius; `feeds/[slug]/page.tsx` applies `var(--font-heading, inherit)` to h1 + section/FAQ h2s. **Screenshot-verified**: scanned github theme (primary #0969da, headingFont set to Georgia) → published page rendered with blue logo/badge/hero/CTA + Georgia serif headings (was default-purple + body font). Tone(content) was already wired via composeBrandContext at `page-engine.service.ts:428,880`. **Deliberately SKIPPED outreach** — its drafter is behind the shared `@geoseo/types` `OutreachDrafter` contract + seo-module/Codex lane (changing the signature is contested), and outreach targets external backlink prospects (low brand-grounding value). **Still gated (operator/infra):** rich extraction needs an LLM key (else heuristic = thin library), pgvector semantic recall not built (wholesale top-N injection), Framer/SPA ingestion still thin (no headless render).
- **Platform-support fixes — batch 1 (2026-06-22; API-only, UNCOMMITTED on disk, typecheck clean + runtime-verified on a throwaway in-mem API :4003; NOT deployed — needs merge→main→Render):**
  closed the cheapest/highest-ROI gaps from the cross-platform audit (full audit artifact lives in chat; covers Webflow/Framer/WordPress/Shopify/native). **(1) Generic page EXPORT** — new `GET /pages/:id/export?format=html|md|json|fragment` (`page-engine.controller.ts`) reusing shared renderers; `format=html` returns a self-contained doc (title+meta+JSON-LD+minimal CSS+`<main>`), `md` clean Markdown (Framer-CMS-import + Jamstack), `json` the raw page model, `fragment` bare content HTML. Returns `{format,filename,contentType,content}` (no `@Res`/express typing; web triggers the download — NOT wired client-side yet, the `page-engine-client.ts` is the envelope-lane's WIP so I left it untouched). **This is the unlock for native/hand-coded/static sites** that have no CMS adapter. Verified all 4 formats on `pg-1`. **(2) Richer `renderHtml`** (`cms-publish.service.ts`, now EXPORTED + `renderMarkdown`/`renderStandaloneHtml`): parses blank-line paragraphs + `- `/`1.` lists + `**bold**` into real `<p>/<ul>/<ol>/<strong>` (mirrors web `rich-text.tsx`) and emits the hero `<img>` — so CMS-published pages (WP/Webflow/Shopify) keep list/heading structure instead of flattening to one `<p>`. XSS-safe (escape-then-bold). **(3) SSRF redirect fix** (`common/ssrf.ts` `safeFetchText`): now follows redirects MANUALLY re-validating every hop via `assertSafeUrl` (max 5 hops; unsafe redirect → graceful empty, never throws mid-crawl) — fixes the apex↔www / http→https cliff that returned `crawled:false` and broke Webflow/Framer custom-domain onboarding. Verified: `http://github.com` → followed to `https://github.com/`, crawled true. **(4) Theme scanner broadened** (`site-theme.service.ts`): color regex now captures 3/6/8-digit hex + `rgb()/rgba()` (covers CSS vars + Webflow/Framer values); new `fetchLinkedCss` fetches up to 3 `<link rel=stylesheet>` bundles (SSRF-guarded, byte-capped) so external CSS palettes are seen; conservative `findSurface` reads real html/body/:root bg/fg (unlocks dark themes, else safe light defaults). Verified: github scan now extracts real `#0969da`/`#a0111f` from external CSS (was default-purple before). **NOT done (need design/coordination):** per-tenant CMS credentials + publish-target UI, headless-render ingestion for SPA shells, embeddable tracking tag for customer-hosted analytics, fix Settings fake-toggle (Codex lane), Webflow create-only dedup. **Verify pattern reminder:** kill stale `:4002` first (`lsof -ti:4002|xargs kill -9`) — a prior session's in-mem API served OLD code and 404'd the new route until killed.
- **Honest empty-states / "connect a data source" polish (2026-06-19; web-only, DEPLOYED to geoseo-tau via `vercel deploy --prod`, live-screenshot-verified; typecheck+lint green):**
  finishes the honest-dashboard pass — bare zeros now read as *"not connected"*, not *"failing"*. New reusable
  `components/dashboard/connect-data-prompt.tsx` (dashed-border card: per-metric → integration mapping + CTA to
  `/settings?tab=integrations`). Wired into `analytics-workspace.tsx`: **Overview** shows a "Connect a data source"
  prompt + honest insight headline **only when no metric has real data** (`hasSearchData|hasAiData|hasLeadsData|hasAuthorityData`);
  **Authority** tab shows a "Connect backlink data" prompt when authority is all-zero. `health-gauge.tsx` renders
  **"—" / "NOT MEASURED"** (muted, value-arc omitted) instead of a `0`/grade-D gauge when `score<=0`. Home `page.tsx`:
  insight band says "Domain health isn't measured yet…" when unmeasured, and **fixed a real bug** — `acquiredPct` was
  `0/0 → NaN%` (rendered literal "NaN%" + invalid CSS width) in the empty state; now guarded to 0. ⚠️ The Overview
  prompt is gated on ALL metrics being empty, so it stays hidden while the **AI-visibility heuristic** returns non-zero
  mentions (prod currently shows ~67 — that path is heuristic per the AI-citation note, not a real citation provider);
  the existing "analytics appear once the tracker is connected" note frames the remaining partial zeros. Changes are
  **on disk only (uncommitted)** alongside other lanes' WIP — shipped via the Vercel working-tree deploy, not a git commit.
- **Brand Memory — real site extraction + tone of voice + sidebar entry (2026-06-18; PUSHED to `main` (`d88145e` + image-URL decode fix `1570c86`) + DEPLOYED + live-verified on geoseo-tau.vercel.app):**
  ⚠️ **DEPLOY GOTCHA (cost me a round-trip):** the API (Render) auto-deploys on **git push to `main`**; the web (Vercel) deploys from the **working tree** via `vercel deploy --prod --yes` (a git push does NOT update Vercel). So a backend change needs a push to main; a web change needs a vercel deploy. Both were done + live-verified here.
  the Library tab was showing the dummy **Northwind** seed — now it extracts the customer's *real* brand from their own site.
  **Backend (my-lane, additive):** `apps/api/src/llm/brand-extract.ts` (DeepSeek `extractBrandLibrary` → structured
  products/personas/proof/terminology/voice from on-page copy; returns `null` without `DEEPSEEK_API_KEY` → graceful) +
  `apps/api/src/modules/brand-library.extract.ts` (`crawlBrandDraft`: SSRF-guarded `safeFetchText` → html→text + HTML-entity
  decode → LLM extract **or** conservative heuristic → real images scraped via og:image/twitter:image/apple-touch-icon/`<img>`,
  resolved to absolute http(s)). New endpoint **`POST /brand-library/extract-from-site {url}`** returns a **non-persisted draft**
  for review (user saves via existing `PUT /brand-library`). Extended `BrandLibrary` (`BrandLibraryStore`) with
  **`voice?:{tone,traits,guidance}`** (folded into `composeBrandContext` grounding) + **`images?:string[]`**; updated the store
  sanitizer + `BrandLibrarySchema`. **Frontend** `components/brand/brand-library.tsx`: brand-tinted "Extract from your site" card
  (URL prefilled from brand profile), **Tone of voice** section (preset pills + freeform tone + traits + writing guidance),
  real-image gallery. **Sidebar entry**: Brand Memory under Workspace in `shell/nav-config.ts`. Verified: github.com → real
  product + 12 images (entity-decoded); SSRF localhost → 400; empty url → 400; screenshots of Library tab + extract flow + tone
  section + sidebar. ⚠️ **`DEEPSEEK_API_KEY` empty locally → heuristic path** (real value-prop+tone+images, never fabricated
  products/personas); LLM auto-enriches once keyed. ⚠️ `safeFetchText` `redirect:"manual"` → sites that 301/308 (apex→www,
  http→https) return `crawled:false` (pre-existing, shared with `brand.controller` extract). ⚠️ This commit's `brand-library.tsx`
  imports `@/lib/api-envelope` — an **UNTRACKED** file owned by the in-flight envelope-refactor lane (already imported at HEAD):
  builds on disk, but the commit won't `tsc` standalone until that lane commits `api-envelope.ts`. **Assets tab (`brand-assets.tsx`):**
  additively surfaced the scraped `library.images` as a "From your site" gallery (the dummy placeholder tiles are the AI-gen fallback,
  shown only until `IMAGE_GEN_API_KEY` is set) — left **UNCOMMITTED** (that file is the envelope lane's WIP) but deployed live via the Vercel
  working-tree deploy. Otherwise did **not** touch other-lane WIP (image-gen tenant migration, api-client/page-engine/platform-client envelope refactor).
- **API hardening pass (QA-audit follow-up; typecheck clean + smoke 109/109 + GET sweep 73/73 + live curl + /simplify pass):** closed every
  robustness gap from the deep API audit. **(1) Outbound timeouts** — new `common/http.ts` `fetchWithTimeout(url, init?, ms=12s)`
  is the single source of truth; migrated every seam fetch to it (gsc — incl. the previously-unguarded OAuth token mint —
  cms-publish ×3, competitor-analysis ×2, image-gen, keyword-research ×2, crm-sync, deepseek, conversion-audit, lead-followup).
  Only `ssrf.ts` keeps its own (it already had one). **(2) Input validation** — added `validateBody(v.* schema)` to all 16
  previously-raw write routes (settings ×4, workspaces ×2, page-blueprints/pages/leads-status/publishing-integrations, outreach ×2,
  content ×2, alerts mark-all-read, brand-library); shared schemas in `common/schemas.ts` (enum tuples `satisfies` their
  `@geoseo/types` unions → drift is a compile error), nested `v.shape`+`v.optional` for partial PATCH. **(3) Graceful degradation** —
  `common/async.ts` `settled()` + `degradeLogger()`; `overview/authority`, `performance/overview`, and `search.service.index()`
  now `Promise.allSettled` + per-provider safe fallback (one provider failure degrades, never 500s). **(4)** outreach missing-param
  now `400` not `404`. **(5)** `bearer.guard` uses `timingSafeEqual` over SHA-256 digests (constant-time, no length leak).
  Extended `smoke-live.mjs` +10 (`checkStatus` helper added). Reusable `scripts/audit-get.mjs` (every-GET liveness sweep) left in
  place. Known follow-ups (out of scope, noted by /simplify): `brand.controller` `PUT /brand-profile` still uses a bespoke
  coercing validator (predates this pass) — could move to a schema. **Pushed to `main`.**
- **Brand auto-analysis + free competitor intelligence + dashboard Scorecard (typecheck 4-pkg + web build + smoke 99/99 + live curl + Brave-parse asserts + screenshots):**
  closed the "land on the dashboard and see what's good/bad/improvable for *your* brand" loop. **Backend (additive, never-throws, per-tenant):**
  `CompetitorAnalysisService` (`competitor-analysis.service.ts`) — **100% free tiered SERP chain**: Brave Search API
  (`BRAVE_SEARCH_API_KEY`, free tier, `BRAVE_SEARCH_BASE_URL` override) → **keyless DuckDuckGo HTML** (`COMPETITOR_SERP_DDG_URL`
  override) → **heuristic** (declared `BrandProfile.competitors` + estimates); reports `source: brave|duckduckgo|heuristic`,
  bounded by `COMPETITOR_SERP_KEYWORDS` (default 8), `COMPETITOR_SERP_PROVIDER` forces a tier. `BrandAnalysisStore`
  (`brand-analysis.service.ts`, `cx_brand_analysis`, per-tenant like `ConversionAuditStore`) orchestrates keyword research →
  conversion audit → competitor SERP → pure `computeScorecard()` (strengths/weaknesses/top-3-actions + 0–100 blended score).
  `BrandAnalysisController`: `GET /brand-analysis` (cached or `status:"pending"`, never blocks), `POST /brand-analysis/run`
  (explicit), `GET /brand-analysis/competitors`. **Onboarding `complete()` fires `run()` fire-and-forget** so the dashboard is
  warm. **DOES NOT touch the contested page-engine files** — calls `KeywordResearchService` directly. **Frontend:**
  `components/dashboard/brand-scorecard.tsx` (self-fetching panel on Authority HQ — score ring, strong/weak/actions columns,
  live-vs-Estimated source badge, Re-run, View competitors), new **`/competitors`** route + `competitor-analysis-view.tsx`
  (visibility header, competitor table, keyword-gap table w/ Generate-page CTAs) + **Competitors** nav item (`Swords`), wizard
  "Analyzing your brand…" step. `api.getBrandAnalysis/runBrandAnalysis/getCompetitorAnalysis` + demo-mode fallbacks. New
  `@geoseo/types`: `BrandAnalysis/BrandScorecard/BrandScorecardItem/CompetitorAnalysis/CompetitorEntry/KeywordGap/CompetitorSource`.
  Verified live: DuckDuckGo returned 8 real competitors keyless; mock-Brave proved `source:brave` parsing + your-rank/visibility
  aggregation; smoke +4 checks. **To upgrade competitor data reliability: set free `BRAVE_SEARCH_API_KEY` on the API** (DDG can be
  rate-limited from a datacenter IP; heuristic needs declared competitors). **NOT pushed/deployed — awaiting confirmation.**
- **Dead-clicks / missing-CRUD audit — fixes (Tier 1 + Tier-2 quick wins; typecheck+lint+smoke 95/95):** the visible UI
  had ~0 literal dead clicks; the real gaps were built-but-unreachable capabilities. Fixed: routing-rule **edit**,
  lead-form **delete**, alert **snooze**, lead-score **recalculate** (methods existed, no button); **pre-publish
  validatePage gate** (surfaces blockers); **real visitor journey** (`FeedTracker` fires page_view on `/feeds` +
  `linkLeadVisitor` on capture → journey tab no longer a phantom); **lead owner assignment UI** (drawer select; was
  backend-only); **page unpublish + duplicate** (new backend routes + client + drawer buttons — didn't exist anywhere);
  **image-gen UI** (Brand → Assets tab over `/images/generate`); **team-member role edit** (PATCH /settings/team/:id +
  role select); **prospect restore** (GET /backlink/opportunities/archived + "Archived" toggle with Restore).
  Remaining audit items (lowest-pri, not done): lead-form field editor; surface read-only views for
  audit-log / jobs / CMS publish status / GSC analytics (built, no UI). (Dead-code cleanup is done:
  `syncLead` + `/leads/export` were already removed; `generateBlueprint` is live via `POST /page-blueprints`,
  not dead.)
- **Multi-tenant: `conversion-audit` migrated as the reference per-tenant store (typecheck+smoke 95/95, isolation-verified):**
  `ConversionAuditStore` now keys state by tenant — `cache: Map<tenantId, AuditState>`, lazy `state(tenantId)` via
  `DocStore.loadForTenant`, `commit(tenantId,…)` via `saveForTenant`; `latest(tenantId)`/`run(tenantId,…)` take the tenant
  first. Controller resolves it with `resolveTenantId(@Req())`. Verified isolation: `x-workspace-id: alpha`→example.com,
  `beta`→example.net, default→none — independent state via the same endpoints. This is the **copy-paste pattern** for the
  remaining stores (checklist in `docs/MULTI-TENANCY.md`; do brand-library next — its page-engine consumer passes
  `DEFAULT_TENANT_ID` until page-engine is migrated).
- **Multi-tenant isolation — groundwork (additive, behavior-unchanged; typecheck+smoke 95/95, curl-verified):**
  request-side tenant context is now in place so the per-store migration can proceed incrementally (full plan in
  **`docs/MULTI-TENANCY.md`**). `common/tenant.ts` (`DEFAULT_TENANT_ID="ws-default"`, `resolveTenantId(req)` precedence:
  `req.tenantId` → Clerk `req.auth.orgId` → `x-workspace-id` header → default; `normalizeTenantId`) + **`TenantGuard`**
  (first `APP_GUARD`, attaches `req.tenantId`, always allows). `DocStore` gained additive **`loadForTenant`/`saveForTenant`**
  (+ `tenantRowId`: `ws-default` → the legacy `"state"` row, so **no data migration**; other tenants → `t:<id>` rows in the
  same table). `GET /tenant/context` verifies resolution (default → `ws-default`; `x-workspace-id: Acme Corp!!` → `acmecorp`).
  Everything still resolves to `ws-default` today — zero behavior change. **Next (incremental, per docs):** Clerk sets
  `req.auth.orgId` in `bearer.guard.ts` (other account); thread `tenantId` into services; convert stores to per-tenant maps;
  RLS-by-tenant; RBAC. ⚠️ The DocStore per-tenant rows are DB-path code — verify against the real DB once Supabase resolves.
- **Theme-fidelity badge in the Pages list (PRD §13; finishes the other account's theme-fidelity feature):** the
  fidelity score (`api.getThemeFidelity()` → confirmed-theme `{score, grade, recommendedAction}`) now renders as a chip
  in `pages-view.tsx` header (grade tones: native-fit/acceptable/needs-review), linking to `/theme` — previously it was
  only on the Theme page. Also continued the honesty pass: **Performance page now shows a live-vs-demo data-source badge**
  (`getPerformanceOverview().source`: "Live · Google Search Console" vs "Demo estimate"). Verified typecheck+lint+smoke
  95/95 + screenshots. ⚠️ Supabase DB was DNS-unreachable during this session → API boots **degraded/in-memory** (the
  honesty-pass `/health` correctly reports `persistence:memory, dbReachable:false`); persistence returns when the DB host resolves.
- **Live-hardening "honesty pass" (audit response; typecheck+lint+build green, smoke 95/95, curl+screenshot-verified; committed `a17e18c` + `278662c`, NOT pushed):**
  An audit found the product was *misreporting* its state. Fixed the code-level honesty bugs (real-integration
  activation is still credential-gated — seams unchanged):
  **(1) Honest DB health** — `db.ts` `dbPing()` (real `select 1`); `/health` now reports
  `persistence: postgres|degraded|memory` from the live probe + `dbReachable` (a configured-but-unreachable
  Supabase shows **degraded**, not a false `postgres`). Live-verified during a DNS outage → `degraded`.
  **(2) Settings status = live** — `SettingsController.get()` overlays each seam's real `configured`/`provider`
  getter (CMS/GSC/HubSpot/DataForSEO/image-gen), so Settings can't claim Webflow `connected` when the CMS seam
  is `none`. Added `dataforseo` + `image-generation` rows; seed de-branded (Northwind → "Your Workspace").
  **(3) Leads "Sync to CRM" → real seam** — `leads-view` calls `crmSyncLead` (`/leads/:id/crm-sync`), surfaces
  synced/skipped/failed honestly (no fake optimistic "Synced"; shows "CRM not connected" when unkeyed).
  **(4) Visible "Demo data" banner** — `api-client` runtime fallback dispatches `geoseo:degraded`; new
  `components/system/degraded-banner.tsx` (mounted in `(app)/layout`) shows a persistent banner so mock fallback
  is never silently passed off as live. **(5)** Fixed React "key spread into JSX"/duplicate-key warnings in
  `performance/{rank,traffic}-chart` dot callbacks. **(6) GSC-backed charts** — `/performance/rank-series` +
  `/impression-series` now use real GSC daily data when configured (`source: "gsc"|"heuristic"`), mock fallback
  otherwise. **Still credential-blocked (user providing keys):** activate HubSpot / DataForSEO / CMS / GSC /
  image-gen by setting their env vars in `apps/api/.env` (see the integration table above) — no code change.

- **Branded image/infographic generation seam (PRD §14, key-gated, verified):** `ImageGenStore`
  (`modules/image-gen.service.ts`, `cx_images`) + `ImageGenController` — `POST /images/generate` `{subject, kind?}`
  (kind = hero|infographic|illustration|og) builds a **brand + theme-aware prompt** (company/valueProp/tone + confirmed
  theme primary color) and calls an OpenAI-compatible images API when `IMAGE_GEN_API_KEY` is set (+ optional
  `IMAGE_GEN_BASE_URL`, `IMAGE_GEN_MODEL`); unconfigured ⇒ a **theme-aware SVG placeholder** (customer primary color,
  data URI). `GET /images` lists + reports provider/configured. Verified: unconfigured → placeholder w/ teal theme color +
  Zomato-aware prompt; configured (mock) → source=openai w/ API url. Pending: page-model image slots + /feeds rendering.
- **Shopify CMS adapter (3rd provider on the publishing seam):** `CmsPublishStore` now dispatches WordPress / Webflow /
  **Shopify** by detected creds. Shopify path: `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ACCESS_TOKEN` (+ optional
  `SHOPIFY_PUBLIC_HOST`, `SHOPIFY_API_VERSION`=`2024-10`, `SHOPIFY_ADMIN_BASE_URL` proxy/test override) → Online Store
  Pages `POST /admin/api/:ver/pages.json` (`X-Shopify-Access-Token`), `publishedUrl` = `https://{publicHost}/pages/{handle}`.
  Verified live (mock): provider=shopify, publish → HTTP 201, publishedUrl `https://zomato.com/pages/vs-amplitude`,
  recorded. WordPress/Webflow paths + managed `/feeds` fallback unchanged. Next adapter (same switch): HubSpot.
- **Webflow CMS adapter (extends the publishing seam):** `CmsPublishStore` now dispatches **WordPress or Webflow** by
  detected creds (`CMS_PROVIDER` forces). Webflow path: `WEBFLOW_API_TOKEN` + `WEBFLOW_COLLECTION_ID` + `WEBFLOW_SITE_HOST`
  (+ optional `WEBFLOW_COLLECTION_PATH`, `WEBFLOW_CONTENT_FIELD`=`post-body`, `WEBFLOW_SUMMARY_FIELD`) → POST
  `/v2/collections/:id/items/live` (Bearer), `publishedUrl` = `https://{host}/{path}/{slug}`. Verified live (mock Webflow):
  publish → HTTP 201, publishedUrl `https://zomato.com/guides/cohort-retention-guide`, recorded provider=webflow. WordPress
  path + managed `/feeds` fallback unchanged. Next adapters (same `switch`): Shopify, HubSpot.
- **DataForSEO keyword-research seam (key-gated, verified live + fallback):** `KeywordResearchService`
  (`modules/keyword-research.service.ts`) — `researchKeywords(seeds)` hits **DataForSEO Labs keyword_ideas** (Basic auth
  `DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD`, 15s timeout) when configured, returns `[]` on any failure/unconfigured (never
  throws). `PageEngineStore.discover()` is now async: real ideas → scored opportunities (volume/difficulty/CPC, intent
  heuristic → page type, "Discovered (DataForSEO)"); else the deterministic seed fallback (unchanged). `/opportunities/discover`
  now reports `source: "dataforseo"|"mock"`. **To activate: set `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` (+ optional
  `DATAFORSEO_BASE_URL`) — no code change.** Verified: unconfigured → source=mock + seed fallback intact; configured (mock
  server) → source=dataforseo, 3 ideas mapped to real volumes/difficulty/CPC + comparison-intent detection. This is the
  single biggest AI-Search unlock (flips research from fake→real); same key unblocks competitor tracking + SERP analysis next.
- **Brand Memory → generation + native theme on published pages (Gushwork-gap buildable-now items; typecheck/lint/build green, unit + screenshot verified):**
  **(1)** `composeBrandContext(brand, library)` (pure, exported from `brand-library.service`) folds the structured
  product/persona/proof library into the page-generation grounding hint; `PageEngineStore` now injects `BrandLibraryStore`
  and `brandHint()` delegates to it — so DeepSeek drafts (and the template path) are grounded in real business facts, not
  invented ones. Unit-verified (company+valueProp+audience+products+personas w/ pains/goals+proof; undefined when no company);
  live generate confirmed DI boots. **(2)** Published `/feeds/[slug]` pages now render in the workspace's **confirmed Site
  Theme Profile** — `themeStyle()` maps the theme's colors/border/radius/font onto the design-system CSS vars on the page root,
  so the existing Tailwind classes inherit the customer palette (light-theme-safe set). Screenshot-verified: feed renders with
  the confirmed teal brand accent + radius + de-branded "Zomato"/zomato.com canonical. Readiness notes bumped (Brand Memory
  generation-wiring done; Native theme matching now renders on published pages). Remaining: pgvector recall, component-level
  fidelity score, dark-theme card handling, CMS-published rendering.
- **Launch-readiness P0 hardening (auth + de-brand + ingestion; typecheck/lint/build green, smoke 87/0, curl-verified):**
  Closed the controlled-beta blockers from the audit.
  **(1) API auth mode-driven + fail-closed** — `bearer.guard.ts` enforces via `authRequired()` (not the raw flag);
  `mode.ts` `assertModeConfig` now **aborts boot** if production/staging + `API_AUTH_REQUIRED=false` (auth can't be
  silently disabled). Local `.env` set to `GEOSEO_MODE=demo` (explicit open beta). Verified: prod+auth-off → boot abort;
  prod+token → gated routes 401 w/o token, 200 with, public open.
  **(2) Web auth tied to mode** — `proxy.ts` + the BFF route (`app/api/v1/[...path]/route.ts`) enforce when
  `GEOSEO_REQUIRE_AUTH=true` **OR** `NEXT_PUBLIC_GEOSEO_MODE=production` (so prod can't stay open); the BFF injects the
  server-only `DEV_API_TOKEN`. Committed the previously-uncommitted Clerk auth BFF (sign-in/up pages, route handler).
  **(3) De-brand** — published URLs (`page-engine.service.publishedUrlFor`), `llms.txt`, `sitemap.ts`, topbar (real
  workspace name via async `(app)/layout` → `getSettings`), and the publishing-settings sample all use the workspace's
  own domain (Brand Memory / `PUBLIC_SITE_HOST`), never `northwindlabs.io`. Verified llms.txt → "# Zomato", 0 northwind URLs.
  **(4) Public-ingestion hardening** — `common/public-ingest.ts` (disposable-email block + `refererAllowed` host
  allowlist); lead capture (`/public/leads`) now validates email/caps + honeypot (`website`) + disposable + production
  domain-allowlist; `/public/events` gets the same production referer guard. `WorkspaceSettings.profile.allowedDomains`
  added (empty ⇒ permissive). Verified: bad-email/honeypot/disposable → 400, valid → 201; allowlist logic unit-checked.
  Paid Boost stays absent from nav (readiness = planned). **Deferred (next major milestone): full tenant isolation +
  RBAC** — hardcoded `ws-default` + single-doc stores need workspace-id from the Clerk session threaded into every store
  key; large multi-pass refactor, follow auth landing.
- **Input-validation hardening — nested validator + my write endpoints (typecheck+lint clean, curl negative+positive):**
  added **`v.shape(subSchema)`** to `common/validation.ts` (the previously-missing nested-object validator; composes with
  `v.arrayOf` for typed arrays). Applied `validateBody` to the raw `@Body()` write endpoints I own: `conversion-audit/run`
  (`{url}`), `lead-routing` rule create + PATCH (name/enabled/field-enum/operator-enum/value/ownerId), and `site-theme` PUT
  (nested `colors`/`layout` via `v.shape`, whitelisted patch). Verified: bad enum/missing-field/short-url → 400 with field
  messages; valid → 200/201. ⚠️ **Tenant scoping + RBAC + backend Clerk JWT verify are intentionally NOT done here** — they're
  coupled to the in-flight Clerk auth work (sign-in/sign-up/proxy) and `bearer.guard.ts`; coordinate before building them.
- **Brand Memory — structured product/persona/proof library (typecheck+lint clean, curl + CDP-screenshot-verified):**
  additive `BrandLibraryStore` (`cx_brand_library`, **local types — no `@geoseo/types`/`brand.service` edits**) + `BrandLibraryController`
  (`@Controller("brand-library")`, `GET` + full-replace `PUT`, every field server-sanitized/capped + fallback ids + audit). Frontend:
  new **Library tab** in `brand-workspace.tsx` (`components/brand/brand-library.tsx`, self-contained fetch) — Products & services,
  Buyer personas (pain points + goals as comma lists), and Proof points (typed: stat/testimonial/case-study/award/logo), each with
  add/inline-edit/remove + a dirty-aware Save. `strength()` 0–100 signal exposed. Grounds page/outreach generation in real facts.
  Remaining Brand Memory: **wire the library into content/page generation context** (lives in the contested page-engine files —
  coordinate) + pgvector semantic recall (key/infra-gated).
- **Page Engine Theme PRD — confirmation UI + themed preview (§7.2/§11.3, typecheck+lint clean, CDP-screenshot-verified desktop+mobile):**
  new `/theme` route (`app/(app)/theme/page.tsx`) + `components/theme/theme-settings-view.tsx` (all net-new — consumes the
  existing `api.getSiteThemes/scanSiteTheme/updateSiteTheme/confirmSiteTheme`, **no edits to the contested page-engine files**).
  First-run scan empty state; status + confidence ("Native fit" ≥80) header; **color swatches, typography sample, layout
  tokens**; **Edit tokens** mode (inline color/layout edit → `updateSiteTheme`), **Rescan**, **Accept theme** (`confirmSiteTheme`);
  and a polished **themed preview** (`ThemedPreview`) that renders a full faux landing section — nav/hero/CTAs/feature cards/lead
  form — using the customer's tokens, with a **desktop/tablet/mobile device toggle**. Nav link added under Page Engine (Palette icon).
  AI Search readiness "Native theme matching" note bumped (scan+confirm+preview built; published-page token rendering still pending).
  Remaining theme PRD tail (mostly **contested page-engine files — coordinate**): theme-fidelity score badge in the page list,
  page `preview`/`duplicate`/`unpublish` endpoints, publishing-modes UI.
- **Lead Conversion — AI-SDR follow-up drafts (typecheck+lint clean, curl + CDP-screenshot-verified):**
  `LeadFollowupStore` (`cx_lead_followup`, injects `PageEngineStore`+`BrandMemoryStore`) + `LeadFollowupController`
  (`@Controller("leads")`, `GET/POST /leads/:id/followup`). `generate()` builds a per-lead draft from Brand Memory +
  the lead's page/message context — tries DeepSeek (OpenAI-compatible, 12s abort, `response_format: json_object`),
  falls back to a deterministic personalized `templateDraft` when the LLM is unavailable (402/no key), so it always
  returns a usable draft; drafts persist per-lead. Frontend: new **"Follow-up" tab** in `lead-detail-drawer.tsx`
  (self-contained `fetch` to avoid the shared client) — generate/regenerate, copy, "Open in email" (mailto), and a
  template-fallback indicator; loads any persisted draft on open. Registered additively in `app.module`.
  **Lead Conversion readiness now 83%** (routing rules + follow-up + conversion audit flipped to `built` in
  `solutions.controller.ts`). Remaining Lead Conversion (key-gated): real CRM sync (HubSpot/Salesforce),
  meeting booking (Calendly/cal.com), notification delivery providers (SMTP/Slack).
- **Lead Conversion — routing rules + auto-assign, conversion audit (committed `ab85d5b`):** `LeadRoutingStore`
  (`cx_lead_routing`) + controller `/lead-routing/rules` CRUD + `POST /apply` (first-match field/operator rule →
  owner, assigns unassigned via `LeadAssignmentStore`); `ConversionAuditStore` (`cx_conversion_audit`, SSRF-guarded)
  + `/conversion-audit` + `/conversion-audit/run` → score/grade + 7 findings w/ fixes. Frontend: `/conversion-audit`
  page + nav link, routing-rules panel on `/leads`.
- **AI Search engine — mentions + bot tracking + workspace (smoke 85/85 + screenshot-verified):** `AiMentionStore`
  (`cx_ai_mentions`) + `AiBotActivityStore` (`cx_ai_bots`) + `AiSearchController` (`@Controller("ai-search")`):
  `GET/POST /ai-search/mentions`, `POST /ai-search/mentions/check` (heuristic from AI-visibility signals — real
  per-engine provider activates with a key), `GET/POST /ai-search/bot-activity` (+ `AiBotActivityStore.classify(ua)`
  for GPTBot/PerplexityBot/ClaudeBot/Google-Extended), `GET /ai-search/overview` (active pages, mentions, bot crawls,
  qualified leads, authority links). Types `AiMention`/`AiBotHit`/`AiSearchOverview`. Frontend `/ai-search` workspace
  (`ai-search-view.tsx`, beta banner + KPI strip + mention check + bot panel) + **AI Search nav link** (Bot icon).
  Solutions readiness bumped. **Auto bot-capture on `/feeds` DONE:** public `POST /public/ai-bot-hit` (classifies UA,
  no-ops humans) + the `/feeds/[slug]` server reads `user-agent` via `next/headers` and fires it for crawler agents
  (bot analytics → built). Remaining AI Search (key-blocked): real research (DataForSEO), live per-engine citation provider.
- **Leads PRD — lead config UIs (frontend, typecheck+lint clean):** `lead-config-actions.tsx` in the Leads page
  header — **Notification rules** sheet (create/toggle/delete rules w/ score+channels) + **Lead forms** sheet
  (list/edit CTA/thank-you/consent, create) — both wired to the new APIs. Added as a new component (leads-view untouched).
- **Leads PRD — notification rules + lead-form config (Gap 5 & 11, smoke 79/79):** `LeadNotificationStore`
  (`cx_lead_notify`): rules CRUD at **`/lead-notification-rules`** (separate base — `/leads/notification-rules`
  would collide with `/leads/:id`) + `POST /leads/:id/notify` (evaluates enabled rules vs lead score/status/page →
  records deliveries; email/Slack/webhook channels are logged as in-app until providers connect) + `GET
  /leads/:id/notifications`. `LeadFormStore` (`cx_lead_forms`, seeded default form): CRUD at `/lead-forms` +
  `/lead-forms/:id/preview`. Types: `LeadNotificationRule`/`LeadNotification`/`LeadFormConfig`. Client methods on
  `pageEngineApi` (`send` now allows PATCH). Audit `"notification"` action added. Solutions readiness bumped
  (Lead Conversion: form config built, notifications partial). Remaining Leads: routing rules, real CRM sync jobs.
- **Self-serve onboarding journey — live, no-mock (smoke 66/66 + screenshot-verified live crawl):** `OnboardingStore`
  (`cx_onboarding`) + `OnboardingController`: `GET /onboarding/status`, `POST /onboarding/progress`, `POST
  /onboarding/complete` (persists the company's **real workspace identity** to `settings.profile` — replaces seed
  Northwind identity — marks requested integrations `needs-attention`, sets onboarded + audit). `OnboardingStatus`
  type; `api.getOnboardingStatus/completeOnboarding`. Wizard (`onboarding-wizard.tsx`) now: real site crawl
  (`extractBrand`) + **theme scan** (`scanSiteTheme`, swatches shown) in step 0; **access/integrations capture**
  (GSC/CMS/CRM) in the publishing step; **Finish setup** calls `completeOnboarding` (identity + access + onboarded).
  Screenshot-verified: scanning `example.com` → step-1 brand review with theme swatches, live. ⚠️ smoke restores the
  workspace profile (non-destructive). NOTE: onboarding needs the real API — on the Vercel demo (mock mode) the
  crawl/scan won't run; works locally (`:4000`) or once `apps/api` is hosted.
- **Solution Parity PRD — Phase 1 truthful readiness layer (smoke 62/62 + screenshot-verified desktop+mobile):**
  `SolutionReadiness`/`SolutionCapability` types; `SolutionsController` `GET /solutions/readiness` (hand-curated,
  honest, completeness % computed from capability statuses) → at landing AI Search **29%**, Lead Conversion **57%**,
  Paid Boost **0%**; **live values as of 2026-06-16: AI Search 42%, Lead Conversion 87%, Paid Boost 0%** (rises as
  capabilities ship — `GET /solutions/readiness` is the live source of truth, not these notes). Each with capability
  matrix + safe/avoid claims. `api.getSolutionReadiness()`.
  New `/solutions` page (`SolutionsView`) + nav link (`Boxes` icon under Workspace). Purpose: stop sales/marketing
  overclaiming. **Update capability statuses in `solutions.controller.ts` as features ship.**
- **Leads PRD — frontend lead detail drawer (Gap 2, build+lint+typecheck clean):** new
  `components/leads/lead-detail-drawer.tsx` (Sheet + Tabs, opened by clicking a lead name in `leads-view.tsx`).
  Surfaces the verified backend: **Overview** (recommended action, fit/intent/engagement/spamRisk bars, "why this
  score" reasons, message, source), **Journey** (touchpoints/sessions/time-to-convert + event timeline), **Activity**
  (notes list + add-note via `addLeadActivity`). Lazy-loads score+journey+activity on open via the new client
  methods. Added as a NEW component + minimal `leads-view` wiring (name → `openDetail`) to avoid collision.
  **Screenshot-verified** (desktop 1440 + mobile 390 via Chrome CDP): Overview renders score 84 + 6 explainable
  reasons + bars + recommended action + message, responsive, no clipped text. This makes the Leads backend demo-able.
- **Leads PRD — explainable scoring (Gap 7, smoke-verified 61/61):** `LeadScore`/`LeadScoreReason` types;
  `lead-score.service.ts` with a pure `computeLeadScore(lead, journeySummary)` → fit/intent/engagement/spamRisk +
  total (weighted) + confidence + human-readable `reasons[]` + `recommendedAction`. `LeadScoreStore` (`cx_lead_score`,
  additive). `GET /leads/:id/score` (compute-if-absent), `POST /leads/:id/recalculate-score`. Reads the lead via
  `PageEngineStore.getLead` (read-only inject) + journey via `LeadJourneyStore` — no Lead-type mutation. Live sample:
  lead-1 scored 84 (business email, "demo" intent, form submit, 12-touchpoint journey). `api.getLeadScore/recalculateLeadScore`.
  **Leads additive backend now complete: activity ✅ journey ✅ assignment ✅ throttle ✅ scoring ✅.** Remaining Leads:
  notification rules, lead-form config, CRM sync jobs (backend), then the **frontend lead detail drawer** tying it together.
- **Leads PRD — owner assignment + global public throttle (smoke-verified 59/59, throttle 429-verified):**
  `LeadAssignment` type + `LeadAssignmentStore` (`cx_lead_assignment`, additive). Routes use ≥2-segment or distinct
  literals to dodge page-engine `LeadsController`'s `/leads/:id`: `POST /leads/:id/assign`, `POST /leads/bulk-assign`,
  `GET /leads/assign/workload` (per-rep counts). `api.assignLead/bulkAssignLeads/getLeadWorkload`. **Global
  `PublicThrottleGuard`** (2nd APP_GUARD, `common/rate-limit.ts` 60/10s per IP) now throttles ALL `POST /public/*`
  (events + leads) — flood-tested: 70 reqs → 13×429. (Removed the now-redundant inline events limiter.) Next Leads:
  explainable scoring, notification rules, lead-form config, CRM sync jobs, then the frontend lead detail drawer.
- **Leads PRD — visitor journey tracking (Gap 1, smoke-verified, 55/55):** `LeadJourneyEvent`/`LeadJourneySummary`
  types; `LeadJourneyStore` (`cx_lead_journey`, additive — no Lead-type change); **`POST /public/events`**
  (`@Public`, **rate-limited** via `common/rate-limit.ts` 60/10s per IP, validated) records anonymous
  visitor/session events; `POST /leads/:id/link-visitor` links a visitor's history to a lead (backfills leadId);
  `GET /leads/:id/journey` returns events + computed summary (sessions, touchpoints, first-seen, convertedAt from
  `form_submit`, time-to-convert, top pages). Client: `recordVisitorEvent/linkLeadVisitor/getLeadJourney`. Reusable
  `RateLimiter` — apply to other public endpoints next.
- **Leads PRD — Phase 1 start + 2 hardening items (smoke-verified, 50/50):** (1) **lead notes & activity timeline**
  (Gap 3) — `LeadActivity`/`LeadActivityType` types, `LeadActivityStore` (`cx_lead_activity`, keyed by leadId,
  additive — does NOT mutate the `Lead` type, so it composes with page-engine's `LeadsController`),
  `GET/POST /leads/:id/activity` (validated type), `pageEngineApi.getLeadActivity/addLeadActivity`. (2) **`POST
  /pages/:id/validate`** non-mutating publish quality-gate (reuses `publishBlockers` → `{blockers,canPublish}`),
  `pageEngineApi.validatePage`. (3) **`brand/extract-from-site` now SSRF-guarded** via `safeFetchText` (was a raw
  follow-redirect fetch). ⚠️ The big Leads-PRD Lead-type extension (ownerId/score/source/journey/consent/crm/deal)
  is deferred — build it as ADDITIVE side-stores (like activity) to avoid clobbering page-engine.service. Full PRD
  in `docs/PRD-leads-dashboard.md` (or similar — Codex saves operator PRDs).
- **Page-Engine Theme PRD — Phase 1 backend start (smoke-verified, 45/45):** `SiteThemeProfile`/`ComponentStyle`
  types; SSRF guard `common/ssrf.ts` (`assertSafeUrl`/`safeFetchText` — blocks localhost/private/link-local/CGNAT +
  metadata `169.254.169.254`, re-checks resolved DNS, caps size/time) — **reuse this for ALL user-URL fetches**
  (the existing `brand/extract-from-site` still lacks it — harden next). `SiteThemeStore` (`cx_site_theme`) +
  `SiteThemeController`: `GET /site-theme`, `POST /site-theme/scan` (heuristic token extraction → draft profile +
  job), `GET/PUT /site-theme/:id`, `POST /site-theme/:id/confirm`. `api.getSiteThemes/scanSiteTheme/updateSiteTheme/
  confirmSiteTheme`. smoke proves the scan + 2 SSRF rejections. Remaining theme PRD: confirmation UI, themed
  preview (desktop/tablet/mobile), fidelity score in page list, page validate/duplicate/unpublish endpoints,
  publishing modes. Full PRD in `docs/PRD-page-engine-pages-ui-theme-matching.md`.
- **PRD §10 audit log — core workflows (smoke-verified, 40/40):** shared `AuditStore` (`cx_audit`, bounded 500,
  most-recent-first) + `AuditController` at **`GET /audit/log`** (NOT `/audit` — that's page-engine's separate
  `MonitoringController` trail). `AuditEntry` union broadened (additive superset: +create/update/discover/archive/
  restore/resolve/snooze/export/integration/bulk × +prospect/alert/settings/job/brand/content). Emits from
  backlink (discover/update/archive/restore/bulk), alerts (resolve/snooze), settings (update/integration/team).
  `api.getAuditLog()`. Verified entries like `cxa-N archive prospect`. Page-engine keeps its own `/audit` + `pe_audit`.
- **PRD §7 validation — dependency-free pipe (smoke-verified, 39/39):** `common/validation.ts` (a metadata-free
  `v.*` schema builder + `validateBody(schema)` `PipeTransform`; class-validator is unusable — esbuild emits no
  decorator metadata) + `common/schemas.ts` (CreateJob, AlertThresholds, AlertSnooze, ProspectUpdate, BulkProspects).
  Applied via `@Body(validateBody(Schema))` to: jobs create, alerts thresholds+snooze, backlink PATCH+bulk. Strips
  unknown keys, 400s with field errors. smoke has 3 negative tests proving rejections. **To extend §7 to more
  endpoints, reuse `validateBody` — don't reach for class-validator/zod.** Nested bodies are now supported via
  `v.shape(subSchema)` (deep-validates a nested object; composes with `v.arrayOf(v.shape({…}))` for typed arrays).
- **PRD Phase 2 — workflow-completing endpoints (smoke-verified):** `POST /backlink/opportunities/:id/restore`
  (un-archive, pairs with DELETE), `POST /backlink/opportunities/bulk` (`{ids,action:archive|restore|status,status?}`),
  `POST /alerts/:id/snooze` (`{until?}`, 7-day default, auto-expires) + `snoozedUntil` surfaced in the alerts
  list. `OpportunitiesStore.restore/bulk`, `AlertsStore.snooze/snoozedUntil` (migration-safe `snoozed` map in
  `cx_alerts`). Client: `api.restoreProspect/bulkProspects/snoozeAlert`. smoke-live now 39 checks.
- **Live API Productization PRD — Phase 1 core (smoke-verified):** mock fallback is now **demo-mode-only**
  in BOTH web clients (`api-client.ts`/`page-engine-client.ts` gate on `NEXT_PUBLIC_GEOSEO_MODE`+`IS_BUILD`;
  production/staging surface errors to route boundaries, no silent dummy data — PRD §3/§4). `/dashboard`
  route **de-mocked** (uses `api.getAiVisibility/getAlerts`, no direct `@geoseo/mock` import). New
  **`GET /performance/overview?range=`** aggregate (`PerformanceController` + `PerformanceOverview` type +
  `api.getPerformanceOverview()` fallback): avgRank, rankDelta vs prior window, impressions/clicks/CTR,
  aiMentions, avgShareOfVoice, top movers. New **`apps/api/scripts/smoke-live.mjs`** (31 checks, all green):
  health/mode, both overviews, jobs CRUD/retry/cancel, prospect discover/edit/archive, outreach draft,
  alerts, content, brand, settings, page-engine, public, leads, search. `pnpm -r typecheck` + eslint +
  `next build` clean. ⚠️ smoke leaves minor demo residue (one brand version, thresholds rankDrop=6) — a
  demo-reset command is the Phase-5 follow-up. Remaining web mock imports (`api-client`/`page-engine-client`)
  are intentional demo-mode fallback per PRD §4.3. Full PRD in `docs/PRD-live-api-productization.md`.
- **Authority overview aggregate (#38, curl-verified):** `GET /api/v1/overview/authority` (`OverviewController`)
  returns `{health, backlinkQuality, alerts:{open,critical,warning}, momentum}` — DA×status-weighted
  backlink quality score+grade, and a 30-day momentum/forecast from the rank-series trend. Types in
  `@geoseo/types` (`AuthorityOverview`/`BacklinkQuality`/`AuthorityMomentum`; `DomainHealthFactor.explanation`).
  `api.getAuthorityOverview()` with a mock fallback mirroring the controller. Authority HQ (`app/(app)/page.tsx`)
  now consumes it: momentum strip under the insight band, per-factor `InfoHint` explanations, backlink
  quality in the Backlink Profile panel header. Mock factor explanations added. typecheck+lint+`next build` clean.
- **Confirmation dialogs + job-center upgrade + ⌘K palette base (verified):** `useAppFeedback().confirm()`
  imperative dialog replaced all `window.confirm` (opportunities archive, settings remove-member, leads
  delete, page rollback, risky publish); job center now status-aware (queued/running/failed/cancelled) with
  retry/cancel/artifact-download/error detail (`api.retryJob`/`cancelJob`, `JobRun.error`/`artifactUrl`);
  `COMMAND_EVENT` palette trigger (Codex's search-integrated palette consumes it). Performance date-range now
  re-slices server data via `?range=`; Opportunities mobile card layout + reset-filters empty state.
- **API product-mode gate (§3, live):** `common/mode.ts` (`GEOSEO_MODE`/`API_AUTH_REQUIRED`); `/health` now
  reports `{mode, persistence, authRequired}`; boot aborts in prod/staging without auth config (`.env` sets
  `API_AUTH_REQUIRED=false`). CORS adds optional `WEB_ORIGIN`.
- **Global Search Phase 1 (verified):** `SearchService` + `SearchController` (`GET /api/v1/search?q&type&limit&offset`)
  aggregate a scored in-memory index over prospects/pages/opportunities/alerts/tracked-pages/leads/jobs/
  settings/brand/content/audit — **never indexes secrets**; `type:x` + `da>NN` interpretation; entity
  boost only *ranks* genuine text matches. `api.search()` client. Command palette now debounce-queries it
  (150ms, stale-cancelled), groups results by type, keeps command matches on top, recent searches via
  localStorage. Search types added to `@geoseo/types`. Curl-verified relevance (segment→segment.com top,
  `type:alert critical`→2, `da>70`→21, webflow→1); typecheck + eslint clean.
- **Authority HQ Phase 1 (complete, screenshot-verified desktop+375px):** insight summary band
  (`insight-band.tsx`); KPI cards deep-link via `KPI_HREF`; **Action Center** prioritized
  `AuthorityAction` cards (`action-center.tsx` + `lib/authority-actions.ts`, derived from
  alerts/prospects/backlinks, ranked urgency→impact, each links to a workflow); executive-summary
  **CSV export** (`overview-export.tsx`); mobile reorder (Action Center after KPIs via grid `order`).
- **Global Search dedicated page (`/search`, verified):** `app/(app)/search/page.tsx` (force-dynamic,
  SSR-seeded) + `components/search/search-results-view.tsx` — facet rail by type, live re-query
  (URL-synced), grouped results with icon/metrics/status, CSV export, empty state. Palette has a
  "View all results" footer → `/search?q=`.
- **Saved searches (F5) — NOT BUILT (corrected 2026-06-16):** an earlier note claimed this shipped
  (`lib/saved-searches.ts` + `/search` Save button + palette "Saved" section), but that file/feature does
  **not exist** in the tree (verified: no `SavedSearch`/`saved-searches` refs anywhere in `apps/web`). Still open.
- **Search relevance fix:** `search.service.ts` appends `TYPE_KEYWORDS` to each item's haystack so
  category-name queries surface the right entities (`alert` 0→8, `leads`→12, `prospects`→26).
- **Route loading skeletons (§15.1):** layout-matching `loading.tsx` for `/performance`,
  `/opportunities`, `/leads`, `/search` (group-level `loading.tsx`/`error.tsx` already cover the rest).
- **Store migration + boot fix (verified):** all `cx_*` + `pe_*` JSONB persistence confirmed durable;
  fixed `db.ts` double-encoding (`sql.json`) + normalized 28 legacy rows; reconciled the `mode.ts` boot
  gate with `.env` (`API_AUTH_REQUIRED=false`). Tracked Pages mobile cards + command-palette lint refactor.
- **P1/P2 polish (prior pass, all verified):** prospect contact/tags/notes **edit drawer**
  (`prospect-edit-drawer.tsx`, PATCH round-trip curl-verified); **publishing toggles persist**
  via `PUT /settings` (`publishing` added to `WorkspaceSettings` + `SettingsStore`, round-trip
  verified); **real CSV exports** for opportunities + performance (`lib/csv.ts`, client download
  + row-count toast); **build cleanup** (`api-client.ts` fallback warnings gated on
  `NEXT_PHASE`, charts dynamic-imported via `performance/lazy-charts.tsx`, `Reveal` applied on
  `/performance`). `pnpm -r typecheck` + web `next build` clean; eslint clean.
- API endpoint gaps closed (blueprint PUT, job retry/cancel, publishing endpoints, Workspace CRUD);
  real site-crawl brand extract; blueprint risk flags + version diff view + mobile/desktop preview;
  discovered-prospect outreach 404 fixed; KPI reduced-motion; "Discover opportunities" + "Upgrade to
  Pro" buttons wired.

## House rules
- **Never commit/push without explicit confirmation** (repo is currently all uncommitted on disk).
- Keep `@geoseo/mock` as the fallback behind every provider — never delete it.
- Secrets live in `apps/api/.env` (operator keeps them in-repo intentionally; do not rotate without asking).

## Deeper docs
`docs/UPGRADE-PLAN.md` (**sellable-product execution brief — the current roadmap**) ·
`docs/DECISIONS.md` (latest decisions) · `docs/HANDOFF.md` (Codex's pre-Clerk handoff — partly stale) ·
`docs/ROADMAP.md` (S0→S14 sequence) · `docs/PRD-*.md` (specs) · `docs/API-SPEC.md` · `docs/FLOWS.md`.
