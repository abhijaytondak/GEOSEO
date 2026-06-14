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
  - ⚠️ `mode.ts` resolves `GEOSEO_MODE=production` whenever `DATABASE_URL` is set, which makes
    boot **abort** unless auth is configured. `.env` now sets `API_AUTH_REQUIRED=false` (the
    documented escape hatch) so it boots dev-permissive with persistence on. Remove that line
    only after backend Clerk JWT verification lands in `bearer.guard.ts`.
- **Web (port 3001):** `cd apps/web && PORT=3001 pnpm dev` (3000 is often taken).
- **Public preview:** ngrok tunnel → `:3001` (Cloudflare quick-tunnels were flaky here).
- **Vercel deploy (live):** project `geoseo` (team `rajputabhijay1-gmailcoms-projects`), **https://geoseo-tau.vercel.app**.
  Root Directory = `apps/web` (set via API); `apps/web/vercel.json` installs from the monorepo root
  (`cd ../.. && pnpm install`); `.vercelignore` keeps the upload small. Deployed in **demo mode**
  (`NEXT_PUBLIC_GEOSEO_MODE=demo`) → reads use the mock fallback since the NestJS API isn't hosted; **mutations
  won't persist there**. Clerk pk/sk passed as build+runtime env. Redeploy: `vercel deploy --prod --yes` from repo
  root (Clerk keys via `--build-env`/`-e` from `apps/web/.env.local`). For a fully-working deploy, host `apps/api`
  (Railway/Render) and set `API_INTERNAL_URL` on the Vercel project.
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
- **DataForSEO** (research) + **GSC/Analytics** (monitoring) are still mock/heuristic — need keys;
  GSC is moot until pages publish on an owned domain.

## ▶ Pick up here — remaining PRD phases
Three operator PRDs are in flight (full briefs were pasted in chat; summarize from git/docs if needed):
- **Global Search** — Phase 1 DONE (see below). Next: Phase 2 = dedicated `/search` page, saved
  searches, result quick-actions (F3), search analytics events; Phase 3 = tenant scoping + RBAC +
  rate-limit + audit; Phase 4 = NL parser / pgvector semantic.
- **Authority HQ UI/UX** — Phase 1 partial. DONE: insight summary band (`insight-band.tsx`), KPI
  click-nav. TODO Phase 1: upgrade Action Center into prioritized `AuthorityAction` cards (§10),
  export/executive-summary action (§21, reuse `lib/csv.ts`), richer mobile ordering. Phase 2:
  Domain-Health factor explanations + click-through, backlink quality score, momentum/forecast
  module, role-aware actions. Phase 3: `GET /overview/authority` aggregate endpoint + action analytics.
- **Route-level loading/error states** (`loading.tsx`/`error.tsx` per route) + consistent empty
  states — still outstanding from the Upgrade Plan.
Then Phase 4 security/scale foundation (DTO validation, tenant scoping, Clerk JWT verify in
`BearerGuard`, RBAC). The `mode.ts` gate already exists (`GEOSEO_MODE`/`API_AUTH_REQUIRED`).

## Done recently (don't redo)
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
  honest, completeness % computed from capability statuses) → AI Search **partial 29%**, Lead Conversion **partial
  57%**, Paid Boost **planned 0%**, each with capability matrix + safe/avoid claims. `api.getSolutionReadiness()`.
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
  endpoints, reuse `validateBody` — don't reach for class-validator/zod.** Nested bodies (e.g. settings PUT) need a
  nested-object validator (not yet built).
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
- **Saved searches (F5, verified):** `lib/saved-searches.ts` (localStorage); `/search` Save button +
  removable saved chips; palette "Saved" section before typing → `/search?q=&type=`.
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
