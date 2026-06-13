# GEOSEO Sellable Product Upgrade Plan

Implementation brief for taking GEOSEO from a strong prototype to a polished,
secure, scalable product that can be confidently demoed and sold. Turns the audit
gaps into an execution plan across functionality, performance, quality, UI/UX,
visual design, security, and future-proof architecture.

> **Status (2026-06-13):** Phase 1 "Demo Completion" P0/P1 items are largely done
> (discovered-prospect outreach, prospect metadata edit UI, inert-CTA wiring, real
> CSV exports, publishing-settings persistence, clean build). Remaining: confirmation
> dialogs to replace `window.confirm`, command palette, mobile card layouts, and the
> Phase 4 security/scale foundation. See CLAUDE.md "Pick up here" for the live queue.

## 1. Product Bar
Premium AI SaaS for growth teams, founders, content operators, agencies. Open the
app, understand what changed, trust the recommendations, act, see visible progress.
- Every visible button does something real, useful, reversible when needed.
- Every workflow has loading, empty, success, error, retry states.
- Mutations are optimistic only when rollback is implemented.
- Fast under real use incl. mobile/slow networks.
- Visual system feels expensive, calm, operational, trustworthy.
- Safe to demo without exposing secrets or crashing on missing services.
- Modular enough for real auth, billing, queues, analytics, data providers.

## 2. Current Audit Summary
Static checks pass (`typecheck`, `lint`, `build`). API smoke green for jobs, alerts,
content, settings, backlink opportunity mutations.
Gaps closed this pass: discovered-prospect outreach; prospect metadata editing; inert
controls (Pages discover CTA, sidebar upgrade, publishing toggles); real exports; build
fallback noise. Remaining gaps: `window.confirm` everywhere; chart bundle size on more
routes; prototype-grade security (dev-permissive auth, no tenant isolation, no RBAC).

## 3. Product Modes
### 3.1 Demo Mode — sales-safe, no external credentials
`GEOSEO_MODE=demo`, `API_AUTH_REQUIRED=false`, `DATABASE_URL=`. In-memory/mock state,
seed resets on restart, simulated jobs, every integration shows Demo connected / Needs
setup / Disabled. No real data, secrets, or keys in UI or logs.
### 3.2 Production-Ready Mode
`DATABASE_URL` only when `GEOSEO_MODE=production|staging`. Auth enforced, tenant scoping
mandatory, secrets from server env only, external calls have timeouts/retries/observability.

## 4. Completion Priorities
### P0 — Demo must not break
1. Discovered-prospect outreach uses same source as `BacklinkController`. ✅ done
2. Prospect metadata edit (contactEmail, tags, notes, status) with saved state + rollback. ✅ done
3. Wire/remove every inert control (Pages discover → /research; Upgrade → settings; publishing toggles). ✅ done
4. Real exports — Opportunities CSV, Performance CSV/JSON, toast confirms row count. ✅ done
5. Clean build output — no Dynamic Server Usage stack traces, quiet fallback warnings. ✅ done
### P1 — Sellable quality
1. Robust page-level states (skeleton, error boundary + retry, empty, save-fail/retry).
2. Confirmation dialogs instead of `window.confirm` (archive, remove member, delete lead, rollback, risky publish).
3. Global command/search (palette desktop, sheet mobile) across pages/prospects/alerts/leads.
4. Real job center (retry, cancel, history, navigate-to-result, download links, error detail).
5. Unify Page Engine + Authority surfaces (panel rhythm, badges, action placement, states).
### P2 — Scale & production readiness
1. Real auth + tenant model (Clerk JWT verify, workspace from token, RBAC owner/admin/marketer/analyst, every read/write scoped by `workspaceId`).
2. Real background jobs (queue adapter interface; in-memory demo, BullMQ/Redis prod; durable job records).
3. Repository layer (controllers storage-agnostic; mock + Postgres repos behind one interface).
4. External integration adapters (DataForSEO, CMS, CRM, email/outreach, AI) each with mock/disabled/real.

## 5. UI/UX Upgrade
**Principles:** clarity first; action close to context; explain confidence (rationale,
source, freshness, expected impact); no dead ends; calm motion; mobile is operational.
**IA / nav:** Authority HQ, Opportunities, Content, Performance, Alerts, Page Engine,
Leads, Brand Memory, Settings. Add workspace switcher, command palette, API-backed nav
counts, breadcrumbs, single "Create" menu.
**Per-screen:** see source brief for Authority HQ, Opportunities, Performance, Alerts,
Content, Brand Memory, Settings, Page Engine — each lists Complete + Polish items
(mobile cards, bulk select, detail drawers, "explain change", health scores, publish checklist).

## 6. Visual Design
Premium B2B OS feel: white panels, cool-gray canvas, violet accent, black CTAs, sparing
status colors, no marketing hero in-app. Standardize panel radius 12–16px, card 8–12px,
black-pill primary, white-bordered secondary, destructive icon+confirm, pill status
badges, tabular numerals, responsive tables. Premium micro-interactions (press feedback,
drawer/dialog transitions, optimistic shimmer, KPI transition, job easing, copy success,
save idle/saving/saved/failed) — honor `prefers-reduced-motion`, 120–280ms.

## 7. Performance
**Frontend:** Lighthouse 90+, INP <200ms, route transition <100ms, no major CLS.
Dynamically import Recharts, keep data loads in Server Components, small client
components, split api-client mock fallback out of client bundles, memoize filters,
stable skeleton dimensions, virtualize >200 rows, cache safe GETs.
**API:** mock reads <100ms, mutations <250ms, external calls timeout-wrapped, pagination
on every list, response-shape tests, avoid N+1.
**Build:** `pnpm build` clean, dynamic routes declare `force-dynamic`, fallback logs
distinguish real failure from dynamic-render, CI fails on type/lint/build errors.

## 8. Code Quality
Layering: Controller → Service → Repository/Provider Adapter → Storage/External.
Web: Route → API Client → Component Workflow → UI Primitive. Shared types in
`packages/types`, mocks in `packages/mock`.
**Testing:** API unit + smoke for PRD workflows, web component tests, Playwright smoke,
a11y smoke. Required workflows enumerated in source brief.
**Error handling:** every mutation has optimistic+rollback (when implemented), loading,
success toast, error toast, retry, no secret logging.

## 9. Security
**Demo now:** no secrets in docs/screenshots; never expose DATABASE_URL/AI keys/tokens
to client bundles; visible Demo Mode indicator; disable real external calls in demo;
redact auth headers/cookies/tokens/emails in logs; CORS allow-list; browser stays on
same-origin `/api/v1`.
**Production:** Clerk JWT verify in `BearerGuard`; workspace+role from token; RBAC on
every mutation; tenant isolation at API+DB; rate limits per route/tenant; DTO validation;
output encoding; CSRF if cookie auth; secure headers; audit log for create/update/delete/
publish/export/integration/billing; dep + secret scanning in CI; security review pre-launch.
**Privacy:** separate demo vs prod data; retention policy; deletion path; no raw outreach/
lead bodies in prod logs; mark PII.

## 10. Scalability
Every persisted entity carries `workspaceId`, `createdAt`, `updatedAt`, `createdBy`.
Every list endpoint: pagination, filters, stable sort, workspace scoping.
Job types: audit, discover, acquire-backlinks, export, content-rescan, content-refresh,
internal-links, settings-sync, page-generate, page-publish, lead-sync. Job model:
id, workspaceId, type, status, progress, description, result, error, artifactUrl,
createdAt, startedAt, completedAt, cancelledAt.
Adapter contracts: SeoDataProvider, OutreachDrafter, BrandProfileSource, PublishingProvider,
CrmProvider, BillingProvider, EmailProvider, QueueProvider — each mock/disabled/prod +
timeout policy + error mapping + health check.

## 11. Sales-Readiness
Demo runs with one command; all routes render w/o creds; all CTAs functional; realistic
seed data; believable job progress; real export files; no raw stack traces; no console
errors in happy path; works at 375/768/1440px; credible upgrade CTA. Narrative: find
opportunities → generate/improve assets → publish & monitor → capture leads → prove ROI.

## 12. Implementation Phases
1. **Demo Completion** (P0 + confirmations + build cleanup) — *mostly done; confirmations remain.*
2. **UX & Visual Upgrade** — unified states, mobile cards, route skeletons, job center, command palette, detail drawers, normalized spacing/badges, reduced-motion-safe micro-interactions.
3. **Performance & Stability** — dynamic charts (done on /performance), split mock from client bundles, stable skeletons, timing logs, Playwright + API smoke, CI commands.
4. **Security & Scale Foundation** — Demo/Prod mode gate, DTO validation, tenant-aware interfaces, RBAC enforcement hooks, rate-limit guard, audit coverage, repository interfaces.
5. **Sellable Packaging** — guided demo reset, sample personas, ROI cards, exportable exec report, onboarding checklist, pricing/plan state, release notes + demo script.

## 13. Definition of Done
API- or explicitly mock-backed via same client pattern; loading/empty/error/success/retry
where relevant; works mobile/tablet/desktop; keyboard accessible; no console errors in
happy path; passes typecheck+lint; smoke coverage if part of demo; no secret exposure;
fits visual system.

## 14. Verification Checklist
`pnpm typecheck && pnpm lint && pnpm build`. API smoke: job CRUD; prospect discover/update/
archive; outreach draft for discovered prospect; save draft; alerts read/resolve/thresholds;
content rescan/refresh/apply-links; settings read/update; team add/remove; integration toggle;
opportunities + performance export. Browser QA on all routes. Responsive 375/768/1440.
A11y: keyboard nav, focus visible, dialog/drawer labels, Escape closes, reduced motion,
icon-only labels.

## 15. Immediate Next Tasks
Done: discovered-prospect outreach; prospect metadata PATCH UI; opportunities + performance
CSV export; Pages discover CTA → /research; Upgrade → settings; publishing toggles persist;
build fallback cleanup; dynamic-import perf charts.
Next: replace `window.confirm` with a shared confirmation dialog; route-level skeletons +
error boundaries; command palette; mobile card layouts for wide tables; Browser QA pass +
screenshots; then Phase 4 security/scale foundation.
