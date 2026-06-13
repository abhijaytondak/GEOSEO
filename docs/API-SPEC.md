# API Design Spec — Backlinking & Continuous SEO Optimization Engine

Backend contract for the GEOSEO module. RESTful, JSON, versioned (`/api/v1/...`),
bearer-auth. Implemented by `apps/api` (NestJS — see TECH-STACK.md). The mock
provider interfaces in `@geoseo/types` (`SeoDataProvider`, `OutreachDrafter`,
`BrandProfileSource`) are the in-memory stand-ins for these endpoints.

## Conventions
- **Auth:** `Authorization: Bearer <JWT|API token>` on every protected endpoint; `Content-Type: application/json`. Token scopes drive multi-tenant RBAC (`admin` · `marketer` · `analyst`) — enforced via NestJS guards.
- **Envelope:** every response is `{ "success": bool, "data": {…}, "errors": [] }`.
- **Status codes:** 400 bad request · 401 unauthorized · 403 forbidden · 404 not found · 429 rate-limited · 500 server error.
- **Lists:** support `limit` / `offset` pagination, plus `sortBy` + filters; return `total`.
- **Docs:** spec is the source for an OpenAPI/Swagger definition → Postman + client-SDK codegen.

## Endpoints (v1)

### 1. Backlink Opportunity Discovery
- `GET /api/v1/backlink/opportunities` — scored prospects. Query: `pageId` (req), `limit`, `offset`, `minAuthority`, `niche`, `status`. Returns `{ opportunities: [{ id, domain, domainAuthority, relevanceScore, impactScore, snippet, tags, status }], total }`.
- `GET /api/v1/backlink/opportunities/:id` — detail: `{ id, domain, contactEmail, domainAuthority, relevanceScore, topics, trafficEstimate }`.

### 2. Outreach Templates
- `GET /api/v1/outreach/templates?prospectId=` — list generated templates.
- `POST /api/v1/outreach/templates` — AI-generate. Body: `{ prospectId, brandId, variant: "cold"|"follow-up"|"value-offer"|"content-swap" }` → `{ id, variantName, subject, body }`.
- `PUT /api/v1/outreach/templates/:id` — update `{ subject?, body? }`.

### 3. Performance Monitoring
- `GET /api/v1/performance/pages` — query `limit`, `offset`, `sortBy` (e.g. `rankChange`). Returns `{ pages: [{ id, path, title, currentRank, prevRank, impressions, clicks }] }`.
- `GET /api/v1/performance/pages/:id` — detail: `{ ranks: RankPoint[], impressionsSeries: ImpressionPoint[], aiVisibility: AiVisibilitySignal[] }`.
- `GET /api/v1/performance/domain-health` — composite `{ score, grade, factors[], delta, backlinksAcquired, backlinksOpportunities }`.

### 4. Alerts
- `GET /api/v1/alerts` — query `severity`, `type`. Returns `{ alerts: [{ id, type, severity, title, description, recommendedAction: { label, href }, metric?, createdAt }] }`.
- `PATCH /api/v1/alerts/:id` — `{ read: true }` (mark read).

### 5. Dashboard + supporting (UI-serving; added beyond the original draft)
- `GET /api/v1/dashboard/kpis` — Authority HQ KPI strip: `KpiMetric[]` (id, label, value, delta, spark[]).
- `GET /api/v1/backlinks` — backlink profile by status (`live | pending | lost | broken`).
- `GET /api/v1/activity` — recent activity feed events.
- `GET /api/v1/brand-profile` — `{ company, url, topics, valueProp, contactName, contactEmail, industry }` (behind `BrandProfileSource`; brand-memory product swaps in later).

### 6. Admin / utilities
- `GET /api/v1/health` — public `{ status: "ok" }`.
- `GET /api/docs` — Swagger UI; `GET /api/docs-json` — OpenAPI 3 JSON.

---

## Reconciliation with locked decisions + current code
*(GEOSEO-specific notes — where this spec needs adjusting before codegen.)*

1. **Data source = DataForSEO, not UnifAPI/VebAPI.** The spec's "Integrations" aside names example vendors; we locked **DataForSEO** (see PRD). The NestJS service layer calls DataForSEO behind the `SeoDataProvider` interface — endpoints transform its payloads into the shapes above.
2. **Field names should match `@geoseo/types` (already the UI contract).** The spec is internally inconsistent (`domainAuthority` in the list vs `authorityScore` in detail). Canonical = the types package: `domainAuthority`, `relevanceScore`, `impactScore`. Carry `impactScore` (the UI's primary ranking key) into the API — the draft omits it.
3. **Opportunities are workspace-scoped, `pageId` optional.** The draft marks `pageId` required, but the live UI lists prospects per workspace/brand, not per page. Make `pageId` an optional filter; scope by the bearer token's tenant.
4. **Outreach variants are an enum** — `cold | follow-up | value-offer | content-swap` (now implemented in the mock drafter). The `POST` `variant` field should be this enum, not a free-text `tone`.
5. **Add `GET /performance/domain-health`** — Authority HQ needs the composite health gauge; the draft has no endpoint for it.
6. **Alert actions** carry a structured `recommendedAction { label, href }` (matches the UI), not a flat `message` — keep the structured form.
7. **Brand profile endpoints** (for outreach variable-fill) sit behind `BrandProfileSource`; add `GET /api/v1/brand-profile` when the brand-memory product is wired (standalone for now).

## Status
- **Reconciliation fixes 1–7: applied** and locked into the endpoint definitions above (2026-06-12).
- **Implemented** in `apps/api` (NestJS), mock-backed via `@geoseo/mock` behind the `SeoDataProvider` / `OutreachDrafter` / `BrandProfileSource` DI tokens (`SEO_PROVIDER`, etc.). DataForSEO + Claude + brand-memory swap in behind those tokens with no controller changes.
- **OpenAPI** auto-generated by `@nestjs/swagger` → `/api/docs` (UI) + `/api/docs-json`.
- Pagination defaults: `limit` 25 (max 100), `offset` 0. Auth: dev-permissive guard (`API_AUTH_REQUIRED=true` enforces `Bearer ${DEV_API_TOKEN}`); Clerk JWT verification is the production swap. Per-scope rate limits: future.
