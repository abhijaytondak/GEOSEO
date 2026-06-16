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

GEOSEO is ~70% of the way to live-user readiness. Phases 1–4 of the Production-Readiness
PRD are largely **already built** (no-mock policy gating, fail-closed boot, honest `/health`,
onboarding, core workflows, env-gated provider seams, real BullMQ queue). The remaining work
is concentrated in five areas:

| Area | State | Owner lane |
|---|---|---|
| Billing / plans | **Shipped this session** (env-gated Stripe seam, honest setup state) | greenfield ✅ |
| Provider health surface | **Shipped this session** (`GET /integrations/health`) | greenfield ✅ |
| Observability (Sentry/PostHog/structured logs) | **Shipped this session** (dependency-free seams) | greenfield ✅ |
| Admin/support console | **Shipped this session** (`/admin` + diagnostics API) | greenfield ✅ |
| No-mock production enforcement | **Audit script shipped**; client refactor pending | cross-lane |
| Clerk JWT verify + tenant resolution | Pending | **other account** |
| Per-store tenant migration | Groundwork done (2 stores); blocked on the two above | shared |
| Web mock-fallback removal | Pending (api-client / page-engine-client) | **Codex** |
| API mock DI (`seo.module.ts`) | Pending | **Codex** |
| Fail-closed DB/queue in prod | Pending | core |

**P0 launch blockers remaining:** Clerk JWT verify, web mock-fallback removal, API mock DI
replacement, per-store tenant isolation, fail-closed persistence. None are in the greenfield
lane; all are documented in §6/§7 below with the exact fix + acceptance test.

---

## 2. No-dummy-data violations (Gate A)

Detected by `node apps/api/scripts/audit-no-mock-production.mjs` (exit 1 today):

| # | File | Violation | Severity | Owner |
|---|---|---|---|---|
| D1 | `apps/web/src/lib/api-client.ts:11` | imports `seoProvider, brandSource, outreachDrafter` from `@geoseo/mock`; `fallbackSettings` hardcodes "Northwind Labs", fake team, **fake billing**, fake integrations | **P0** | Codex |
| D2 | `apps/web/src/lib/page-engine-client.ts:8` | imports `pageEngine` from `@geoseo/mock`; returns mock opportunities/blueprints/pages/leads on fallback | **P0** | Codex |
| D3 | `apps/api/src/modules/page-engine.service.ts:21` | seeds production stores from `@geoseo/mock`, deep-cloned | **P0** | contested |
| D4 | `apps/api/src/seo/seo.module.ts:2` | binds production DI tokens to `@geoseo/mock` providers | **P0** | Codex |

**Partial mitigation shipped:** the **fake billing** half of D1 is now obsoleted by the live
`GET /billing/status` (honest `configured:false` / `setupRequired:true`, never a fake "Grow
trial"). When the web Settings/Billing surface reads `/billing/status` (or the new `/billing`
route) instead of `fallbackSettings.billing`, that specific dummy-data violation is closed.

**Note:** the no-mock audit (`api-client`/`page-engine-client`) keys on a *demo-mode* env gate
(`FALLBACK_ALLOWED = IS_BUILD || MODE==="demo"`), so in `production` mode the fallback never
runs — but the **import still bundles** mock into production. The PRD requires the import to be
impossible in a production build (move to `lib/demo-*.ts` isolated modules). Tracked as D1/D2.

---

## 3. Mock imports

Run: `rg -n "@geoseo/mock" apps/web/src apps/api/src`. Production runtime importers: the four
files in §2. Legitimate (keep): `packages/mock/*` itself, and test/seed usage. Required fix
(§6.1 of the PRD): split demo-only fallback into `lib/demo-api-client.ts` /
`lib/demo-page-engine-client.ts` that cannot be reached in production, then make the production
build fail on any runtime `@geoseo/mock` import (the audit script is the CI guard).

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

## 6. Auth / tenant / RBAC gaps (P0, other-account lane)

| # | Gap | Required fix | Acceptance |
|---|---|---|---|
| A1 | API auth uses static `DEV_API_TOKEN`, no Clerk JWT verify | Wire Clerk JWT verification in `bearer.guard.ts`; set `req.auth.{userId,orgId,role}` | unauth → 401; valid Clerk token → tenant-scoped 200 |
| A2 | Tenant resolves to `ws-default` (Clerk `orgId` not populated) | Once A1 lands, `resolveTenantId` already consumes `req.auth.orgId` | `x-workspace-id` ignored in prod; org claim used |
| A3 | 24/26 stores still single-global-doc | Migrate per-tenant via the `conversion-audit` pattern (`DocStore.loadForTenant/saveForTenant`) | workspace A cannot read B's data |
| A4 | No RBAC | Owner/Admin/Marketer/Analyst/Viewer checks in API + UI | viewer cannot publish/delete/bill |
| A5 | Public ingestion trusts `x-workspace-id` | Derive tenant from page/domain ownership in `/public/*` | A's public lead can't land in B |

**Tenant-migration dependency note (why §8 isn't executed this session):** the lead-* side-stores
and onboarding are *mine* to migrate, but they interrelate with `PageEngineStore` (leads/pages
live there, global `ws-default`) and with public ingestion (A5). Migrating one store in isolation
while its data source stays global produces an inconsistent tenant/global split. Correct order:
**A1 (Clerk) → page-engine.service tenant migration (contested) → its consumer side-stores → A5.**
Until A1 + page-engine migrate, isolated migration is unsafe. Reference pattern is proven on
`conversion-audit.service.ts` + `brand-analysis.service.ts`; checklist in `docs/MULTI-TENANCY.md`.

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
are live, spam/honeypot/disposable-guarded, rate-limited, de-branded. **P0 gap A5** (tenant from
page/domain ownership) is the open item — public lead ingestion must not trust caller headers.

---

## 10. Verification plan

```bash
cd /Users/abhijay/GEOSEO
pnpm -r typecheck                                   # ✅ clean (incl. new modules)
cd apps/web && pnpm lint                            # ✅ 0 errors/warnings
node apps/api/scripts/smoke-live.mjs                # existing API smoke
node apps/api/scripts/audit-get.mjs                 # every-GET liveness sweep
node apps/api/scripts/audit-no-mock-production.mjs  # ⛔ exit 1 today (4 known P0s)
# New endpoints verified live this session (demo mode, :4100):
curl -s localhost:4000/api/v1/billing/status
curl -s localhost:4000/api/v1/integrations/health
curl -s localhost:4000/api/v1/admin/overview
```
Still to add (PRD §15): `audit-ui-api-coverage.mjs`, `audit-tenant-isolation.mjs`,
`audit-provider-health.mjs`, Playwright production-mode flows.

---

## 11. Implementation order (remaining)

1. **[other account]** Clerk JWT verify in `bearer.guard.ts` (A1) — unblocks everything tenant.
2. **[Codex]** Split demo fallback out of `api-client.ts` / `page-engine-client.ts` (D1/D2); wire
   Settings/Billing UI to `/billing/status` to kill the fake-billing dummy data.
3. **[Codex]** Replace `seo.module.ts` mock DI with live/provider-gated bindings (D4).
4. **[core]** Fail-closed DB/queue in production (§5, §6.4).
5. **[shared]** Page-engine tenant migration → side-store migration → public tenant derivation (A3/A5).
6. **[greenfield, next]** Provider connect/test endpoints (§4); plan-entitlement enforcement (§8);
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
