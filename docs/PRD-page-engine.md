# PRD — Automatic Page Creation & Publishing Engine

The content→visibility→leads foundation. Generates 100+ buyer-intent pages, publishes
them under a dedicated subdirectory/subdomain on the client domain, optimizes for Google
*and* AI search, and refreshes continuously — hands-off. Mirrors Gushwork's Page Creation
Engine + AI-First CMS. Flows: see `FLOWS.md` §3, §S1–S4.

## Goal
Backend system that (1) generates SEO+AI-optimized pages at scale, (2) auto-publishes to
client sites, (3) keeps them crawlable/indexable/refreshed, (4) improves from performance data.

## Key requirements
1. **AI-first content creation** — LLM-generated pages optimized for buyer-intent keywords,
   AI-answer structures (schema, short direct answers, structured data), human readability +
   conversion. Assets: branded images/infographics, FAQ/JSON-LD markup. Page types: service
   landing, blog, guides, FAQ, resource hubs.
2. **Subdirectory/subdomain publication** (e.g. `yoursite.com/feeds` or `feeds.client.com`) —
   isolates automated content from the main site codebase; needs DNS (CNAME + TXT for
   validation/SSL — like the Route53 onboarding step). Improves SEO without interfering with the core site.
3. **Automatic SEO + AI-search optimization** — metadata (title/description/OpenGraph),
   structured data (FAQ/breadcrumb/article schema), **`llms.txt`** AI-crawl directives,
   automated internal linking for crawl depth.

## System architecture (6 subsystems)
1. **Prompt & Intent Engine** — buyer-intent + keyword discovery → maps queries to page types.
2. **Content Generation Pipeline** — break into prompts → LLM text + structured output → apply
   brand templates + stylistic constraints. Provider abstraction, prompt templates, token accounting.
3. **Quality & Vetting Layer** — accuracy/relevance, duplicate avoidance, brand-memory consistency,
   optional human review (Draft → Reviewed → Published).
4. **Publishing Adapter** — CMS connectors (Shopify API, WordPress REST, Webflow, custom HTML
   injection/webhook); writes HTML + metadata + assets; updates sitemaps + `llms.txt`; search-engine
   notification (IndexNow). Async **publish queue**.
5. **Refresh & Optimization Bot** — monitors rank/traffic/AI-citations; triggers rewrite/metadata/
   internal-link jobs; job-queue scheduled; re-push live.
6. **Analytics & Feedback Engine** — rankings, AI visibility, engagement → feeds refresh + creation prioritization.

## Functional requirements
- **Content gen** — inputs: business context, buyer keywords/intent, competitor SERP data, past
  analytics. Outputs: HTML+schema pages, branded visuals, sitemap entries. Quality: SEO score, AI
  visibility signals, duplicate checks.
- **CMS integration** — Shopify / WordPress / Webflow / custom; subdomain + DNS create+verify (CNAME/TXT).
- **Search/AI indexing** — AI bots can crawl+cite; schema signals direct answers; `llms.txt` prioritization.
- **Monitoring & auto-refresh** — watch rank positions, detect impression drops, trigger refresh,
  auto-schedule via job queues.

## Technical patterns
Async job queues (gen / publish / refresh) · CMS API connectors · LLM provider abstraction +
prompt templates + token accounting · quality-control pipeline (dedupe + brand enforcement) ·
search-engine integration (sitemap automation, `llms.txt`, structured data).

## Dashboard (backend-powered)
Page-performance dashboards · content-creation logs · publish-queue monitor · error/vetting
reports · SEO health scores.

## Milestones
| Phase | Deliverables |
|---|---|
| 1 | Intent mapping + content-gen engine |
| 2 | CMS publish pipeline + subdomain setup |
| 3 | Auto SEO + schema integration |
| 4 | Refresh + performance loop |
| 5 | Dashboard analytics + lead pipeline |

🔑 Needs: LLM key (Claude), CMS credentials, DNS access per tenant, IndexNow key.
