# Multi-Tenancy — isolation plan & groundwork

Status: **groundwork landed; per-store migration pending** (incremental, follow the Clerk auth landing).

GEOSEO is single-tenant today: every store resolves to one workspace (`ws-default`).
True multi-customer production needs each request's data scoped to its workspace. This
doc is the plan + what's already in place so the migration can proceed safely and
incrementally — no big-bang rewrite.

## What's landed (groundwork)

- **Request tenant context** — `common/tenant.ts`:
  - `DEFAULT_TENANT_ID = "ws-default"`, `normalizeTenantId()`, `resolveTenantId(req)`.
  - Precedence (**production-safe, P0-5 done**): `req.tenantId` → verified Clerk org (`req.auth.orgId`) →
    verified Clerk user (`u-<userId>`, personal workspace) → `x-workspace-id` **only in demo or on the
    trusted s2s BFF path** (`req.auth.trusted`) → default. A client header is never trusted in production.
- **Guard order (P0-5):** `BearerGuard` runs **before** `TenantGuard` so `req.auth` (verified org/user) is set
  when the tenant is derived. `bearer.guard` marks the `DEV_API_TOKEN` s2s path `req.auth.trusted`; the web BFF
  (`app/api/v1/[...path]/route.ts`) forwards the user's verified workspace as `x-workspace-id`.
- **`TenantGuard`** attaches `req.tenantId` to every request (always allows). Verify: `GET /tenant/context`
  (now non-public — reflects the real authenticated tenant). Prod: spoof(no-auth+header)→401; dev-token+header→tenant.
- **Per-tenant storage primitive** — `DocStore.loadForTenant(tenantId)` / `saveForTenant(tenantId, state)`
  + `DocStore.tenantRowId()`. Per-tenant rows live in the **same entity table** under a tenant-scoped row id;
  **`ws-default` maps to the legacy `"state"` row, so existing data needs no migration.** Additive — the
  single-doc `init()`/`save()` API is unchanged (it's the `ws-default` special case).

Net effect today: behavior is identical (everything is `ws-default`); the seams exist for incremental adoption.

## Migration steps (do incrementally, one store/slice at a time)

1. **Auth → tenant — ✅ DONE (P0-5).** Clerk JWT verification in `bearer.guard.ts` sets `req.auth`;
   `resolveTenantId` derives tenant from the verified `orgId`/`userId`, production-safe. The web BFF forwards
   the verified workspace. Cross-tenant `x-workspace-id` spoofing is closed.
2. **Thread `tenantId` into services.** Controllers read `req.tenantId` (`@Req()`), pass it to store methods
   (`store.method(tenantId, …)`). Prefer explicit params over request-scoped providers (tsx/esbuild + DI cost).
3. **Per-tenant stores.** Convert each store from a single hydrated `state` to a `Map<tenantId, state>` that
   lazy-loads via `DocStore.loadForTenant(tenantId)` and writes via `saveForTenant(tenantId, …)`. Seed a new
   tenant from the same fixtures used today.
4. **RLS by tenant (defense in depth).** Tables already have RLS enabled with no policies (server-only access).
   When exposing any tenant-scoped read path, add a `tenant_id` predicate / policy so cross-tenant reads are
   impossible even on a bug. (Current rows are `id="state"`; per-tenant rows are `id="t:<tenant>"`.)
5. **RBAC.** Layer role checks (admin / marketer / analyst) from the Clerk session on top of tenant scoping.

## Reference implementation — `conversion-audit` (done)

`ConversionAuditStore` is migrated as the copy-paste pattern:

- Store keeps `private cache = new Map<string, AuditState>()`; a private `state(tenantId)` lazily hydrates
  via `db.loadForTenant(tenantId)` (falling back to an empty state), and a `commit(tenantId, …)` sets the cache
  + `db.saveForTenant(tenantId, …)`. Public methods take `tenantId` first: `latest(tenantId)`, `run(tenantId, …)`.
- Controller reads the tenant once per handler with `resolveTenantId(req)` (`@Req() req: TenantRequest`) and
  passes it down. No global `onModuleInit` hydration (per-tenant is lazy).
- Verified: `x-workspace-id: alpha` and `x-workspace-id: beta` get fully isolated audit state; default tenant
  unaffected. Works in-memory (cache) and persists per-tenant when the DB is reachable.

## Store adoption checklist (each is an independent PR)

Done: **conversion-audit** (reference). Remaining `cx_*`/`pe_*` stores (current = single `ws-default` doc):
page-engine, brand, brand-library, settings, workspace, alerts, jobs, opportunities, content, site-theme, audit,
search-index, lead-* (activity, journey, assignment, score, notification, form, routing, followup), ai-search
(mentions, bots), onboarding, cms-publish, images, crm-sync. Follow the conversion-audit pattern; do brand-library
next (note: its `composeBrandContext` consumer in `page-engine.service` should read the page's owning tenant —
until page-engine is migrated, pass `DEFAULT_TENANT_ID`).

## Page Engine migration plan (P0-6, NEXT — the big rock)

`page-engine.service.ts` is the largest store and must migrate **first** (leads/pages/opportunities live here;
side-stores depend on it). Surface: ~770 lines, **37 public methods, 42 controller endpoints (0 tenant-aware
today), 68 internal state references.** All-or-nothing for consistency — do it as one focused branch
(`p0-6-tenant-page-engine`), not a partial. Recommended approach (preserves the live demo: `ws-default` keeps
exact current behavior + existing rows):

1. **Per-tenant state struct.** Extract the mutable fields into `interface PEState { opportunities, blueprints,
   pages, leads, pageVersions, audit, seq, vseq, aseq, batchJobs }`. Replace the instance fields with
   `private tenants = new Map<string, PEState>()` + `private s(tenantId): PEState` that lazily creates/hydrates.
2. **Thread `tenantId` as the FIRST param of every public method** (make it required so the compiler finds every
   call site). Internally swap `this.opportunities` → `this.s(tenantId).opportunities`, etc. (68 refs).
3. **Persistence keying.** Keep `ws-default` writing to the EXISTING un-prefixed rows (zero data migration, demo
   unchanged). For other tenants, namespace row ids `t:<tenant>:<id>` and partition on load. Hydrate lazily per
   tenant (drop the global `onModuleInit` bulk hydrate; load on first `s(tenant)` touch). Production fresh tenant
   = empty (P0-3 already done); demo `ws-default` = seeded.
4. **Controllers (`page-engine.controller.ts`, 42 endpoints).** Add `@Req() req: TenantRequest`, compute
   `const t = resolveTenantId(req)` once per handler, pass `t` into every store call. Public ingestion endpoints
   (`/public/*` leads/events) must derive tenant from the **page's owning workspace** (by slug/page), NOT the
   caller (A5) — store the owning tenant on the page record at generation time.
5. **Verify:** `x-workspace-id: alpha` vs `beta` get isolated pages/leads/opportunities; `ws-default` unchanged;
   audit `actor`/`workspaceId` reflect the real tenant. Then proceed to the side-store checklist below.

## Guardrails

- Keep `DEFAULT_TENANT_ID` → `"state"` mapping forever (back-compat for existing rows).
- Never read/write a store without a `tenantId` once it's migrated — make the param required so the compiler
  enforces it.
- `@Public()` ingestion endpoints (leads/events) must resolve tenant from the page's owning workspace, not the
  caller — derive it from the page/slug, not `x-workspace-id`.
