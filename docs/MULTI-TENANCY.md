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

## Store adoption checklist (each is an independent PR)

`cx_*` + `pe_*` stores to migrate (current = single `ws-default` doc): page-engine, brand, brand-library,
settings, workspace, alerts, jobs, opportunities, content, site-theme, audit, search-index, lead-* (activity,
journey, assignment, score, notification, form, routing, followup), ai-search (mentions, bots),
conversion-audit, onboarding, cms-publish, images, crm-sync. Start with a low-traffic additive store
(e.g. `cx_brand_library`) as the reference implementation, then fan out.

## Guardrails

- Keep `DEFAULT_TENANT_ID` → `"state"` mapping forever (back-compat for existing rows).
- Never read/write a store without a `tenantId` once it's migrated — make the param required so the compiler
  enforces it.
- `@Public()` ingestion endpoints (leads/events) must resolve tenant from the page's owning workspace, not the
  caller — derive it from the page/slug, not `x-workspace-id`.
