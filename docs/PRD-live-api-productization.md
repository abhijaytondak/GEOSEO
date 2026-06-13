# PRD - Live API Productization

## 1. Objective

Convert GEOSEO from a prototype with mock fallbacks into a live, API-driven,
sellable product where every visible workflow is backed by real application APIs,
real persistence, real state transitions, and verified end-to-end behavior.

This PRD is written as an implementation brief for Claude Code.

The target outcome:

- No dummy data in user-facing production mode.
- No frontend route depends on `@geoseo/mock`.
- Every visible button, menu, drawer, modal, export, and status change is functional.
- Every workflow reads from and writes to APIs.
- Every API route needed by the UI exists and returns typed responses.
- All workflows are stitched together so actions in one area update related areas.
- The app can be demoed and sold as a coherent product.

## 2. Product Principle

The product must stop feeling like a static dashboard and start behaving like a
real operating system for GEOSEO workflows.

Every user action should have one of these outcomes:

- Navigate to real context.
- Create or update a persisted record.
- Start a trackable background job.
- Export a real artifact.
- Open a real edit/review workflow.
- Show a clear permission or setup reason if unavailable.

No action should silently do nothing.

## 3. Non-Negotiable Requirements

1. The web app must be API-driven.
   - `apps/web` must not import `@geoseo/mock` for user-facing data.
   - All route data must come from API clients.
   - All mutations must go through API endpoints.

2. Production mode must not use mock data.
   - Mock data may exist only for tests or explicit local demo mode.
   - Production/staging must fail closed when required services are missing.

3. Every workflow must be stitched.
   - Discovering a prospect must make it searchable, editable, draftable, exportable, and visible in relevant counts.
   - Refreshing content must update content state, jobs, activity, alerts, and relevant overview modules.
   - Publishing a page must update pages, sitemap, `llms.txt`, leads attribution, activity, and analytics.

4. Every visible control must be functional.
   - No inert buttons.
   - No local-only settings pretending to save.
   - No fake exports.
   - No "Coming Soon" in sellable flows.

5. Every important workflow must have verification.
   - Static checks.
   - API smoke tests.
   - Browser QA.
   - Mobile QA.

## 4. Runtime Modes

## 4.1 Production Mode

Production mode is for real customers.

Requirements:

```bash
GEOSEO_MODE=production
API_AUTH_REQUIRED=true
DATABASE_URL=required
```

Rules:

- Auth is required.
- Workspace scoping is required.
- Real persistence is required.
- Mock fallback is disabled.
- Missing required configuration prevents boot.
- Secrets never reach browser bundles.

## 4.2 Staging Mode

Staging mode mirrors production but may use sandbox credentials.

Rules:

- Auth required.
- Real database required.
- External providers may use sandbox adapters.
- Mock fallback disabled unless explicitly enabled per provider for testing.

## 4.3 Demo Mode

Demo mode is allowed for sales demos only, but it must be explicit.

Rules:

- Clear "Demo Mode" indicator in UI.
- Uses demo database or in-memory repository.
- No silent fallback in production paths.
- Demo data must look realistic and be resettable.

Demo mode is not a substitute for production implementation.

## 5. Architecture Target

Use clear layers.

```text
Web Route or Client Component
  -> Typed API Client
  -> NestJS Controller
  -> Service
  -> Repository
  -> Database or External Provider
```

Rules:

- Controllers validate input and shape responses.
- Services own business workflows.
- Repositories own persistence.
- Provider adapters own external integrations.
- Web components never import database or mock modules.
- Shared contracts live in `packages/types`.

## 6. Data and Persistence

## 6.1 Required Database Foundation

Every persisted entity must include:

- `id`
- `workspaceId`
- `createdAt`
- `updatedAt`
- `createdBy` when user-created
- `updatedBy` when user-mutated

Production entities:

- workspaces
- users or workspace members
- brand profiles
- brand memory versions
- backlink prospects
- prospect activity
- outreach drafts
- backlinks
- tracked pages
- rank series
- impression series
- AI visibility signals
- alerts
- content recommendations
- internal link suggestions
- generated pages
- page versions
- page opportunities
- page blueprints
- leads
- jobs
- job artifacts
- exports
- audit events
- settings
- integrations
- saved searches

## 6.2 Repository Interfaces

Create repository interfaces for every domain:

- `WorkspaceRepository`
- `SettingsRepository`
- `BrandRepository`
- `ProspectRepository`
- `OutreachRepository`
- `PerformanceRepository`
- `AlertRepository`
- `ContentRepository`
- `PageEngineRepository`
- `LeadRepository`
- `JobRepository`
- `SearchRepository`
- `AuditRepository`

Each repository must support:

- production database implementation
- test implementation
- explicit demo implementation if needed

## 7. API Requirements

All APIs must:

- Use `/api/v1`.
- Return `{ success, data, errors }`.
- Validate input.
- Scope by workspace.
- Enforce auth/role permissions in production.
- Return useful errors.
- Never expose secrets.
- Use pagination for lists.
- Support filtering and sorting where UI exposes it.

## 7.1 Core API Groups

### Workspaces

```text
GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/:id
PATCH  /api/v1/workspaces/:id
DELETE /api/v1/workspaces/:id
```

### Settings

```text
GET    /api/v1/settings
PUT    /api/v1/settings
PATCH  /api/v1/settings/integrations/:id
POST   /api/v1/settings/team
PATCH  /api/v1/settings/team/:id
DELETE /api/v1/settings/team/:id
PUT    /api/v1/settings/publishing
GET    /api/v1/settings/publishing
```

### Authority Overview

```text
GET  /api/v1/overview/authority
POST /api/v1/overview/authority/export
```

### Jobs

```text
GET  /api/v1/jobs
POST /api/v1/jobs
GET  /api/v1/jobs/:id
POST /api/v1/jobs/:id/cancel
POST /api/v1/jobs/:id/retry
GET  /api/v1/jobs/:id/artifacts
```

### Backlink Opportunities

```text
GET    /api/v1/backlink/opportunities
POST   /api/v1/backlink/opportunities/discover
GET    /api/v1/backlink/opportunities/:id
PATCH  /api/v1/backlink/opportunities/:id
DELETE /api/v1/backlink/opportunities/:id
POST   /api/v1/backlink/opportunities/:id/restore
GET    /api/v1/backlink/opportunities/:id/activity
POST   /api/v1/backlink/opportunities/:id/activity
POST   /api/v1/backlink/opportunities/export
POST   /api/v1/backlink/opportunities/bulk
```

### Outreach

```text
GET  /api/v1/outreach/templates?prospectId=
POST /api/v1/outreach/templates
PUT  /api/v1/outreach/templates/:id
POST /api/v1/outreach/templates/:id/copy-event
POST /api/v1/outreach/templates/:id/send-event
```

### Performance

```text
GET  /api/v1/performance/overview
GET  /api/v1/performance/rank-series
GET  /api/v1/performance/impression-series
GET  /api/v1/performance/ai-visibility
GET  /api/v1/performance/pages
GET  /api/v1/performance/pages/:id
POST /api/v1/performance/export
```

### Alerts

```text
GET   /api/v1/alerts
PATCH /api/v1/alerts/:id
POST  /api/v1/alerts/mark-all-read
POST  /api/v1/alerts/:id/resolve
POST  /api/v1/alerts/:id/snooze
PUT   /api/v1/alerts/thresholds
GET   /api/v1/alerts/thresholds
```

### Content

```text
GET  /api/v1/content/overview
GET  /api/v1/content/internal-links
POST /api/v1/content/rescan
POST /api/v1/content/refresh
POST /api/v1/content/internal-links/apply
GET  /api/v1/content/recommendations
POST /api/v1/content/recommendations/:id/apply
```

### Brand Memory

```text
GET  /api/v1/brand-profile
PUT  /api/v1/brand-profile
GET  /api/v1/brand-profile/versions
POST /api/v1/brand-profile/revert/:id
POST /api/v1/brand-profile/extract-from-site
POST /api/v1/brand-profile/export-context
```

### Page Engine

```text
GET    /api/v1/opportunities
POST   /api/v1/opportunities/discover
GET    /api/v1/opportunities/:id
POST   /api/v1/opportunities/:id/approve
POST   /api/v1/opportunities/:id/reject
POST   /api/v1/opportunities/:id/defer

GET    /api/v1/page-blueprints
POST   /api/v1/page-blueprints
GET    /api/v1/page-blueprints/:id
PUT    /api/v1/page-blueprints/:id
POST   /api/v1/page-blueprints/:id/approve

GET    /api/v1/pages
POST   /api/v1/pages/generate
GET    /api/v1/pages/:id
PUT    /api/v1/pages/:id
DELETE /api/v1/pages/:id
POST   /api/v1/pages/:id/submit
POST   /api/v1/pages/:id/approve
POST   /api/v1/pages/:id/publish
POST   /api/v1/pages/:id/refresh
GET    /api/v1/pages/:id/versions
POST   /api/v1/pages/:id/rollback/:versionId
```

### Leads

```text
GET    /api/v1/leads
GET    /api/v1/leads/:id
PUT    /api/v1/leads/:id
DELETE /api/v1/leads/:id
POST   /api/v1/leads/export
POST   /api/v1/leads/:id/sync
```

### Search

```text
GET    /api/v1/search
GET    /api/v1/search/saved
POST   /api/v1/search/saved
PATCH  /api/v1/search/saved/:id
DELETE /api/v1/search/saved/:id
POST   /api/v1/search/events
```

### Public Surfaces

```text
GET  /api/v1/public/pages
GET  /api/v1/public/pages/:slug
POST /api/v1/public/leads
GET  /sitemap.xml
GET  /llms.txt
```

## 8. Workflow Stitching Requirements

## 8.1 Authority HQ

Must be live-backed by:

- authority overview API
- jobs API
- alerts API
- backlink opportunities API
- performance API
- activity/audit API

Required stitched behavior:

- Run audit creates a job, updates activity, can create alerts and recommendations.
- Acquire backlinks creates discovery/acquisition job and updates opportunities.
- KPI card clicks navigate to filtered detail views.
- Export creates real artifact.

## 8.2 Backlink Opportunities

Required stitched behavior:

- Discover more creates persisted prospects.
- New prospects can immediately open outreach drafts.
- Prospect status changes update summary counts and activity.
- Edit contact/tags/notes persists.
- Archive/reject/restore are distinct.
- Export downloads real CSV.
- Acquired prospects update backlink momentum and overview.

## 8.3 Outreach

Required stitched behavior:

- Outreach drafts are API-backed.
- Draft edits persist.
- Copy/open mailto events are tracked.
- Missing contact email produces edit prompt.
- Drafts use current Brand Memory.

## 8.4 Performance

Required stitched behavior:

- Date range changes API query and displayed data.
- Export creates real CSV/JSON artifact.
- Page drilldown uses API.
- Refresh action creates content refresh job.
- Alerts and annotations link back to related jobs/actions.

## 8.5 Alerts

Required stitched behavior:

- Mark read, resolve, snooze, thresholds persist.
- Recommended action routes to exact workflow context.
- Resolved alert updates activity.
- Alerts created by audit/content/performance flows are visible.

## 8.6 Content

Required stitched behavior:

- Rescan creates job and recommendations.
- Refresh page creates job and updates state.
- Apply internal links persists and updates activity.
- Content actions can create/resolve alerts.

## 8.7 Brand Memory

Required stitched behavior:

- Save creates new version.
- Revert creates version or restores state.
- Outreach and content generation use latest Brand Memory.
- Extract from site persists only after user saves.

## 8.8 Settings

Required stitched behavior:

- Profile changes affect workspace display and publishing defaults.
- Integration toggles persist.
- Team CRUD persists.
- Notification preferences affect alert/digest logic.
- Publishing settings persist and affect page publishing.
- Billing/upgrade CTA opens real billing placeholder flow.

## 8.9 Page Engine

Required stitched behavior:

- Opportunity discovery creates persisted opportunities.
- Generate page creates persisted page and job/activity.
- Edit page creates version.
- Submit/approve/publish transitions persist.
- Publish updates public route, sitemap, and `llms.txt`.
- Lead capture links to source page.
- Rollback creates activity/audit event.

## 8.10 Leads

Required stitched behavior:

- Public form creates lead.
- Lead status changes persist.
- CRM sync creates job or sync state.
- Export downloads CSV.
- Delete persists and audits.

## 8.11 Search

Required stitched behavior:

- Search indexes live API data.
- Saved searches persist.
- Search result actions call real APIs.
- Search respects permissions and workspace.

## 9. Frontend Requirements

## 9.1 Remove Mock Imports

Must remove user-facing imports of `@geoseo/mock` from `apps/web`.

Allowed:

- tests
- story fixtures
- explicit demo-only development utilities

Not allowed:

- route data
- production client components
- API clients used by production routes

## 9.2 Typed API Clients

Create or refactor API clients:

- `api-client.ts` for core GEOSEO.
- `page-engine-client.ts` for page engine, or merge under one client if cleaner.
- `search-client.ts` if search complexity warrants it.

Requirements:

- No silent fallback for mutations.
- No production fallback to mock for GETs.
- 4xx errors surface.
- 5xx errors show UI error states.
- Auth headers handled server-side.
- Browser uses same-origin `/api/v1`.

## 9.3 UI State Requirements

Every route must have:

- loading state
- empty state
- error state with retry
- success state for mutations
- optimistic rollback where optimistic updates exist

## 10. Security Requirements

Production must include:

- Auth enforced.
- Workspace scoping enforced.
- RBAC checks on mutations and exports.
- Input validation.
- Output sanitization where user content renders.
- Rate limiting for search, exports, public leads, and mutations.
- Audit logging for create/update/delete/export/publish/integration/billing actions.
- No secrets in frontend bundles.
- No secrets in logs.
- CORS locked to expected origins.

## 11. External Provider Requirements

All providers must use adapters.

Required adapters:

- SEO data provider
- AI content provider
- Outreach drafting provider
- Publishing provider
- CRM provider
- Billing provider
- Search provider
- Queue provider

Each provider must have:

- real implementation
- disabled implementation with clear setup message
- test/demo implementation
- timeout policy
- retry policy
- error mapping
- health check

## 12. Jobs and Background Work

All long-running workflows must create jobs.

Job requirements:

- persisted job record
- status
- progress
- error
- result
- artifact link if export/report
- retry support
- cancel support where safe
- audit event on completion/failure

Job-backed workflows:

- audit
- prospect discovery
- backlink acquisition
- exports
- content rescan
- content refresh
- internal link apply
- page generation
- page publish
- CRM sync
- report generation

## 13. Export Requirements

No fake export buttons.

Required exports:

- Authority overview report
- Backlink opportunities CSV
- Performance CSV/JSON
- Leads CSV
- Page Engine report
- Search result export where applicable

Each export must:

- reflect current filters/date range
- produce downloadable artifact
- create audit event in production
- show success/error toast
- be role-aware

## 14. Observability

Add production-grade observability hooks:

- request logging with redaction
- API timing
- job timing
- error tracking
- audit events
- search analytics
- export analytics
- provider health checks

Do not log:

- auth headers
- API keys
- database URLs
- raw secrets
- sensitive lead message content unless explicitly allowed

## 15. Test Plan

## 15.1 Static Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Build must be clean:

- no scary fallback stack traces
- no type errors
- no lint errors
- no production mock warnings

## 15.2 API Smoke Tests

Create script:

```text
apps/api/scripts/smoke-live.mjs
```

Must test:

- auth behavior
- workspace scoping
- jobs create/list/get/retry/cancel
- authority overview
- prospects discover/update/edit/archive/restore/export
- outreach draft for newly discovered prospect
- performance overview/export
- alerts read/resolve/snooze/thresholds
- content rescan/refresh/apply links
- brand save/version/revert
- settings profile/team/integration/publishing
- page engine discover/generate/edit/publish/rollback
- public lead capture
- leads update/export/sync/delete
- search and saved searches

## 15.3 Browser QA

Routes:

- `/`
- `/opportunities`
- `/performance`
- `/alerts`
- `/content`
- `/brand`
- `/settings`
- `/dashboard`
- `/research`
- `/pages`
- `/leads`
- `/onboarding`
- `/search`

For each route:

- page renders
- no framework overlay
- no console errors
- loading/error/empty states where applicable
- mobile 375 px
- tablet 768 px
- desktop 1440 px

## 15.4 End-to-End Sales Demo Flow

Must work from fresh production-like data:

1. Create or select workspace.
2. Save Brand Memory.
3. Run authority audit.
4. Discover backlink prospects.
5. Edit prospect metadata.
6. Open and save outreach draft.
7. Export prospects.
8. Review performance trends.
9. Queue content refresh.
10. Resolve alert.
11. Discover page opportunity.
12. Generate page.
13. Edit page.
14. Submit, approve, publish.
15. Capture lead from public page.
16. Export leads.
17. Search across created objects.
18. Generate overview report.

## 16. Acceptance Criteria

The product is complete when:

- No user-facing production workflow uses dummy data.
- No user-facing frontend route imports `@geoseo/mock`.
- Every visible action is functional or permission-gated with explanation.
- Every route is API-driven.
- Every required API exists.
- Every mutation persists.
- Every export downloads a real artifact.
- Every background workflow creates a trackable job.
- Search finds live entities.
- Workflows update related dashboards and activity.
- Auth, workspace scoping, and role checks are enforced in production mode.
- Static checks pass.
- API smoke passes.
- Browser QA passes.
- Mobile QA passes.
- Sales demo flow passes end to end.

## 17. Implementation Phases

## Phase 1 - Stop the Bleeding

Goal: remove dummy behavior from critical demo paths.

Tasks:

- Add explicit runtime mode gate.
- Disable production mock fallback.
- Remove `@geoseo/mock` imports from web routes/components.
- Fix discovered prospect outreach.
- Wire all inert buttons.
- Add real exports for opportunities, performance, leads, and overview.
- Persist publishing settings.
- Clean build warnings.

## Phase 2 - Complete Core APIs

Goal: every UI workflow has an API.

Tasks:

- Add missing endpoints listed in this PRD.
- Add repository interfaces.
- Add validation DTOs.
- Add pagination/filter/sort to list endpoints.
- Add audit events.
- Add job artifacts.

## Phase 3 - Stitch Workflows

Goal: actions update the whole product.

Tasks:

- Wire audit to alerts, recommendations, jobs, activity.
- Wire acquired backlinks to overview.
- Wire content refresh to performance/activity.
- Wire page publish to public routes/sitemap/leads.
- Wire search to live data.

## Phase 4 - Production Security

Goal: safe for real customers.

Tasks:

- Enforce auth.
- Enforce workspace scoping.
- Add RBAC.
- Add rate limits.
- Redact logs.
- Add provider health checks.
- Add production boot checks.

## Phase 5 - Verification and Sales Readiness

Goal: sell with confidence.

Tasks:

- Add API smoke script.
- Add Browser QA script/checklist.
- Add demo reset/setup command.
- Add executive report.
- Add sales demo script.
- Record known limitations.

## 18. Immediate Task List for Claude

Start in this order:

1. Add `GEOSEO_MODE` config and fail-closed production behavior.
2. Remove production mock fallback from web API clients.
3. Remove `@geoseo/mock` imports from `apps/web`.
4. Fix discovered prospect outreach lookup.
5. Add prospect metadata edit API/UI.
6. Add real exports for Opportunities and Performance.
7. Wire Pages header discovery CTA.
8. Wire Upgrade CTA to Billing.
9. Persist Publishing Settings through API.
10. Add global search API and command palette from `PRD-global-search.md`.
11. Add Authority overview aggregate API.
12. Add Performance overview aggregate API.
13. Add smoke-live script.
14. Run static checks, API smoke, Browser QA, and mobile QA.

