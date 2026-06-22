# Multi-Tenancy — isolation plan & groundwork

Status: **core tenant path landed; side-store migration in progress**.

GEOSEO now resolves a verified tenant for every protected request, and the highest-risk
Page Engine state has been migrated. Several secondary stores still resolve to the legacy
workspace (`ws-default`) and must be migrated incrementally before multi-customer production.
This doc tracks what is live and what remains.

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

Net effect today: migrated surfaces isolate by tenant while `ws-default` keeps legacy rows for
back-compat; unmigrated stores still share their single legacy document and are listed below.

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

## Reference implementations — done

`ConversionAuditStore` is migrated as the copy-paste pattern:

- Store keeps `private cache = new Map<string, AuditState>()`; a private `state(tenantId)` lazily hydrates
  via `db.loadForTenant(tenantId)` (falling back to an empty state), and a `commit(tenantId, …)` sets the cache
  + `db.saveForTenant(tenantId, …)`. Public methods take `tenantId` first: `latest(tenantId)`, `run(tenantId, …)`.
- Controller reads the tenant once per handler with `resolveTenantId(req)` (`@Req() req: TenantRequest`) and
  passes it down. No global `onModuleInit` hydration (per-tenant is lazy).
- Verified: `x-workspace-id: alpha` and `x-workspace-id: beta` get fully isolated audit state; default tenant
  unaffected. Works in-memory (cache) and persists per-tenant when the DB is reachable.

`PageEngineStore` has also landed as the large-state implementation:

- Controllers pass `tenantId` into opportunities, blueprints, pages, leads, recommendations, monitoring, and
  publish workflows.
- Tenant data is partitioned so `ws-default` keeps the existing legacy rows, while other tenants use tenant
  prefixes.
- Public lead/event ingestion derives tenant from the owning page instead of a caller-controlled workspace.

`SiteThemeStore` and `ImageGenStore` now follow the same lazy per-tenant document pattern:

- `/site-theme/*` routes resolve tenant per request and read/write `cx_site_theme` tenant rows.
- `/images` routes resolve tenant per request and read/write `cx_images` tenant rows.
- Image generation reads the confirmed theme color from the same tenant before building prompts/placeholders.

## Store adoption checklist (each is an independent PR)

Done: **auth tenant resolution**, **conversion-audit**, **billing**, **brand-analysis cache**,
**page-engine**, **site-theme**, **images**.

Remaining `cx_*` stores still using a single legacy document and needing tenant migration:
brand, brand-library, settings, workspace, alerts, jobs, opportunities, content, audit, search-index,
lead-* (activity, journey, assignment, score, notification, form, routing, followup), ai-search
(mentions, bots), onboarding, cms-publish, crm-sync.

Recommended next slice: migrate **Brand Memory + Brand Library** together, then update their consumers
(`brand-analysis`, `lead-followup`, `image-gen`, `page-engine` brand context) to read brand state from the
same tenant as the active workflow.

## Guardrails

- Keep `DEFAULT_TENANT_ID` → `"state"` mapping forever (back-compat for existing rows).
- Never read/write a store without a `tenantId` once it's migrated — make the param required so the compiler
  enforces it.
- `@Public()` ingestion endpoints (leads/events) must resolve tenant from the page's owning workspace, not the
  caller — derive it from the page/slug, not `x-workspace-id`.
