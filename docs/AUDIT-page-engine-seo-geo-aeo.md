# Page-Engine Audit — SEO / GEO / AEO (2026-06-30)

A full audit of the page-creation engine across **content generation, technical SEO,
keyword discovery, and GEO/AEO (answer-engine) readiness**, with file:line evidence and a
ranked improvement plan. Produced via four parallel deep-reads of the codebase.

> **Scope note.** This audits the *engine's ceiling* (how good a page can be). The *floor*
> — whether real content is generated and indexed in production — is gated on the launch
> sequence in `docs/PRODUCTION_LAUNCH.md`: a hosted LLM key and flipping `/feeds` out of
> demo `noindex`. Until then the live engine emits the deterministic **template** fallback
> and `/feeds` is `noindex`, so none of the page corpus is actually indexed/cited yet.

## Verdict

**Architecture: B+/A-.** The machinery is genuinely ahead of most tools. The weakness is the
*content* flowing through it in production (template-only, no hosted LLM key) and a handful of
missing high-value markup + a one-way keyword engine.

## What's already strong (do not rebuild)

- **JSON-LD `@graph`** — Organization + WebSite + per-type primary node
  (BlogPosting / Article / Service / LocalBusiness / WebPage / FAQPage) + BreadcrumbList +
  `speakable`, HTML-escaped and parse-validated. `apps/api/src/llm/page-type-spec.ts:164-252`,
  `apps/api/src/common/seo.ts:65-72`.
- **Real computed SEO checks** (not hardcoded pass) — title ≤60 / meta ≤155 clamping on word
  boundary, keyword-in-first-100-words, single-H1, per-type word-count floors.
  `apps/api/src/common/seo.ts`.
- **Citability / AEO scorer** — deterministic 0-100 across 5 weighted dims (answer-block 30,
  self-containment 25, readability 20, stat-density 15, uniqueness 10) with **ranked, actionable**
  fix suggestions. `apps/api/src/common/citability.ts:14-197`.
- **Answer-first rendering** — `DirectAnswer` quick-answer + key-facts `<dl>` above the fold,
  `data-aeo="direct-answer"`. `apps/web/src/components/feeds/direct-answer.tsx`.
- **Crawlable infographics** (semantic `<table>`/`<dl>`/`<figure>`, never raster), topic-cluster
  `RelatedPages` (token-overlap, top 4, real `<a>`), AI-bot hit tracking
  (GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot/Google-Extended).
- **Per-page-type differentiation is real** — guide/service/comparison/landing/faq/resource/local
  genuinely differ in section arc, FAQ count, depth budget, and CTA in BOTH the LLM and template
  paths. `apps/api/src/llm/page-type-spec.ts`, `page-engine.service.ts:buildSectionsForType`.
- **5-tier keyword sourcing** with graceful keyless fallback: DataForSEO → AI-search (LLM) →
  Google Autocomplete → deterministic seed-expansion (16-modifier matrix) → []. Never empty.
  `apps/api/src/modules/keyword-research.service.ts`.

## Ranked improvement plan

Impact × effort. P0 = content fuel; P1 = high-leverage markup + keyword loop; P2 = infra-gated.

### P0 — Content quality (the actual ranking/citation fuel)

| # | Change | Why | Where | I/E |
|---|--------|-----|-------|-----|
| 1 | Answer-first openings in the **template** (lead each section with a definition/claim, then expand) | Keyless template citability C/D→B; mirrors the LLM instruction | `page-engine.service.ts:buildSectionsForType` | High / Low |
| 2 | Inject real proof points into templates (Brand Memory stats/case studies, never fabricated) | Adds named entities + stat-density (the two weakest citability dims) | `page-engine.service.ts:generatePage`, `brand-library.service.ts` | High / Med |
| 3 | Guarantee per-type word-count floors (local/faq can underrun `MIN_WORDS` today) | Fails the "sufficient depth" SEO check | `buildSectionsForType` / `buildFaqsForType` | High / Low |
| 4 | Validate LLM drafts against the citability rubric — reject <50 → template fallback | Stops low-quality LLM output shipping silently | `apps/api/src/llm/deepseek.ts` | High / Med |

### P1 — High-leverage markup (mostly low-effort)

| # | Change | Why | Where | I/E |
|---|--------|-----|-------|-----|
| 5 | `image` (ImageObject) in Article/BlogPosting JSON-LD — hero image is generated but absent from schema | Google Images / richer rich-results | `page-type-spec.ts:buildSchemaJson` (+ thread `heroImageUrl/Alt` via `schemaContextFor`) | High / Low |
| 6 | `<blockquote>` + `Quote` schema on the page's most citable claim | This is what Perplexity/AI Overviews extract verbatim | `page-type-spec.ts`, `components/feeds/*` | High / Med |
| 7 | Twitter cards on `/feeds` (only OpenGraph today) | Social preview cards | `apps/web/src/app/feeds/[slug]/page.tsx:generateMetadata` | Med / Low |
| 8 | Breadcrumb UI (schema exists, no visible `<nav>`) + `scope`/semantics on comparison tables | Crawl signal + table ranking | `feeds/[slug]/page.tsx`, `feeds/infographic.tsx` | Med / Low |
| 9 | Visible "Last updated" `<time>` + llms.txt semantic layer (per-page type/intent/freshness) | Freshness tiebreaker; helps AI crawlers prioritize | `feeds/[slug]/page.tsx`, `app/llms.txt/route.ts` | Med / Low |

### P1 — Keyword engine: one-way → closed-loop

| # | Change | Why | Where | I/E |
|---|--------|-----|-------|-----|
| 10 | Location parameter in sourcing (`location_name` hardcoded "United States") | Unlocks geo long-tails for multi-location businesses | `keyword-research.service.ts` | High / Med |
| 11 | Competitor keyword-gap → discovery feedback (gaps found in `competitor-analysis.service.ts` are never fed back) | Turns competitor intel into opportunities | `page-engine.service.ts:discover` | High / High |
| 12 | Cannibalization detection across pages' target keywords (only exact-dupe today) | Prevents two pages fighting for one term | `page-engine.service.ts:discover` | Med / Low |
| 13 | Intent/stage confidence + source label surfaced in UI | Let users trust/filter classifications | `llm/intent.ts`, opportunities UI | Med / Med |

### P2 — Bigger / infra-gated

- **Real per-engine citation tracking** — replace the heuristic "AI visibility" count with
  OpenAI/Perplexity citation APIs. Needs provider keys (operator).
- **Content-recency auto-refresh loop** for `autopilot` pages — needs a durable scheduler
  (the Redis/infra item).
- HowTo schema for step-guides; hreflang for multi-language; embeddings-based semantic clustering;
  FAQ dedup; per-crawler robots rules.

## Key gaps by dimension (evidence)

**Content** — production runs the template fallback (no hosted key, per `CLAUDE.md`); template
prose scores C/D citability (no named entities/stats, narrative — not answer-first — openings);
anti-fabrication is enforced at the prompt level (`deepseek.ts` "never invent statistics") but has
no runtime validation. `page-engine.service.ts:buildSectionsForType`, `buildFaqsForType`.

**Technical SEO** — strong base; missing: `image` in Article schema, Twitter cards on `/feeds`,
visible breadcrumb UI, `scope` on comparison tables, hreflang (only needed if multi-language). Meta
description lower bound is 50 chars (best practice ~80). `page-type-spec.ts:208-225`,
`feeds/[slug]/page.tsx:25-48`, `common/seo.ts:78`.

**Keywords** — keyless difficulty is estimated (winnability scoring unreliable without DataForSEO);
no geographic targeting (`location_name` hardcoded); competitor-gap analysis is one-way; no
cross-page cannibalization detection; no intent/stage confidence. `keyword-research.service.ts:170`,
`page-engine.service.ts:308-360,1355-1408`.

**GEO/AEO** — citability scorer is genuinely actionable; gaps: no `<blockquote>`/`Quote` markup for
extractable claims, llms.txt is minimal (no per-page semantic metadata), "AI visibility" is a
heuristic hit-count not real citation attribution, no content-recency loop.
`citability.ts`, `app/llms.txt/route.ts`, `feeds/[slug]/page.tsx:67-69`.

## Implementation status

- **Batch 1: items 1, 3, 5, 6, 7** ✅ — content answer-first openings + word-count floors +
  Article-image schema + Quotation/blockquote + Twitter cards.
- **Batch 2: items 2, 4** ✅ — proof-point injection into the template path (`injectProof` weaves
  real Brand-Library proof into the most relevant section; no-op without proof, never fabricated)
  + an LLM/browser-draft **quality gate** in `generatePage`: the deterministic template is always
  built as a baseline, and the draft is kept only if it is not thin (≥ 0.5 × `MIN_WORDS`) and at
  least as citable as the template (within 5 pts) — otherwise the template is used and the reason
  is recorded in the page version history. Guarantees the engine never ships content worse than
  its own fallback. (Verified: thin draft → rejected w/ reason "thin draft (11w < 350)"; rich
  draft → kept; proof string woven into the rendered section.)
- **Batch 3: items 12, 13** ✅ — cross-page **cannibalization detection** (`cannibalizingPage`: exact
  target-keyword match OR token-overlap Jaccard ≥ 0.5 → sets `duplicate` + new `cannibalizesPageId`
  + an evidence warning; topically-related-but-distinct keywords are NOT flagged) and **intent/stage
  confidence** (`classifyIntents` now returns a 0–100 `confidence`; regex fallback assigns decisive
  vs catch-all scores via `regexIntentConfidence`; new `KeywordOpportunity.intentConfidence`, surfaced
  in the explorer with a "unsure" flag < 60). Verified keyless: 15/23 overlapping opps flagged to the
  right page; every newly-discovered opp carries `intentConfidence`.
- **Item 10 (geo keyword targeting) — DEFERRED:** `researchKeywords` already accepts `locationName`,
  but there is no location field on `BrandProfile`/settings to source it from, and those types + their
  UI are the **Codex lane** — needs a `location`/`serviceArea` field added there (coordinate before
  building).
- **Batch 4: items 8, 9** ✅ — visible **breadcrumb** `<nav aria-label="Breadcrumb">` on `/feeds`
  (Home › category › title, mirrors the BreadcrumbList JSON-LD) + proper **table semantics** on both
  comparison-table renderers (`scope="col"` on column headers, row labels → `<th scope="row">`).
  Verified live: breadcrumb "Home › Comparisons › …"; scope=col×6 + scope=row×11.
- Remaining: P1 **#11** (competitor-gap → discovery loop — touches the Codex-lane competitor service)
  + **#10** (geo, deferred — needs a Codex-lane brand location field); P2 (real per-engine citation
  tracking, content-recency auto-refresh, HowTo/hreflang). `regeneratePage`/`rewritePage` could adopt
  the #4 gate (follow-on).
