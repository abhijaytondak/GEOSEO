# GEOSEO Sellable Product Upgrade Plan

This document is the implementation brief for taking GEOSEO from a strong prototype
to a polished, secure, scalable product that can be confidently demoed and sold.
It turns the audit gaps into an execution plan across functionality, performance,
quality, UI/UX, visual design, security, and future-proof architecture.

## 1. Product Bar

GEOSEO should feel like a premium AI SaaS product for growth teams, founders,
content operators, and agencies. The user should be able to open the app, understand
what changed, trust the recommendations, act on them, and see visible progress.

The target experience:

- Every visible button does something real, useful, and reversible when needed.
- Every workflow has loading, empty, success, error, and retry states.
- Every data mutation is optimistic only when rollback is implemented.
- The interface feels fast under real use, including mobile and slower networks.
- The visual system feels expensive, calm, operational, and trustworthy.
- The product is safe to demo without exposing secrets or crashing on missing services.
- The codebase is modular enough for real auth, billing, queues, analytics, and data providers.

## 2. Current Audit Summary

The current branch has a broad feature surface and static checks pass:

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm build` passes, but logs noisy API fallback warnings during build.
- API smoke is mostly green for jobs, alerts, content, settings, and backlink opportunity mutations.

Important gaps to close before selling:

- Discovered backlink prospects cannot open outreach drafts because outreach only searches base mock SEO prospects.
- Several visible controls are inert or local-only, especially Pages header discovery, sidebar upgrade CTA, and publishing settings.
- Prospect metadata editing is incomplete in the frontend.
- Opportunity and Performance exports start simulated jobs but do not produce downloadable output.
- Build is not clean enough; fallback warnings should not appear as scary errors.
- Current code uses Supabase/Postgres when `.env` exists, which conflicts with the earlier mock-only PRD unless we formalize two modes.
- UI polish is good but inconsistent across product areas; Page Engine and Authority areas need one unified premium product feel.
- Chart-heavy routes are not optimized for bundle size.
- Security is still prototype-grade: dev-permissive auth, incomplete tenant isolation, no full RBAC, limited validation/rate limiting/audit coverage.

## 3. Product Modes

Implement and document two explicit runtime modes.

### 3.1 Demo Mode

Demo Mode is the sales-safe mode. It must work with no external credentials.

Requirements:

- No Supabase, Clerk, Stripe, DataForSEO, Claude, CRM, CMS, or ad-platform credentials required.
- In-memory or local mock state only.
- Seed data resets cleanly on restart unless a local mock persistence flag is enabled.
- All jobs are simulated with realistic progress and completion.
- Every integration says "Demo connected", "Needs setup", or "Disabled" without calling a real provider.
- No real customer data, secrets, or personal API keys in the interface or logs.

Environment:

```bash
GEOSEO_MODE=demo
API_AUTH_REQUIRED=false
DATABASE_URL=
```

### 3.2 Production-Ready Mode

Production-ready mode can use real persistence and real integrations, but only behind
interfaces and feature flags.

Requirements:

- `DATABASE_URL` allowed only when `GEOSEO_MODE=production` or `GEOSEO_MODE=staging`.
- Auth must be enforced.
- Tenant scoping must be mandatory.
- Secrets must be read only from server environment variables.
- External calls must have timeouts, retries, observability, and safe failure states.

Environment:

```bash
GEOSEO_MODE=production
API_AUTH_REQUIRED=true
DATABASE_URL=...
CLERK_SECRET_KEY=...
```

## 4. Completion Priorities

### P0: Demo Must Not Break

These are blockers for selling.

1. Fix discovered-prospect outreach.
   - `OutreachController` must use the same prospect source as `BacklinkController`.
   - Discovered prospects should be draftable immediately.
   - Archived prospects should return a clear not-found state.
   - Acceptance: discover a prospect, open outreach, edit draft, save draft, copy draft, open mailto.

2. Add prospect metadata editing.
   - Add edit drawer or inline modal for `contactEmail`, `tags`, `notes`, and `status`.
   - Show saved state and rollback on API failure.
   - Acceptance: update metadata, refresh page, updated data remains available in current state mode.

3. Remove or wire every inert visible control.
   - Pages header "Discover opportunities" should open the discovery input or route to `/research`.
   - Sidebar "Upgrade to Pro" should open Billing tab or a pricing modal.
   - Publishing toggles should save to settings or publishing mock state.
   - Acceptance: no visible button is decorative unless clearly disabled with reason.

4. Make exports real in demo.
   - Opportunities export downloads CSV.
   - Performance export downloads CSV or JSON summary.
   - Export job can still run, but user must receive an artifact.
   - Acceptance: click export, file downloads, toast confirms row count.

5. Clean build output.
   - Avoid logging Dynamic Server Usage exceptions as network errors.
   - Mark all API-backed app routes as dynamic where intended.
   - Keep fallback warnings quiet during build.
   - Acceptance: `pnpm build` exits 0 without scary API fallback stack traces.

### P1: Sellable Product Quality

1. Add robust page-level states.
   - Loading skeleton per route.
   - Error boundary per route with retry.
   - Empty states per filtered list.
   - Save failure and retry states for every mutation.

2. Add confirmation dialogs instead of `window.confirm`.
   - Archive prospect.
   - Remove team member.
   - Delete lead.
   - Rollback page.
   - Publish page if SEO warnings exist.

3. Add global command/search behavior.
   - Topbar search should search across pages, prospects, alerts, and leads.
   - Use a command palette for desktop and mobile search sheet for mobile.
   - Empty state should suggest next actions.

4. Add a real job center.
   - Job drawer should support retry, cancel, completion history, and direct navigation to result.
   - Failed jobs must display error details and retry CTA.
   - Completed export jobs should expose download links.

5. Unify Page Engine and Authority product surfaces.
   - Same panel rhythm.
   - Same status badge language.
   - Same action placement.
   - Same empty/loading/error treatments.
   - Same responsive list behavior.

### P2: Scale and Production Readiness

1. Real auth and tenant model.
   - Clerk JWT verification.
   - Workspace extraction from token/session.
   - RBAC roles: owner, admin, marketer, analyst.
   - Every API read/write scoped by `workspaceId`.

2. Real background jobs.
   - Add queue adapter interface.
   - Demo implementation stays in memory.
   - Production implementation uses BullMQ/Redis or equivalent.
   - All long work creates a durable job record.

3. Repository layer.
   - Controllers should not know storage details.
   - Stores should become repository-backed services.
   - Mock repository and Postgres repository implement the same interface.

4. External integration adapters.
   - DataForSEO adapter.
   - CMS publishing adapter.
   - CRM adapter.
   - Email/outreach adapter.
   - AI model adapter.
   - Each adapter has mock, disabled, and real implementations.

## 5. UI/UX Upgrade Plan

## 5.1 Experience Principles

The UI should feel like a top-tier analytics and AI-operations cockpit.

Principles:

- Clarity first: every screen answers "what changed, why it matters, what should I do?"
- Action close to context: put actions next to the data they affect.
- Explain confidence: show rationale, source, freshness, and expected impact.
- No dead ends: every empty state has a creation, reset, or navigation action.
- Calm motion: motion confirms state change; it should not decorate randomly.
- Mobile is operational: not a shrunken desktop table.

## 5.2 Navigation and Information Architecture

Recommended top-level sections:

- Authority HQ
- Opportunities
- Content
- Performance
- Alerts
- Page Engine
- Leads
- Brand Memory
- Settings

Upgrade:

- Add workspace switcher with current workspace, domain, and role.
- Add command palette for search and create actions.
- Replace hard-coded nav badges with API-backed counts.
- Add breadcrumbs or route identity for deep pages.
- Use one "Create" button with menu: run audit, discover prospects, generate page, add team member.

## 5.3 Screen-by-Screen UX Requirements

### Authority HQ

Complete:

- Run audit starts job and shows result summary.
- Audit result links to affected opportunities, content, and alerts.
- Acquire backlinks starts acquisition job and navigates to filtered opportunities.
- KPI cards should show trend, confidence, and last updated timestamp.

Polish:

- Add "Recommended next action" band.
- Add "Impact this week" summary.
- Add "Data freshness" badge.

### Opportunities

Complete:

- Discover more creates prospect and immediately makes outreach available.
- Export downloads CSV.
- Edit prospect metadata: status, owner, tags, contact, notes.
- Archive and reject are distinct actions.
- Outreach draft save persists in current mode.

Polish:

- Mobile list cards instead of wide table only.
- Bulk select: update status, export, archive.
- Details drawer with source, rationale, fit score, history, and next best action.
- Empty filters should include "Reset filters" and "Discover more".

### Performance

Complete:

- Date range changes actual chart data or query state.
- Export downloads report.
- Tracked-page drilldown shows rank, impressions, clicks, and AI mentions.
- Add page-level retry states for failed data loads.

Polish:

- Dynamic chart loading.
- Metric card stable heights.
- Trend annotations for major drops.
- "Explain change" mock AI summary.

### Alerts

Complete:

- Mark read, mark all read, resolve, thresholds.
- Alert recommended action should route to specific context.
- Resolved alerts should be hideable/restorable.

Polish:

- Alert grouping by severity and workflow.
- One-click action preview.
- Snooze alert in demo mode.

### Content

Complete:

- Rescan, refresh stale pages, refresh single page, apply internal links.
- Show queued, applied, failed, and completed states.
- Link suggestions should update counts and list state.

Polish:

- Add content decay timeline.
- Add "before/after refresh recommendation" preview.
- Add internal-link impact explanation.

### Brand Memory

Complete:

- Save/revert/copy context.
- Visible save error state.
- Version history should refresh after save/revert.

Polish:

- Add confidence/completeness sections.
- Add source history.
- Add "used by" preview showing Outreach and Content examples.

### Settings

Complete:

- Profile, integrations, team, notifications, billing placeholder.
- Publishing settings must save somewhere.
- Integration toggle should distinguish connect, disconnect, reconnect, needs attention.

Polish:

- Add environment/mode badge: Demo or Production.
- Add security tab: auth status, API mode, audit log link.
- Add billing upgrade modal from sidebar CTA.

### Page Engine

Complete:

- Wire Pages header discovery CTA.
- Publishing settings must persist.
- Page editor, publish, rollback, leads, and research flows should have confirmations and errors.

Polish:

- One unified pipeline visualization: Research -> Blueprint -> Draft -> Review -> Publish -> Leads.
- Add page health score with reasons.
- Add publish checklist.

## 6. Visual Design Upgrade Plan

## 6.1 Visual Direction

Keep the current light analytics SaaS base, but raise the finish.

Target feel:

- Premium B2B operating system.
- Quiet, high-contrast, fast to scan.
- White panels, cool gray canvas, violet accent, black primary CTAs.
- Status colors used sparingly and consistently.
- No oversized marketing hero inside the app.

## 6.2 Design System Rules

Standardize:

- Panel radius: 12 to 16 px, consistently.
- Repeated item card radius: 8 to 12 px.
- Primary CTA: black pill.
- Secondary action: white bordered button.
- Destructive action: icon button with confirmation.
- Status: pill badge with semantic colors.
- Numbers: tabular numerals.
- Tables: sticky action area or responsive card conversion.

Avoid:

- Decorative gradients that do not carry meaning.
- Nested cards inside cards.
- One-off button styles.
- Random icon sizes.
- Text-only controls where icons improve scanability.

## 6.3 Premium Micro-Interactions

Add:

- Button press feedback.
- Drawer and dialog entrance/exit.
- Optimistic row state shimmer.
- KPI value soft transition.
- Job progress easing.
- Copy-to-clipboard success state.
- Save button state: idle, saving, saved, failed.

Rules:

- Honor `prefers-reduced-motion`.
- Motion duration should usually be 120 to 280 ms.
- Loading should feel stable, not jumpy.
- Never animate layout in a way that hides content.

## 7. Performance Plan

## 7.1 Frontend Performance

Targets:

- Lighthouse Performance: 90 plus in demo routes.
- Interaction to Next Paint: under 200 ms for common interactions.
- Route transition perceived response: under 100 ms.
- No major layout shift from skeletons, tables, or drawers.

Actions:

- Dynamically import Recharts-heavy components.
- Keep page data loading in Server Components.
- Keep interactive client components small.
- Split `api-client` fallback mocks so client bundles do not import all `@geoseo/mock`.
- Memoize expensive filters and sort operations.
- Use stable dimensions for cards, tables, charts, and skeletons.
- Virtualize only if lists exceed 200 rows.
- Cache safe GETs per route where product behavior allows it.

## 7.2 API Performance

Targets:

- Local demo API response under 100 ms for mock reads.
- Mutations under 250 ms before simulated job work.
- No external provider call blocks page render without timeout.

Actions:

- Add request timeout wrapper for external providers.
- Add pagination to every list endpoint.
- Add sort/filter query handling where UI exposes it.
- Add response shape tests for top routes.
- Avoid N+1 repository access once real DB is enabled.

## 7.3 Build Performance and Clean Output

Requirements:

- `pnpm build` must pass without scary fallback stack traces.
- Dynamic routes should declare `dynamic = "force-dynamic"` where appropriate.
- Fallback logging should distinguish real network failure from Next dynamic render behavior.
- CI should fail on TypeScript, lint, and build errors.

## 8. Code Quality Plan

## 8.1 Architecture

Target layers:

```text
Controller -> Service -> Repository/Provider Adapter -> Storage or External API
Web Route -> API Client -> Component Workflow -> UI Primitive
```

Rules:

- Controllers validate input and call services.
- Services own business logic.
- Repositories own storage details.
- Providers own external API calls.
- UI components own interaction state only.
- Shared domain types live in `packages/types`.
- Mock data stays in `packages/mock`.

## 8.2 Testing

Add:

- API unit tests for stores/services.
- API smoke tests for PRD workflows.
- Web component tests for key interactions where practical.
- Playwright smoke for main routes and critical flows.
- Accessibility smoke for dialogs, drawers, keyboard nav, and labels.

Required test workflows:

- Discover backlink prospect -> edit metadata -> outreach draft -> save -> archive.
- Run audit job -> progress -> completion.
- Export opportunities -> file exists.
- Alert read/resolve/thresholds.
- Content rescan/refresh/apply links.
- Brand save/revert/copy.
- Settings profile/team/integration/notifications.
- Page Engine discover -> generate -> edit -> submit -> approve -> publish -> lead capture.

## 8.3 Error Handling

Every mutation should implement:

- Optimistic update only when rollback is implemented.
- Loading state.
- Success toast.
- Error toast with meaningful message.
- Retry path where appropriate.
- Console logging only for developer-relevant details, not user secrets.

## 9. Security Plan

## 9.1 Immediate Demo Security

Do now:

- Remove secrets from docs and screenshots.
- Never expose `DATABASE_URL`, AI keys, or API tokens to client bundles.
- Add a visible Demo Mode indicator.
- Disable real external calls in Demo Mode.
- Redact logs for authorization headers, cookies, tokens, and emails where possible.
- Ensure CORS only allows expected origins.
- Keep browser client on same-origin `/api/v1`.

## 9.2 Production Security

Add before real customers:

- Clerk JWT verification in `BearerGuard`.
- Workspace and role extraction from token.
- RBAC on every mutation.
- Tenant isolation at API and DB query level.
- Rate limits per route and tenant.
- Input validation with DTOs and strict schemas.
- Output encoding for user-generated content.
- CSRF protection if cookie auth is used.
- Secure headers in Next.js and API.
- Audit log for create, update, delete, publish, export, integration changes, billing changes.
- Dependency vulnerability scanning in CI.
- Secret scanning in CI.
- Structured security review before launch.

## 9.3 Data Privacy

Requirements:

- Separate demo data from production data.
- Add data retention policy for exports and jobs.
- Add customer data deletion path.
- Avoid logging raw outreach bodies or lead messages in production logs.
- Mark PII fields in types and logs.

## 10. Scalability Plan

## 10.1 Multi-Tenant Readiness

Every persisted entity must include:

- `workspaceId`
- `createdAt`
- `updatedAt`
- `createdBy` where user action matters

Every list endpoint must support:

- pagination
- filters
- stable sort
- workspace scoping

## 10.2 Background Work

Job types:

- audit
- discover
- acquire-backlinks
- export
- content-rescan
- content-refresh
- internal-links
- settings-sync
- page-generate
- page-publish
- lead-sync

Job model should include:

- id
- workspaceId
- type
- status
- progress
- description
- result
- error
- artifactUrl
- createdAt
- startedAt
- completedAt
- cancelledAt

## 10.3 Integration Expansion

Use adapter contracts:

- `SeoDataProvider`
- `OutreachDrafter`
- `BrandProfileSource`
- `PublishingProvider`
- `CrmProvider`
- `BillingProvider`
- `EmailProvider`
- `QueueProvider`

Each adapter must have:

- mock implementation
- disabled implementation
- production implementation
- timeout policy
- error mapping
- health check

## 11. Sales-Readiness Requirements

Before showing to prospects:

- Demo Mode runs with one command.
- All main routes render without external credentials.
- All visible CTAs are functional.
- Seed data looks realistic and coherent.
- Jobs complete with believable progress.
- Exports download real files.
- No raw stack traces appear in UI.
- No console errors during demo flows.
- Mobile works at 375 px.
- Tablet works at 768 px.
- Desktop looks polished at 1440 px and above.
- Pricing or upgrade CTA leads somewhere credible.
- Product has a simple narrative:
  1. Find growth opportunities.
  2. Generate or improve assets.
  3. Publish and monitor.
  4. Capture leads.
  5. Prove ROI.

## 12. Implementation Phases

### Phase 1: Demo Completion

Goal: Make everything visible functional.

Tasks:

- Fix discovered prospect outreach.
- Add prospect edit modal/drawer.
- Wire inert Pages discovery CTA.
- Wire Upgrade to Pro to Billing or pricing modal.
- Persist publishing settings in mock/settings state.
- Add real CSV exports for Opportunities and Performance.
- Replace `window.confirm` with shared confirmation dialog.
- Clean build fallback logging.

Acceptance:

- Static checks pass.
- API smoke passes.
- Browser QA passes on all primary routes.
- No inert visible CTA remains.

### Phase 2: UX and Visual Upgrade

Goal: Make the product feel premium and cohesive.

Tasks:

- Unify empty/loading/error states.
- Add mobile card layouts for wide tables.
- Add route-level skeletons.
- Add polished job center.
- Add command palette.
- Add status/rationale/detail drawers.
- Normalize spacing, radius, badges, and actions.
- Add reduced-motion-safe micro-interactions.

Acceptance:

- Desktop and mobile screenshots look consistent.
- No clipped text at 375 px.
- Touch targets are at least 44 px on mobile.
- Keyboard focus is visible.

### Phase 3: Performance and Stability

Goal: Make the app fast and quiet.

Tasks:

- Dynamically import charts.
- Split mock fallback out of client bundles.
- Add stable skeleton dimensions.
- Add route and API timing logs.
- Add Playwright smoke.
- Add API smoke script.
- Add CI commands.

Acceptance:

- Build output is clean.
- Main route bundles are smaller.
- No layout shift from loading states.

### Phase 4: Security and Scale Foundation

Goal: Prepare for real customers without rewriting.

Tasks:

- Add explicit Demo/Production mode gate.
- Add DTO validation.
- Add tenant-aware interfaces.
- Add RBAC placeholders and enforcement hooks.
- Add rate limit guard.
- Add audit coverage for all important mutations.
- Add repository interfaces for mock and Postgres.

Acceptance:

- Demo mode requires no credentials.
- Production mode refuses to boot without required security config.
- No API route mutates cross-workspace data.

### Phase 5: Sellable Packaging

Goal: Make it easy to sell and demo.

Tasks:

- Add guided demo data reset.
- Add sample workspace personas.
- Add ROI summary cards.
- Add exportable executive report.
- Add onboarding checklist.
- Add pricing/plan state.
- Add release notes and demo script.

Acceptance:

- A prospect can understand value in under 5 minutes.
- A demo can run end-to-end without manual database edits.
- The app shows measurable outcomes, not just activity.

## 13. Definition of Done

A feature is done only when:

- It is API-backed or explicitly mock-backed through the same client pattern.
- It has loading, empty, error, success, and retry behavior where relevant.
- It works on mobile, tablet, and desktop.
- It is keyboard accessible.
- It has no console errors in the happy path.
- It passes typecheck and lint.
- It has smoke coverage if it is part of a sales demo.
- It has no secret exposure.
- It fits the visual system.

## 14. Verification Checklist

Run before marking the upgrade complete:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

API smoke:

- Create/list/get job.
- Discover/update/archive backlink prospect.
- Draft outreach for discovered prospect.
- Save outreach draft.
- Mark/read/resolve alerts.
- Update thresholds.
- Queue content rescan/refresh.
- Apply internal links.
- Read/update settings.
- Add/remove team member.
- Toggle integration.
- Export opportunities.
- Export performance report.

Browser QA:

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

Responsive QA:

- 375 px mobile.
- 768 px tablet.
- 1440 px desktop.

Accessibility QA:

- Keyboard navigation.
- Focus visible.
- Dialog and drawer labels.
- Escape closes modal surfaces.
- Reduced motion.
- Icon-only controls have accessible labels.

## 15. Immediate Next Tasks for Claude/Codex

Start here:

1. Fix discovered prospect outreach by making outreach prospect lookup use `OpportunitiesStore.list(baseProspects)`.
2. Add `PATCH` support for prospect `contactEmail`, `tags`, and `notes` in the Opportunities UI.
3. Add real CSV download for Opportunities export.
4. Add real CSV/JSON download for Performance export.
5. Wire Pages header "Discover opportunities" to `/research` or the page discovery panel.
6. Wire "Upgrade to Pro" to Settings Billing tab or a pricing modal.
7. Persist Publishing Settings toggles through the settings/publishing API.
8. Replace `window.confirm` with shared confirmation dialog.
9. Clean build fallback warnings.
10. Add Browser QA pass and screenshots for main routes.

