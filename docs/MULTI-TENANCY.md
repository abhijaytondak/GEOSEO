# Multi-Tenancy — isolation plan & groundwork

Status: **groundwork landed; per-store migration pending** (incremental, follow the Clerk auth landing).

GEOSEO is single-tenant today: every store resolves to one workspace (`ws-default`).
True multi-customer production needs each request's data scoped to its workspace. This
doc is the plan + what's already in place so the migration can proceed safely and
incrementally — no big-bang rewrite.

## What's landed (groundwork)

- **Request tenant context** — `common/tenant.ts`:
  - `DEFAULT_TENANT_ID = "ws-default"`, `normalizeTenantId()`, `resolveTenantId(req)`.
  - Precedence: `req.tenantId` → Clerk org claim (`req.auth.orgId`) → `x-workspace-id` header → default.
- **`TenantGuard`** (`common/tenant.guard.ts`, registered as the **first** `APP_GUARD`) attaches
  `req.tenantId` to every request. It only attaches context (always allows). Verify: `GET /tenant/context`
  (echoes the resolved tenant; pass `x-workspace-id: acme` to override).
- **Per-tenant storage primitive** — `DocStore.loadForTenant(tenantId)` / `saveForTenant(tenantId, state)`
  + `DocStore.tenantRowId()`. Per-tenant rows live in the **same entity table** under a tenant-scoped row id;
  **`ws-default` maps to the legacy `"state"` row, so existing data needs no migration.** Additive — the
  single-doc `init()`/`save()` API is unchanged (it's the `ws-default` special case).

Net effect today: behavior is identical (everything is `ws-default`); the seams exist for incremental adoption.

## Migration steps (do incrementally, one store/slice at a time)

1. **Auth → tenant (other account's lane).** When Clerk JWT verification lands in `bearer.guard.ts`, set
   `req.auth = { userId, orgId }` from the verified token. `resolveTenantId` then derives the tenant from
   `orgId` automatically — no change needed here. (Until then, `x-workspace-id` drives it for dev/testing.)
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

## Guardrails

- Keep `DEFAULT_TENANT_ID` → `"state"` mapping forever (back-compat for existing rows).
- Never read/write a store without a `tenantId` once it's migrated — make the param required so the compiler
  enforces it.
- `@Public()` ingestion endpoints (leads/events) must resolve tenant from the page's owning workspace, not the
  caller — derive it from the page/slug, not `x-workspace-id`.
