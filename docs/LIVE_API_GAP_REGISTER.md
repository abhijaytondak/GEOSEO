# GEOSEO — Live API Gap Register

> Required by **PRD: No-Dummy-Data API Wiring and Product Gap Closure** (§12, Phase 1).
> Tracks every gap between "demo-backed product" and "live-user production product".
> Last updated: **2026-06-17**. Maintained by Claude Code.

**Authoring constraint (read first):** this repo is edited by **two agents concurrently**.
The operator directed this session to work **strictly greenfield** — create new modules,
never clobber the other account's lane (`bearer.guard.ts` / Clerk auth, `api-client.ts`,
`seo.module.ts`, `page-engine.service.ts`, `db.ts`, settings/jobs/alerts/brand services).
So cross-lane fixes below are **documented, not executed**, and assigned to the owning lane.

---

## 1. Executive summary

GEOSEO has closed the original P0 no-dummy-data and tenant-resolution blockers. The production
runtime mock audit is green, Clerk/dev-token tenant resolution is fail-closed, and Page Engine
state is tenant-scoped. The remaining launch-hardening work is concentrated in secondary
tenant-store migration, provider/live-data coverage, and operational verification.

| Area | State | Owner lane |
|---|---|---|
| Billing / plans | **Shipped this session** (env-gated Stripe seam, honest setup state) | greenfield ✅ |
| Provider health surface | **Shipped this session** (`GET /integrations/health`) | greenfield ✅ |
| Observability (Sentry/PostHog/structured logs) | **Shipped this session** (dependency-free seams) | greenfield ✅ |
| Admin/support console | **Shipped this session** (`/admin` + diagnostics API) | greenfield ✅ |
| No-mock production enforcement | **Green** (`audit-no-mock-production.mjs` passes; mock imports isolated to demo modules) | done ✅ |
| Clerk JWT verify + tenant resolution | **Green** (`BearerGuard` verifies Clerk/dev token; `TenantGuard` resolves verified tenant) | done ✅ |
| Page Engine tenant migration | **Green** (opportunities/pages/leads scoped by tenant; public ingestion uses owning page tenant) | done ✅ |
| Site Theme + Images tenant migration | **Green** (`cx_site_theme` + `cx_images` now use tenant rows) | done ✅ |
| Remaining side-store tenant migration | Pending for Brand Memory/Library, settings, jobs, audit, lead side stores, AI-search, CMS/CRM | shared |
| Fail-closed DB/queue in prod | Pending | core |

**P0 launch blockers remaining:** fail-closed persistence/queue behavior and completion of the
remaining global side stores. Brand Memory + Brand Library should be the next tenant-migration
slice because multiple downstream workflows still read global brand context.

---

## 2. No-dummy-data violations (Gate A)

Current gate: `node apps/api/scripts/audit-no-mock-production.mjs` exits 0.

| # | File | Violation | Severity | Owner |
|---|---|---|---|---|
| D1 | `apps/web/src/lib/demo/demo-data.ts` | Demo-only allowlisted mock importer; used only when build/demo fallback is allowed | OK | done |
| D2 | `apps/api/src/seo/providers/demo.providers.ts` | Demo-only provider loaded dynamically only when `resolveMode()==="demo"` | OK | done |
| D3 | `apps/api/src/modules/demo-seed.ts` | Demo-only Page Engine fixtures; production fresh tenants are not seeded from mock | OK | done |

**Note:** demo fallback still exists for local/demo resilience, but production/staging modes surface
real API errors and the only direct `@geoseo/mock` imports are allowlisted demo modules.

---

## 3. Mock imports

Run: `rg -n "@geoseo/mock" apps/web/src apps/api/src`. Direct importers should remain limited
to allowlisted demo modules and comments. The CI guard is `apps/api/scripts/audit-no-mock-production.mjs`.

---

## 4. API endpoint gaps

Most surfaces already have live endpoints (verified by `scripts/audit-get.mjs` — 73 GET routes,
2xx+`success`). Endpoints **added this session**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/billing/status` | GET | Honest per-workspace subscription + plan entitlements |
| `/billing/checkout` | POST | Stripe Checkout session (setup-required when unconfigured) |
| `/billing/portal` | POST | Stripe Billing Portal session |
| `/billing/webhook` | POST (public) | Stripe webhook → subscription state (shared-secret guarded) |
| `/integrations/health` | GET | Unified `ProviderStatus[]` for all 13 providers |
| `/admin/overview` | GET | Mode/DB/queue/jobs/audit diagnostics (token-gated) |
| `/admin/jobs`, `/admin/jobs/:id` | GET | Job inspection for support |
| `/admin/workspaces`, `/admin/workspaces/:id` | GET | Workspace lookup + billing |
| `/admin/audit` | GET | Audit-event lookup |

**Still missing (PRD §7), by owner:**
- `POST /integrations/:provider/connect` + `/test` — provider connect/test flows (currently
  env-var-only activation). Greenfield-buildable next; needs per-provider credential storage.
- `GET /actions` — persisted Home action queue as a first-class entity (today derived
  client-side from alerts/opportunities). Codex lane (overview/dashboard).
- `GET /leads/export`, `POST /search/reindex` — listed in PRD; verify against current routes.

---

## 5. Persistence gaps

DocStore (JSONB-per-entity) persists all listed entities. New: `cx_billing` (per-tenant
subscription). Gaps vs PRD §10 / §18 data contract:
- Most entities lack the full `createdBy/updatedBy/source/status/lastSyncedAt` envelope. Additive.
- **Provider status is computed, not persisted** — acceptable (it's a live probe), but
  `lastSyncedAt` per provider-derived dataset is not stored.
- **In-memory degradation in production** (`db.ts`, `queue.service.ts`) violates §6.4 (fail-closed).
  Core lane: in production, missing/unreachable DB must fail boot, not run in-memory; missing
  Redis must block job-backed flows, not simulate completion.

---

## 6. Auth / tenant / RBAC gaps

| # | Gap | Required fix | Acceptance |
|---|---|---|---|
| A1 | Clerk/dev-token auth and verified tenant resolution | **Done** in `bearer.guard.ts`, `tenant.guard.ts`, and `common/tenant.ts` | unauth → 401; valid Clerk/dev-token path → tenant-scoped 200 |
| A2 | Production-safe tenant source | **Done**: verified Clerk org/user first; `x-workspace-id` trusted only in demo or trusted BFF path | client header spoof ignored in production |
| A3 | Remaining secondary stores still single-global-doc | Migrate per-tenant via the `conversion-audit` pattern (`DocStore.loadForTenant/saveForTenant`) | workspace A cannot read B's data |
| A4 | No RBAC | Owner/Admin/Marketer/Analyst/Viewer checks in API + UI | viewer cannot publish/delete/bill |
| A5 | Public ingestion tenant derivation | **Done for Page Engine**: derive tenant from page ownership, not caller header | A's public lead can't land in B |

**Tenant-migration dependency note:** the big Page Engine dependency is now migrated. Continue with
consumer side-stores in small slices, starting with Brand Memory + Brand Library because they feed
brand-analysis, image generation, follow-up drafts, and Page Engine brand context. Reference patterns:
`conversion-audit.service.ts`, `brand-analysis.service.ts`, `site-theme.service.ts`, `image-gen.service.ts`;
checklist in `docs/MULTI-TENANCY.md`.

---

## 7. Provider gaps

Unified status now live at `GET /integrations/health` returning the PRD §8.1 `ProviderStatus`
shape for: clerk, postgres (real ping), redis, dataforseo, brave/serp, gsc, llm, image-gen, cms,
hubspot, stripe, sentry, posthog. Each reports `connected | not_configured | error` + a setup hint.

Activation (env vars, no code change) per provider is documented in `CLAUDE.md`'s integration
table. Gaps: real provider **connect/test** UX (§4), AI-citation provider (heuristic today, must
stay labeled), and GSC/analytics returning heuristic charts that must show a source label
(already partially done — `source: "gsc"|"heuristic"`).

---

## 8. UI dead / incomplete controls

Prior audits (see `CLAUDE.md` "Done recently") closed the literal dead-click backlog. Remaining:
- **New routes need nav discoverability beyond the command palette:** `/billing` and `/admin`
  are appended to `commandDestinations` (palette) but not the primary sidebar (sidebar is
  intentionally collapsed to 6 items; adding them is a Codex/nav decision).
- Plan **entitlement enforcement** (gating publish/leads/seats by plan) is not wired into the
  page-engine/leads controllers yet — entitlements are exposed by `/billing/status`; enforcement
  is a follow-up in those (contested) controllers.

---

## 9. Public surface gaps

`/feeds/[slug]`, `sitemap.xml`, `llms.txt`, `/public/leads`, `/public/events`, `/public/ai-bot-hit`
are live, spam/honeypot/disposable-guarded, rate-limited, de-branded. Tenant derivation from
page/domain ownership is closed for the migrated Page Engine path; keep this invariant in future
public ingestion changes.

---

## 10. Verification plan

```bash
cd /Users/abhijay/GEOSEO
pnpm -r typecheck                                   # ✅ clean (incl. new modules)
cd apps/web && pnpm lint                            # ✅ 0 errors/warnings
node apps/api/scripts/smoke-live.mjs                # existing API smoke
node apps/api/scripts/audit-get.mjs                 # every-GET liveness sweep
node apps/api/scripts/audit-no-mock-production.mjs  # ✅ exits 0; demo mock imports are allowlisted only
# New endpoints verified live this session (demo mode, :4100):
curl -s localhost:4000/api/v1/billing/status
curl -s localhost:4000/api/v1/integrations/health
curl -s localhost:4000/api/v1/admin/overview
```
Still to add (PRD §15): `audit-ui-api-coverage.mjs`, `audit-tenant-isolation.mjs`,
`audit-provider-health.mjs`, Playwright production-mode flows.

---

## 11. Implementation order (remaining)

1. **[core]** Fail-closed DB/queue in production (§5, §6.4).
2. **[shared]** Brand Memory + Brand Library tenant migration, then consumers (`brand-analysis`,
   `image-gen`, `lead-followup`, Page Engine brand context).
3. **[shared]** Remaining side-store tenant migration (settings, jobs, audit, lead side stores,
   AI-search, onboarding, CMS/CRM).
4. **[greenfield, next]** Provider connect/test endpoints (§4); plan-entitlement enforcement (§8);
   mount `initAnalytics()` + Sentry in web layout; wire `RequestLogInterceptor` errors dashboards.

---

## Appendix — shipped this session (greenfield, verified)

- `apps/api/src/modules/billing.{service,controller}.ts` — Stripe seam, per-tenant `cx_billing`,
  honest setup-required, plan entitlements (Launch/Grow/Scale). Verified live.
- `apps/api/src/modules/provider-health.controller.ts` — `GET /integrations/health`, real DB ping.
- `apps/api/src/modules/admin.controller.ts` — `/admin/*` diagnostics, `ADMIN_API_TOKEN`-gated.
- `apps/api/src/common/observability.ts` — optional Sentry seam (dependency-free).
- `apps/api/src/common/request-log.interceptor.ts` — structured JSON request logs (+ Sentry).
- `apps/web/src/lib/platform-client.ts` — **mock-free** typed client (no fallback, errors surface).
- `apps/web/src/app/(app)/billing/page.tsx` + `components/billing/billing-view.tsx`.
- `apps/web/src/app/(app)/admin/page.tsx` + `components/admin/admin-view.tsx`.
- `apps/web/src/lib/analytics.ts` — optional PostHog seam (dependency-free).
- `apps/api/scripts/audit-no-mock-production.mjs` — Gate A enforcement (exit 1 on violations).
- `app.module.ts` — additive registration only.
