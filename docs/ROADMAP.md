# GEOSEO — Master Roadmap & TODO

The single source for **what's done / what's next** on the journey from today's
prototype to full Gushwork-class parity. This is the durable backlog — any session
picks up here. Update the status column as sprints land.

**Spec docs (source of truth):**
`PRD-backlinking-seo-engine.md` · `PRD-gushwork-platform.md` (full target) ·
`PRD-page-engine.md` · `FLOWS.md` (all engine + feedback flows + Mermaid) ·
`API-SPEC.md` · `TECH-STACK.md` · `UI-REFERENCE.md`/`tokens.css` (design system).

**Stack (locked):** Next.js 16 + TS + Tailwind/shadcn (web) · NestJS (api) · Postgres+pgvector ·
Redis/BullMQ · Clerk · Stripe · DataForSEO · Claude. Monorepo: `apps/web`, `apps/api`, `packages/{types,mock}`.

---

## ✅ Done
- **S0 — Design system**: Dribbble analysis → `UI-REFERENCE.md` + `tokens.css` + Tailwind preset.
- **S1 — Web prototype**: monorepo, 4 dashboards (Authority HQ, Backlink Opportunities + outreach
  drawer w/ 4 variants, Performance + drilldown, Alerts feed), premium charts + animated gradient
  progress bars, motion/reduced-motion, all on typed mock data. Live via ngrok.
- **S2 — API**: NestJS `apps/api` (:4000) — all v1 endpoints, `{success,data,errors}` envelope,
  bearer guard (dev-permissive + enforce mode), pagination, OpenAPI `/api/docs`, mock-backed behind
  `SEO_PROVIDER`/`OUTREACH_DRAFTER`/`BRAND_SOURCE` DI tokens. Verified (envelope, filters, 404, 401/200, stateful outreach/alerts).

- **S3 — Web ↔ API integration**: web's 5 `@geoseo/mock` import sites → typed `api-client.ts`
  (envelope-unwrap, server=direct/client=proxy base URL, silent mock fallback). Next rewrite
  `/api/v1/* → :4000` makes client calls same-origin (tunnel-safe). Added aggregate perf endpoints
  (rank-series, impression-series, ai-visibility) + API request logging. Verified: SSR→API logged,
  proxy works local + through ngrok tunnel, client outreach drawer returns 4 variants via proxy, tsc clean.

- **S6 — Brand Memory engine** (built ahead of order — no keys needed): versioned, editable
  brand-profile store with append-only history + revert. Types (`BrandMemoryVersion`,
  `BrandMemoryStore`), enriched profile (audience/differentiators/competitors/keywords),
  `BrandMemoryStore` service + `BrandController` (GET/PUT/versions/revert), web `/brand` page —
  editable form, live weighted completeness meter, **compiled-context preview** (what's injected
  into agents), version-history timeline w/ restore. Verified: API CRUD+versioning, mutations
  through the Next proxy (PUT/POST), web `tsc` clean, page renders. *(In-memory; persists to DB in S4.)*

## 🔜 Next sprints (ordered)

> Everything below needs an external credential or DB host to start (see 🔑). S0–S3 + S6 are done.

### S4 — Persistence foundation  🔑db ⬅ NEXT (needs a Postgres URL)
Postgres + Prisma (or Drizzle) + pgvector. Migrate mock fixtures → seed data. Multi-tenant schema
(workspace_id everywhere). Swap mock provider singletons → DB-backed repositories behind the same interfaces.

### S5 — Auth + multi-tenancy + billing  🔑Clerk 🔑Stripe
Clerk JWT verification in `BearerGuard` + tenant/scope resolution (admin/marketer/analyst RBAC).
Stripe subscriptions + tier feature matrix (Launch/Grow/Scale). Per-tenant limits.

### S6 — Brand Memory engine  ✅ DONE (see Done section)
Core shipped (versioned store + editable UI + compiled context). Remaining for later:
doc/website scrape → semantic extraction, vector embeddings (lands with S4 pgvector + S8 Claude).

### S7 — Research + Strategy engines  🔑DataForSEO
Buyer-intent discovery (autocomplete + AI-search), intent classification, SERP/AI-answer scraping,
gap scoring, topic clusters + page taxonomy, **continuous competitor change detection** (F3). Versioned strategy DB.

### S8 — Content + Publishing engine (`PRD-page-engine.md`)  🔑Claude 🔑CMS 🔑DNS
Prompt/intent engine → content-gen pipeline (Claude, prompt-cached) → quality/human-vetting (F2) →
publish adapter (Shopify/WP/Webflow) → `/feeds` subdir + sitemap + `llms.txt` + IndexNow →
self-healing internal linking (F4). BullMQ job queues.

### S9 — Authority/Backlinking automation
Real prospect discovery (DataForSEO backlink data) → scoring → outreach send (email/API) →
follow-up sequences (F6) → live link inventory + quality scoring + per-tier guarantees.

### S10 — Optimization/Refresh loop
Rank/traffic/AI-citation monitoring → threshold logic → auto refresh jobs (content/metadata/links)
→ audit trail + rollback. Live analytics event streaming (F5).

### S11 — Lead engine
Per-page form capture + trackers → spam filter + dedupe → lead scoring/segmentation → buyer-journey
tracking → multi-channel engagement (F7) → CRM sync (HubSpot/Salesforce) 🔑.

### S12 — AI search visibility (real) + Reporting
Real AI-citation tracking + share-of-voice (F1) → distinct AI-visibility dashboards. Tiered scheduled
report generation (PDF/CSV, F8) + custom view builder.

### S13 — Paid Boost  🔑Google/Meta Ads
Budget config → campaign automation → AI budget optimizer/pacing (F9) → blended paid+organic insights.

### S14 — Platform hardening
Sentry + OTel, autoscaling, content export/retention policy, free utility funnels, ROI estimator, onboarding flow.

---

## ⚠️ Needs operator input (blockers, by sprint)
- 🔑 DataForSEO key (S7, S9) · Anthropic/Claude key (S8, S10) · Clerk keys (S5) · Stripe keys (S5) ·
  per-tenant CMS creds + DNS (S8) · CRM + Ads creds (S11, S13) · DB host (S4, e.g. Neon/Supabase).
- Pricing/tier matrix decision (S5). CMS targets to support first (S8). CRM choice (S11).

## House rules
- Nothing committed/pushed to git without explicit confirmation (repo is currently all uncommitted).
- Each sprint: `tsc` clean + verify (curl/screenshot) before moving on. Mock stays as the swap-fallback behind every provider interface.
