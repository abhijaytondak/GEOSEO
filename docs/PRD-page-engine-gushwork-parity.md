# PRD — Page Creation Engine: Gushwork Parity

**Status:** Draft (planning only — no code yet)
**Author:** Claude (Opus 4.8) · **Date:** 2026-06-18
**Benchmark:** [gushwork.ai/page-creation-engine](https://www.gushwork.ai/page-creation-engine)
**Scope:** GEOSEO `apps/web` (Next.js) + `apps/api` (NestJS) page-creation surface
**Related:** `PRD-page-engine.md`, `PRD-page-engine-pages-ui-theme-matching.md`, `PRD-brand-memory-engine-ui-ux.md`, `PRD-live-api-productization.md`

> ⚠️ **Multi-account repo.** `apps/api/src/modules/page-engine.service.ts` is a contested lane. Coordinate before deep edits. Phases 1/3/4 touch shared `@geoseo/types`. Run `git status` first; never clobber another lane's uncommitted work.

---

## 1. Why this PRD exists

Gushwork markets its **Page Creation Engine** as "Content, landing pages, and resources built for AI bots **and** human visitors" → "Get Qualified Inbound Leads from AI Search Engines." It is decomposed into **8 numbered capabilities**:

1. **Keyword Research** — exact buyer phrases pulled from Google **and AI search engines**, filtered for traffic + rankability.
2. **Intent Mapping** — auto-categorize keywords by *research-mode* vs *ready-to-buy* signal.
3. **Competitor Tracking** — which **pages** are winning for competitors, what they rank for, what drives their traffic, where they're vulnerable.
4. **Blog Pages** — long-form articles on real keyword research, structured for readability, written to convert humans **and AI crawlers**.
5. **Service Pages** — one dedicated page per service, benefit-focused, conversion-ready, structured for AI comprehension.
6. **Infographics** — complex ideas → visual formats (process flows, comparisons, data viz), all in-brand.
7. **Branded Images** — custom images matching visual identity (colors, fonts, style); no generic stock.
8. **Auto-Updates** — pages refreshed automatically when data changes or rankings drop; no manual maintenance.

This PRD maps GEOSEO's **actual implemented state** (verified against code on 2026-06-18) against those 8, then sequences the work to reach parity-and-beyond.

---

## 2. Current-state scorecard (verified against code)

| # | Capability | Verdict | Evidence (files) |
|---|------------|---------|------------------|
| 1 | Keyword Research | 🟡 **Partial** | `apps/api/src/modules/keyword-research.service.ts` (DataForSEO Labs if keyed → Google Autocomplete keyless → empty), `page-engine.service.ts` `discover()`. **No AI-search-engine keyword sourcing.** |
| 2 | Intent Mapping | 🟡 **Stub** | `page-engine.service.ts` `classifyKwIntent()` (6-intent regex), `PAGE_TYPE_BY_INTENT`. No research-vs-buy split, no SERP/answer inspection. |
| 3 | Competitor Tracking | 🟡 **Partial** | `competitor-analysis.service.ts` (Brave → DDG → LLM `llm/competitors.ts` → heuristic), `KeywordGap` types. **Domain-level only — no page-level wins/vulnerabilities, no traffic/backlink data.** |
| 4 | Blog Pages | 🟡 **Partial** | `page-engine.service.ts` + `llm/deepseek.ts`. Engine solid + brand-grounded, but **all page types emit the same 3-section + 2-FAQ template** — no long-form blog structure. |
| 5 | Service Pages | 🟡 **Partial** | Same. `PageType` enum has `service`, blueprints differ structurally, but **generation prompt does not adapt per type.** |
| 6 | Infographics | 🔴 **Near-zero** | Only `image-gen.service.ts` `kind:"infographic"` prompt hint. **No data-viz / chart / diagram / comparison-table generation engine.** (recharts exists but only displays existing analytics.) |
| 7 | Branded Images | 🟡 **Partial (orphaned)** | `image-gen.service.ts` brand+theme-aware prompt + SVG placeholder fallback. **But `GeneratedPage` has no image field; `/feeds/[slug]` renders text only; image-gen is a standalone Brand→Assets feature.** |
| 8 | Auto-Updates | 🔴 **Absent** | `GET /recommendations/refresh` (age-based suggestions), `POST /pages/:id/refresh` (sets `needs-refresh` flag, **does not regenerate**), `alerts.service.ts` (passive thresholds), `queue.service.ts` (BullMQ infra, **no scheduled/triggered page jobs**). **No automatic trigger, no background re-draft.** |
| ★ | "Built for AI bots + humans" | 🟢 **At parity / ahead** | `app/llms.txt/route.ts`, `app/sitemap.ts`, `/feeds/[slug]` renders JSON-LD (`application/ld+json`), semantic `<article>/<h1>/<h2>/<dl>`, **AI-bot UA detection → `recordBotHit`**, native confirmed-theme rendering. |

**Headline:** the *foundation* (generation pipeline, Brand Memory grounding, AI-bot readiness) is competitive or ahead. The gaps are four product capabilities — **#4/#5 type-specific generation, #6 infographics, #7 images-on-pages, #8 auto-updates** — plus **#1–3 discovery depth**. None are blocked on missing architecture.

> **Critical activation note:** `DEEPSEEK_API_KEY`, `DATAFORSEO_*`, and `BRAVE_SEARCH_API_KEY` are **unset**, so generation currently runs on the **template fallback** and research/competitors run on heuristics. Much "real" capability is one env var away — see Phase 0.

---

## 3. Goals / Non-goals

**Goals**
- Reach functional parity on all 8 Gushwork capabilities, with honest fallbacks (never fabricate data).
- Turn the orphaned/stub pieces (images, infographics, auto-update) into page-integrated features.
- Preserve and extend the AI-bot-readiness strength as a differentiator.

**Non-goals (this PRD)**
- Full backlink-acquisition automation (covered by `PRD-backlinking-seo-engine.md`).
- Real GSC/Analytics traffic data (credential + owned-domain gated; tracked separately).
- Replacing the multi-tenant / auth work in flight.

**Guardrails**
- Every provider stays behind an env-gated seam that returns null/[]/placeholder on failure — never throws, never fabricates (`@geoseo/mock` fallback preserved per house rules).
- No commit/push without explicit confirmation.

---

## 4. Phased plan

### Phase 0 — Activate what's already built *(operator/keys, ~0 code)*
**Objective:** flip existing real seams on before building anything new.
- Set `DEEPSEEK_API_KEY` (or Gemini-compatible: `DEEPSEEK_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, `DEEPSEEK_MODEL=gemini-2.0-flash`) → generation goes template→real LLM.
- Set `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` → keyword research heuristic→real volume/difficulty/CPC.
- Set `BRAVE_SEARCH_API_KEY` → competitor SERP keyless→real.
**Acceptance:** `/opportunities/discover` reports `source:"dataforseo"`; a generated page shows non-template copy; `/brand-analysis/competitors` reports `source:"brave"`.
**Effort:** S (config only). **Risk:** none (no code).

---

### Phase 1 — Type-specific page generation (#4 Blog, #5 Service)
**Objective:** make Blog, Service, Comparison, Guide pages structurally distinct, not one generic template.
**Scope**
- `apps/api/src/llm/deepseek.ts`: per-`pageType` prompt + JSON output schema.
  - **Blog/guide:** intro → TOC → 5–8 long-form H2 sections → key-takeaways → FAQ → soft CTA.
  - **Service:** hero (outcome) → benefits → features → proof/logos → pricing teaser → FAQ → strong CTA.
  - **Comparison:** TL;DR verdict → feature table → migration/switching → FAQ.
- `apps/api/src/modules/page-engine.service.ts`: type-aware section assembly + per-type schema.org (`BlogPosting`, `Service`, `HowTo`, `FAQPage`, `BreadcrumbList`) — honor the blueprint `schemaPlan` that already exists but is currently ignored.
- `apps/web/.../feeds/[slug]/page.tsx`: render variable section counts + per-type schema.
- `packages/types`: extend `GeneratedPage` content model if section shape must vary (additive, coordinate).
**Acceptance:** generating a `blog` vs `service` opportunity produces visibly different structure + different JSON-LD `@type`; verified by curl + `/feeds` screenshot.
**Effort:** M. **Risk:** contested file (`page-engine.service.ts`) + shared types — coordinate lane.

---

### Phase 2 — Branded images wired into pages (#7)
**Objective:** connect the existing brand-aware image-gen to the page model and published output.
**Scope**
- `packages/types`: add `heroImage?`, `ogImage?`, optional per-section `image?` to `GeneratedPage` (additive).
- `page-engine.service.ts`: on generation, auto-request a hero + OG image from `ImageGenStore` (prompt already brand+theme-aware); store URLs on the page.
- `feeds/[slug]/page.tsx`: render hero image + `og:image` meta + section images.
- Pages editor (`apps/web/.../components/pages/`): image slot UI (regenerate / replace / remove) reusing the Brand→Assets generator.
**Acceptance:** a generated page persists + renders a brand-colored hero on `/feeds`; `og:image` present in `<head>`; works with placeholder SVG when `IMAGE_GEN_API_KEY` unset.
**Effort:** M. **Risk:** shared types + contested file; image latency on generate (make async/non-blocking).

---

### Phase 3 — Infographics / data-viz engine (#6) — *biggest greenfield + differentiator*
**Objective:** turn structured ideas into in-brand, **AI-crawlable** visuals embedded in pages.
**Scope**
- New `apps/api/src/modules/infographic.service.ts`: LLM emits a typed **data structure** (comparison table, process flow, stat grid, pros/cons, timeline, simple bar/line) — not free text.
- Deterministic **branded SVG/HTML renderer** (server-side, uses confirmed Site Theme tokens) → embeddable block in a page section.
  - **Differentiator:** render as semantic HTML/inline-SVG (not a raster image) so AI crawlers can read the data — Gushwork ships image infographics that bots can't parse.
- `page-engine.service.ts` + `feeds` renderer: a `figure` section type that carries an infographic block.
- `packages/types`: `InfographicSpec` union (additive).
**Acceptance:** a comparison/process-flow infographic generated for a page renders in-brand on `/feeds`, is present in the HTML (not just an `<img>`), and degrades to a plain table if generation fails.
**Effort:** L. **Risk:** new surface; keep the renderer dependency-free (no chart lib bloat) and theme-bound.

---

### Phase 4 — Auto-Updates loop (#8)
**Objective:** automatic, trigger-based page refresh — "no manual maintenance."
**Scope**
- `queue.service.ts`: recurring/cron BullMQ jobs (infra exists) for a freshness sweep.
- Triggers: (a) age (the `recommendations/refresh` logic already computes staleness), (b) `alerts.service.ts` rank-drop/traffic-drop threshold breach → enqueue a `regeneratePage` job.
- New `regeneratePage` job handler: re-draft via LLM **preserving slug/URL + canonical**, produce a diff, then **approval-gated or auto** republish per a per-page "autopilot" toggle.
- Per-page autopilot flag + "last auto-refreshed" surfaced in the Pages UI.
**Acceptance:** simulating a rank-drop alert enqueues a regenerate job that re-drafts and (if autopilot on) republishes without user action; slug/URL unchanged; audit-logged.
**Effort:** L. **Risk:** **needs a durable Redis host** — current notes flag Upstash free-tier overage; `ALLOW_INMEMORY_QUEUE` skips the worker entirely. Resolve queue hosting first (Phase 4 prerequisite).

---

### Phase 5 — Discovery depth (#1 AI-search keywords, #2 intent, #3 page-level competitors)
**Objective:** close the remaining discovery-quality gaps.
**Scope**
- **#1:** AI-search keyword sourcing — query AI engines (Perplexity/Brave-AI/Gemini) for buyer phrases, merge into `keyword-research.service.ts` as a new tier; tag `source:"ai-search"`.
- **#2:** LLM-based intent refinement replacing/augmenting the regex `classifyKwIntent` — explicit *research-mode vs ready-to-buy* label that drives page type + CTA strength.
- **#3:** Page-level competitor analysis — crawl top competitor URLs (reuse SSRF-guarded `safeFetchText`), extract structure/sections/schema/content gaps + a "vulnerability" summary (thin content, missing FAQ/schema, stale).
**Acceptance:** discovery returns AI-search-tagged keywords; opportunities carry a research/buy label; competitor view shows per-page wins + a gap/vulnerability list.
**Effort:** L. **Risk:** keys (AI-search), crawl politeness/rate limits.

---

## 5. Sequencing & dependencies

```
Phase 0 (keys) ──┬─> Phase 1 (type-specific gen)
                 ├─> Phase 2 (images on pages)
                 ├─> Phase 3 (infographics)        [parallelizable after P1]
                 ├─> Phase 5 (discovery depth)     [parallelizable]
                 └─> Phase 4 (auto-updates)        [BLOCKED on durable Redis host]
```
- **Phase 0** unblocks perceived quality immediately and should precede demos.
- **Phases 1–3, 5** are independent enough to interleave; all touch the page model / shared types, so land schema changes coordinated and additive.
- **Phase 4** has a hard infra prerequisite (durable queue host).

## 6. Risks & coordination
- **Contested lane:** `page-engine.service.ts` — confirm ownership/timing before Phases 1–4 deep edits.
- **Shared `@geoseo/types`:** keep all model changes additive; enum tuples `satisfies` their type unions (compile-time drift guard, per existing convention).
- **Keys:** DeepSeek/Gemini, DataForSEO, Brave, Image-gen, AI-search — most phases assume at least the Phase-0 keys.
- **Queue host:** Upstash free tier cannot sustain the BullMQ worker (documented); Phase 4 needs a paid Redis or alternative.
- **Honesty:** preserve the de-branded, fail-safe, no-fabrication posture on every new seam.

## 7. Definition of done (parity)
- All 8 capabilities at 🟢 with real-data paths active when keyed and honest fallbacks when not.
- Blog/Service/Comparison/Guide pages are structurally distinct and per-type schema'd.
- Generated pages carry brand images + at least one AI-crawlable infographic option.
- A rank-drop or staleness event refreshes a page automatically (autopilot) with an audit trail.
- AI-bot readiness retained (llms.txt, sitemap, JSON-LD, bot tracking) across all new page types.
