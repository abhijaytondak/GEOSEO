# PRD - Solution Parity and Productization: AI Search, Lead Conversion, Paid Boost

Benchmarks:

```text
https://www.gushwork.ai/solutions/ai-search
https://www.gushwork.ai/solutions/lead-conversion
https://www.gushwork.ai/solutions/paid-boost
```

Fetch note:

- The AI Search and Lead Conversion benchmark pages were readable.
- The Paid Boost page URL is linked from Gushwork navigation, but the page body
  was not available through the fetch tool during this audit. This PRD treats
  Paid Boost using the visible Gushwork navigation promise, "Generate qualified
  leads from paid campaigns", plus GEOSEO's existing roadmap/flow notes.

This document answers the practical question:

```text
Can GEOSEO currently do what these Gushwork solution pages promise?
```

Short answer:

```text
AI Search: partial, strong prototype foundation, not fully sellable as autonomous
AI-search lead generation yet.

Lead Conversion: partial, useful lead capture and dashboard foundation, not yet
a complete conversion/follow-up system.

Paid Boost: not built as a product surface yet; only roadmap/flow-level planning
exists.
```

---

## 1. Executive Verdict

### AI Search

Current status:

```text
Partially able.
```

GEOSEO has many required building blocks:

- Brand Memory
- buyer-intent opportunity workflow
- Page Engine
- generated pages
- public `/feeds` pages
- sitemap and `llms.txt`
- lead capture
- leads dashboard
- backlink opportunities
- performance trends
- AI visibility concept
- content refresh workflow

But it is not yet a complete Gushwork-class AI Search Agent because several
major loops are still incomplete or prototype-backed:

- real buyer-intent research across Google and AI engines
- real AI answer/AI citation tracking
- real AI bot crawl analytics
- real authority/backlink acquisition
- production-grade page publishing connectors
- continuous refresh automation
- qualified lead attribution from AI search
- autonomous multi-agent orchestration

Sellability:

- Safe to sell as a prototype or beta for "AI-search-ready page creation and
  lead capture".
- Not safe yet to sell as fully autonomous "qualified leads from AI search" until
  research, publishing, analytics, authority, and lead attribution are live.

### Lead Conversion

Current status:

```text
Partially able.
```

GEOSEO currently supports:

- public lead forms on generated pages
- lead capture API
- spam and duplicate labeling
- lead scoring
- status updates
- CSV export
- delete
- CRM sync placeholder
- lead activity and notes API
- lead dashboard
- page-level source attribution

But it is not yet a full Lead Conversion Agent because these are missing:

- website-wide conversion audit
- homepage/product/service page conversion improvement workflow
- proof section management
- form builder and routing rules
- sales rep assignment
- visitor journey tracking
- instant notifications
- AI SDR/follow-up workflows
- meeting booking
- quote path optimization
- page speed/mobile conversion audit
- conversion experiments

Sellability:

- Safe to sell as "lead capture dashboard for generated pages".
- Not safe yet to sell as "AI lead conversion agent that improves your whole
  website and follows up automatically" until routing, journey, follow-up, and
  conversion optimization workflows exist.

### Paid Boost

Current status:

```text
Not currently able.
```

GEOSEO has conceptual roadmap notes for Paid Boost, but no real UI, API, data
model, ad platform integration, campaign builder, budget pacing, or paid/organic
ROI reporting.

Sellability:

- Do not sell Paid Boost as available.
- Safe to position as "planned add-on" only.

## 2. Benchmark Summary

### AI Search Benchmark

The Gushwork AI Search solution promises:

- qualified leads from AI search engines
- visibility across ChatGPT, Gemini, Perplexity, Claude, and Grok
- high-intent buyer search discovery
- pages for service, category, comparison, FAQ, blog, product-led, and visual
  assets
- publishing through a feed that search engines and AI tools can index
- trust signals through backlinks, citations, internal links, and structured
  references
- performance-based page updates
- lead tracking in the Leads Dashboard
- a six-agent model:
  - Memory Agent
  - Research Agent
  - Strategy Agent
  - Content Agent
  - Authority Agent
  - Follow-up Agent
- a 90-150 day expectation for qualified AI-search-led outcomes

### Lead Conversion Benchmark

The Gushwork Lead Conversion solution promises:

- clearer website structure
- stronger buyer understanding
- proof closer to decision points
- faster, easier website experience
- better mobile experience
- clearer forms, CTAs, quote requests, and call paths
- follow-up before interest goes cold
- buyer fit qualification
- routing serious opportunities to the team
- website strategy, design/development, form/routing, and follow-up agents

### Paid Boost Benchmark

The visible benchmark promise is:

```text
Generate qualified leads from paid campaigns.
```

GEOSEO roadmap already describes Paid Boost as:

```text
Budget config -> campaign automation -> AI budget optimizer/pacing -> blended
paid+organic insights.
```

To make this sellable, GEOSEO needs real campaign planning, ad platform
integration, landing page generation, tracking, budget management, creative
testing, and ROI reporting.

## 3. Current GEOSEO Capability Map

### Existing Product Surfaces

GEOSEO currently has or has PRDs for:

- Authority HQ
- Backlink Opportunities
- Performance / Analytics
- Alerts
- Brand Memory
- Content
- Settings
- Onboarding
- Page Engine / Pages
- Leads
- Global Search

### Existing AI Search Building Blocks

Current or documented:

- Brand Memory profile and versioning
- website extraction for Brand Memory
- buyer-intent opportunity discovery prototype
- page blueprinting
- page generation
- page editing
- page approval/publish workflow
- public feed pages
- sitemap and `llms.txt`
- lead forms
- backlinks/opportunities
- performance rank and traffic trends
- AI visibility signals
- alerts
- content refresh recommendations

### Existing Lead Conversion Building Blocks

Current or documented:

- public lead form
- lead ingest API
- spam and duplicate labeling
- lead score
- lead status
- lead dashboard
- lead CSV export
- lead delete
- CRM sync placeholder
- lead notes/activity API
- dashboard qualified lead metrics
- global search over leads

### Existing Paid Boost Building Blocks

Current or documented:

- only roadmap/flow-level concept
- no production product surface
- no paid campaign data model
- no Google/Meta/TikTok/LinkedIn integration
- no paid landing page workflow
- no budget pacing
- no paid ROI dashboard

## 4. Gap Matrix

| Capability | Needed For | Current GEOSEO Status | Verdict |
|---|---|---:|---|
| Brand Memory | AI Search, Lead Conversion, Paid Boost | Editable/versioned prototype exists | Partial |
| Buyer-intent research | AI Search | Prototype seed discovery, not real AI/Google research | Gap |
| SERP/AI answer analysis | AI Search | PRD-level only | Gap |
| Strategy blueprint | AI Search | Prototype blueprints exist | Partial |
| Page generation | AI Search, Lead Conversion | Prototype exists | Partial |
| Native website theme matching | AI Search, Lead Conversion | PRD written, not fully built | Gap |
| Publish to `/feeds` | AI Search | Built for prototype | Partial |
| CMS publishing adapters | AI Search, Lead Conversion | PRD-level | Gap |
| Backlinks/citations | AI Search | Opportunities/outreach prototype, not real acquisition | Partial |
| AI bot analytics | AI Search | PRD-level only | Gap |
| AI mention/citation tracking | AI Search | AI visibility mock/prototype | Gap |
| Lead capture | AI Search, Lead Conversion | Built for generated pages | Partial |
| Lead dashboard | AI Search, Lead Conversion | Built with table/status/export, notes API added | Partial |
| Visitor journey | Lead Conversion | PRD-level only | Gap |
| Form routing | Lead Conversion | Not built | Gap |
| Sales rep assignment | Lead Conversion | Not built | Gap |
| AI SDR follow-up | Lead Conversion | Not built | Gap |
| Meeting booking | Lead Conversion | Not built | Gap |
| Website conversion audit | Lead Conversion | Not built | Gap |
| Page speed/mobile audit | Lead Conversion | Not built | Gap |
| Paid campaign planner | Paid Boost | Not built | Gap |
| Ad platform integration | Paid Boost | Not built | Gap |
| Budget pacing | Paid Boost | Roadmap only | Gap |
| Paid landing pages | Paid Boost | Page Engine can help, no paid workflow | Gap |
| Paid/organic ROI reporting | Paid Boost | Roadmap only | Gap |

## 5. What GEOSEO Can Honestly Claim Today

### Safe Claims

GEOSEO can currently claim:

- "Create and publish AI-search-ready buyer-intent pages in a prototype/beta
  workflow."
- "Capture leads from generated pages."
- "Manage leads with spam labels, scoring, status, export, and notes/activity."
- "Track rankings, impressions, clicks, and AI visibility signals in a prototype
  analytics dashboard."
- "Manage Brand Memory as a source of context for content and outreach."
- "Manage backlink opportunities and outreach drafts."

### Claims To Avoid Until Built

Avoid claiming:

- "Generates qualified leads from AI search fully autonomously."
- "Scans millions of real searches across Google and AI engines."
- "Tracks real ChatGPT/Perplexity/Gemini/Claude/Grok citations."
- "Builds real backlinks and citations automatically."
- "Automatically calls, qualifies, and books every inbound lead."
- "Improves a customer's entire website conversion path."
- "Runs paid ad campaigns."
- "Optimizes paid budgets."
- "Delivers blended paid/organic ROI from real ad platforms."

## 6. Product Direction

These three solution areas should become a commercial packaging layer over
existing GEOSEO modules.

Recommended product packages:

```text
AI Search Engine
Lead Conversion Engine
Paid Boost Engine
```

They should not be marketing pages only. Each package should have a real
workspace, setup checklist, workflow state, metrics, and proof of outcome.

## 7. AI Search Engine PRD

### Goal

Turn buyer searches across Google and AI engines into published pages,
authority signals, AI visibility, and qualified leads.

### Required Workflow

1. Build Brand Memory.
2. Discover buyer-intent searches.
3. Analyze Google and AI answers.
4. Create strategy blueprint.
5. Generate page plan.
6. Generate page content and visuals.
7. Publish to website/feed/CMS.
8. Add structured data, sitemap, and `llms.txt`.
9. Build internal links.
10. Discover authority/backlink opportunities.
11. Monitor rankings, AI bot visits, AI mentions, page traffic, and leads.
12. Refresh pages continuously.

### Required Agents

#### Memory Agent

Uses Brand Memory to understand:

- products
- services
- buyer profiles
- locations
- proof
- competitors
- brand voice
- claims and forbidden claims

Current status:

- Partial.
- Current Brand Memory is editable/versioned but needs product/service library,
  buyer profiles, proof, claims, source citations, and context packs.

#### Research Agent

Discovers:

- questions
- comparisons
- service searches
- product/category searches
- location searches
- use cases
- buyer objections
- AI prompt patterns

Current status:

- Gap.
- Seed discovery exists, but real Google/AI search research does not.

#### Strategy Agent

Analyzes:

- current Google results
- AI answers
- competitor pages
- content gaps
- authority gaps
- page type needed
- business value

Current status:

- Partial.
- Basic blueprints exist; real SERP/AI strategy does not.

#### Content Agent

Creates:

- service pages
- category pages
- comparison pages
- blogs/guides
- FAQs
- product-led pages
- visuals and infographics
- schema metadata

Current status:

- Partial.
- Page Engine exists; visual assets, richer page types, theme matching, and
  quality gates need completion.

#### Authority Agent

Builds:

- citations
- backlinks
- directories
- partner links
- internal links
- structured references

Current status:

- Partial.
- Backlink opportunity and outreach prototype exists; acquisition and tracking
  are not complete.

#### Follow-Up Agent

Handles:

- inbound lead response
- qualification
- context capture
- routing
- meeting booking

Current status:

- Gap.

### AI Search Required APIs

```text
POST /api/v1/ai-search/research
GET  /api/v1/ai-search/opportunities
POST /api/v1/ai-search/opportunities/:id/approve
POST /api/v1/ai-search/strategy
GET  /api/v1/ai-search/strategy/:id
POST /api/v1/ai-search/pages/generate
POST /api/v1/ai-search/pages/:id/publish
GET  /api/v1/ai-search/mentions
POST /api/v1/ai-search/mentions/check
GET  /api/v1/ai-search/bot-activity
GET  /api/v1/ai-search/outcomes
```

### AI Search UI

Add workspace:

```text
/ai-search
```

Sections:

- Overview
- Research
- Strategy
- Pages
- Authority
- AI Mentions
- Bot Activity
- Leads
- Outcomes

### AI Search Acceptance Criteria

- User can scan Brand Memory and generate buyer-intent opportunities.
- User can approve opportunities into strategy blueprints.
- User can generate pages for approved search intents.
- User can publish pages.
- User can see if AI bots crawled pages.
- User can track AI mentions/citations.
- User can see leads tied to AI-search pages.
- User can refresh pages based on performance.

## 8. Lead Conversion Engine PRD

### Goal

Turn website visitors and generated-page visitors into qualified conversations.

### Required Workflow

1. Analyze current website and generated pages.
2. Identify conversion gaps.
3. Improve clarity, proof, CTAs, forms, speed, and mobile paths.
4. Capture inquiries.
5. Filter spam.
6. Score and qualify leads.
7. Route to the correct owner.
8. Follow up automatically where enabled.
9. Track conversion rates, meetings, and qualified conversations.

### Required Agents

#### Memory Agent

Same Brand Memory foundation, with extra focus on:

- proof points
- buyer objections
- trust signals
- qualification questions
- conversion claims

Current status:

- Partial.

#### Website Strategy Agent

Finds:

- unclear positioning
- weak proof
- missing CTAs
- confusing navigation
- bad mobile paths
- slow pages
- form friction
- quote path gaps

Current status:

- Gap.

#### Design and Development Agent

Improves:

- homepage sections
- product/service pages
- proof sections
- quote pages
- mobile layout
- page speed
- supporting visuals

Current status:

- Partial only through Page Engine PRD and generated page UI.
- No full-site conversion agent exists.

#### Form and Routing Agent

Handles:

- form builder
- field rules
- quote path
- call path
- routing by page/source/score/location
- owner assignment
- notifications

Current status:

- Gap.

#### Follow-Up Agent

Handles:

- instant response
- buyer context questions
- email/SMS/voice follow-up
- fit qualification
- meeting booking
- serious opportunity routing

Current status:

- Gap.

### Current GEOSEO Lead Conversion Strengths

GEOSEO can already:

- capture leads from generated pages
- label spam and duplicates
- score leads
- update status
- export CSV
- delete leads
- record lead notes/activity through API
- show lead metrics on dashboard

### Lead Conversion Required APIs

```text
GET  /api/v1/conversion/audit
POST /api/v1/conversion/audit/run
GET  /api/v1/conversion/recommendations
POST /api/v1/conversion/recommendations/:id/apply
GET  /api/v1/conversion/forms
POST /api/v1/conversion/forms
PATCH /api/v1/conversion/forms/:id
GET  /api/v1/conversion/routing-rules
POST /api/v1/conversion/routing-rules
PATCH /api/v1/conversion/routing-rules/:id
GET  /api/v1/conversion/follow-up-rules
POST /api/v1/conversion/follow-up-rules
POST /api/v1/conversion/leads/:id/follow-up
POST /api/v1/conversion/leads/:id/book-meeting
GET  /api/v1/conversion/outcomes
```

### Lead Conversion UI

Add workspace:

```text
/lead-conversion
```

Sections:

- Overview
- Conversion Audit
- Page Improvements
- Proof Library
- Forms and CTAs
- Routing
- Follow-Up
- Leads
- Outcomes

### Lead Conversion Acceptance Criteria

- User can run a conversion audit.
- User can see top conversion gaps.
- User can improve proof/CTA/form paths.
- User can configure forms and routing.
- Leads can be assigned to owners.
- Leads can receive follow-up actions.
- User can see conversion rate, meetings, qualified conversations, and won/lost
  outcomes.

## 9. Paid Boost Engine PRD

### Goal

Generate qualified leads from paid campaigns while using GEOSEO's Brand Memory,
Page Engine, Lead Dashboard, and Analytics to keep campaigns relevant, tracked,
and ROI-positive.

### Current Status

Paid Boost is not built.

Existing roadmap direction:

```text
Budget config -> campaign automation -> AI budget optimizer/pacing -> blended
paid+organic insights.
```

### Required Workflow

1. User chooses campaign objective.
2. GEOSEO reads Brand Memory and buyer profiles.
3. GEOSEO recommends paid campaign themes.
4. User sets budget, geography, channels, and approval rules.
5. GEOSEO generates ads and landing pages.
6. User reviews and approves.
7. Campaign launches to connected ad platforms.
8. GEOSEO tracks spend, clicks, conversions, leads, CPL, and quality.
9. Budget optimizer recommends or applies pacing changes.
10. Analytics reports paid vs organic contribution.

### Required Channels

Initial:

- Google Search Ads
- Meta Ads

Later:

- LinkedIn Ads
- Microsoft Ads
- TikTok Ads
- retargeting networks

### Required Objects

```ts
export interface PaidCampaign {
  id: string;
  workspaceId: string;
  name: string;
  objective: "leads" | "calls" | "quote_requests" | "traffic" | "retargeting";
  status: "draft" | "pending_approval" | "active" | "paused" | "completed" | "failed";
  channels: PaidChannel[];
  budget: PaidBudget;
  targeting: PaidTargeting;
  creatives: PaidCreative[];
  landingPageIds: string[];
  metrics: PaidCampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export type PaidChannel = "google_search" | "meta" | "linkedin" | "microsoft";

export interface PaidBudget {
  dailyBudget: number;
  totalBudget?: number;
  currency: string;
  pacing: "even" | "accelerated" | "manual";
}

export interface PaidTargeting {
  locations: string[];
  buyerProfiles: string[];
  keywords: string[];
  audiences: string[];
  exclusions: string[];
}

export interface PaidCreative {
  id: string;
  channel: PaidChannel;
  format: "search_text" | "image" | "carousel" | "video";
  headline: string;
  body: string;
  cta: string;
  assetUrls: string[];
  status: "draft" | "approved" | "rejected" | "active";
}

export interface PaidCampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  leads: number;
  qualifiedLeads: number;
  cpl: number;
  costPerQualifiedLead: number;
  pipelineValue?: number;
  roas?: number;
}
```

### Paid Boost Required APIs

```text
GET    /api/v1/paid-boost/campaigns
POST   /api/v1/paid-boost/campaigns
GET    /api/v1/paid-boost/campaigns/:id
PATCH  /api/v1/paid-boost/campaigns/:id
DELETE /api/v1/paid-boost/campaigns/:id
POST   /api/v1/paid-boost/campaigns/:id/generate-creatives
POST   /api/v1/paid-boost/campaigns/:id/generate-landing-page
POST   /api/v1/paid-boost/campaigns/:id/approve
POST   /api/v1/paid-boost/campaigns/:id/launch
POST   /api/v1/paid-boost/campaigns/:id/pause
POST   /api/v1/paid-boost/campaigns/:id/sync
GET    /api/v1/paid-boost/campaigns/:id/metrics
GET    /api/v1/paid-boost/recommendations
POST   /api/v1/paid-boost/recommendations/:id/apply
GET    /api/v1/paid-boost/integrations
POST   /api/v1/paid-boost/integrations/:provider/test
```

### Paid Boost UI

Add workspace:

```text
/paid-boost
```

Sections:

- Overview
- Campaigns
- Campaign Builder
- Creatives
- Landing Pages
- Budget and Pacing
- Leads
- ROI
- Integrations
- Settings

### Paid Boost Acceptance Criteria

- User can create a paid campaign draft.
- User can generate ad creative from Brand Memory.
- User can generate or attach a landing page.
- User can set budget, location, and targeting.
- User can approve before launch.
- User can connect at least one ad provider in production.
- User can see spend, clicks, leads, CPL, qualified leads, and ROI.
- User can pause campaigns.
- User can compare paid and organic lead quality.

## 10. Shared UX Requirements

Each solution workspace should have:

- setup checklist
- lifecycle state
- KPI strip
- recommended next action
- activity timeline
- jobs/progress
- export/report action
- empty/loading/error states
- mobile-responsive layouts
- no inert CTAs

### AI Search Workspace First Screen

Primary question:

```text
Are we turning buyer searches into qualified leads?
```

KPI cards:

- active buyer-intent pages
- AI mentions
- AI bot crawls
- pages indexed
- qualified leads
- authority links

### Lead Conversion Workspace First Screen

Primary question:

```text
Are visitors turning into qualified conversations?
```

KPI cards:

- conversion rate
- qualified leads
- form completion
- response SLA
- meetings booked
- spam blocked

### Paid Boost Workspace First Screen

Primary question:

```text
Are paid campaigns generating qualified leads profitably?
```

KPI cards:

- spend
- clicks
- leads
- qualified leads
- CPL
- pipeline value

## 11. Data and Integration Requirements

### Required External Integrations

AI Search:

- DataForSEO or equivalent for search data
- AI answer/citation monitoring provider or controlled tracking system
- CMS/publishing connectors
- backlink/citation data source

Lead Conversion:

- CRM providers: HubSpot, Salesforce, Pipedrive, webhook
- notification providers: email, Slack, webhook
- calendar provider in future
- voice/SMS provider if AI SDR is enabled

Paid Boost:

- Google Ads
- Meta Ads
- optional LinkedIn/Microsoft later
- conversion tracking
- spend reporting
- offline conversion upload in future

### Required Internal Dependencies

- Brand Memory
- Page Engine
- Leads
- Analytics
- Alerts
- Settings
- Jobs
- Audit logs
- Search

## 12. Security, Privacy, and Compliance

AI Search:

- source crawl SSRF protection
- prompt injection filtering
- source citations
- workspace-scoped data

Lead Conversion:

- PII masking
- consent tracking
- role-gated access
- no raw lead body logs
- delete/redact/export
- audit every export and delete

Paid Boost:

- OAuth token encryption
- ad account permission scoping
- approval gate before launch
- spend limit guardrails
- campaign pause failsafe
- audit budget and launch actions
- ad platform policy checks

## 13. Implementation Roadmap

### Phase 1: Truthful Solution Readiness Layer

- Add a solution readiness doc/page inside Settings or internal docs.
- Mark AI Search as partial.
- Mark Lead Conversion as partial.
- Mark Paid Boost as planned.
- Prevent sales/marketing copy from overclaiming.

### Phase 2: Complete AI Search MVP

- Real buyer-intent research.
- Real AI mention/citation tracking.
- Page Engine publishing completion.
- AI bot analytics.
- Authority/backlink acquisition tracking.
- Lead attribution from AI-search pages.

### Phase 3: Complete Lead Conversion MVP

- Lead detail drawer.
- Visitor journey.
- Notes/activity UI.
- Owner assignment.
- Form builder.
- Routing rules.
- Notifications.
- Follow-up templates.
- CRM sync jobs.

### Phase 4: Build Paid Boost MVP

- Paid Boost data model.
- Campaign builder.
- Brand Memory creative generator.
- Landing page generator.
- Google Ads integration first.
- Budget pacing.
- Lead attribution.
- ROI dashboard.

### Phase 5: Autonomous Agent Layer

- Agent orchestration.
- Background jobs.
- Cross-workflow recommendations.
- Approval gates.
- Outcome reporting.
- Scheduled optimization loops.

## 14. Test Plan

Static:

```text
pnpm typecheck
pnpm lint
pnpm build
```

AI Search smoke:

- create Brand Memory
- discover buyer-intent searches
- generate strategy
- create page
- publish page
- capture AI mention
- capture AI bot visit
- capture lead from AI-search page
- show outcome dashboard

Lead Conversion smoke:

- run conversion audit
- create form
- submit lead
- add note
- assign lead
- send notification
- trigger follow-up
- sync CRM
- show conversion dashboard

Paid Boost smoke:

- create campaign
- generate creatives
- generate landing page
- approve campaign
- test ad integration
- simulate spend/clicks/leads
- show ROI
- pause campaign

Browser QA:

- `/ai-search`
- `/lead-conversion`
- `/paid-boost`
- mobile 375px
- tablet 768px
- desktop
- no clipped text
- no inert CTAs
- all primary actions call APIs

Security QA:

- cross-workspace access blocked
- PII masked by role
- OAuth tokens not exposed
- spend approval required
- public endpoints rate-limited
- audit logs created

## 15. Claude Implementation Prompt

```text
Implement GEOSEO solution parity for AI Search, Lead Conversion, and Paid Boost.

Use this PRD as the source of truth. First create a solution readiness layer that
truthfully reports current product status:
- AI Search = partial
- Lead Conversion = partial
- Paid Boost = planned/not built

Then implement the missing product surfaces in phases:

1. AI Search workspace:
   - real buyer-intent research APIs
   - strategy blueprinting from Google/AI results
   - AI mention and bot activity tracking
   - page generation/publish integration
   - authority/backlink tracking
   - lead attribution and outcomes

2. Lead Conversion workspace:
   - conversion audit
   - lead detail drawer
   - visitor journey
   - notes/activity UI
   - owner assignment
   - form builder
   - routing rules
   - notifications
   - follow-up workflow
   - CRM sync jobs

3. Paid Boost workspace:
   - campaign data model
   - campaign builder
   - ad creative generation from Brand Memory
   - paid landing page generation
   - budget and targeting
   - provider integration abstraction
   - ROI dashboard
   - approval/spend guardrails

All visible actions must call APIs. Keep the existing product working. Do not
claim paid campaign functionality is complete until at least one real provider
integration and tracking loop exists.

Run:
- pnpm typecheck
- pnpm lint
- pnpm build

Then run API smoke tests and Browser QA for /ai-search, /lead-conversion,
/paid-boost, /pages, /leads, /analytics, and /performance.
```

