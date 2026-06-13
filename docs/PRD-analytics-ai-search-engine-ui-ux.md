# PRD - Analytics, AI Search Visibility, and Performance Intelligence

Benchmark:

```text
https://www.gushwork.ai/analytics
```

GEOSEO screen:

```text
Analytics
Performance Trends
Track human traffic, AI bot visits, AI mentions, rankings, leads, and content
performance across every buyer-intent page GEOSEO creates and optimizes.
```

This PRD updates GEOSEO's Analytics and Performance workspace based on the
Gushwork benchmark and GEOSEO's current product direction.

Gushwork frames Analytics around:

- human traffic
- AI traffic
- AI mentions
- lead analytics
- ranking tracker
- content performance

GEOSEO already has a useful Performance Trends prototype: rank series,
impressions, clicks, CTR, AI visibility cards, tracked pages, page drilldowns,
range switching, export, responsive charts, and recommended actions. The next
version must expand this into a full analytics engine that measures both human
and AI behavior, connects metrics to published pages and leads, and triggers the
right optimization workflows.

---

## 1. Product Goal

Build Analytics as the command center for proving GEOSEO's impact.

The workspace should help users answer:

- Are humans visiting my generated pages?
- Are AI bots crawling my pages?
- Are AI engines mentioning or citing my brand?
- Which pages create leads?
- Which pages are ranking, slipping, or decaying?
- Which search intents are producing traffic and pipeline?
- Which content should be refreshed, expanded, linked, or retired?
- Which competitors are gaining AI and search share?
- What did GEOSEO do, and what business result followed?

Analytics should make GEOSEO feel measurable, accountable, and sellable.

## 2. Current GEOSEO Baseline

### Current Route and Page

Current route:

```text
/performance
```

Current page header:

```text
Analytics
Performance Trends
Ranking momentum, search traffic, and AI-answer visibility across your tracked pages.
```

### Current Data Types

Existing analytics-like types include:

- `RankPoint`
- `ImpressionPoint`
- `TrackedPage`
- `AiVisibilitySignal`
- `PerformanceOverview`
- `KpiMetric`
- `Alert`

Current tracked page fields:

- id
- path
- title
- currentRank
- prevRank
- impressions
- clicks
- rank history
- impression/click history

Current AI visibility fields:

- engine
- label
- mentions
- shareOfVoice
- delta

### Current API

Implemented endpoints:

```text
GET /api/v1/performance/overview
GET /api/v1/performance/domain-health
GET /api/v1/performance/rank-series
GET /api/v1/performance/impression-series
GET /api/v1/performance/ai-visibility
GET /api/v1/performance/pages
GET /api/v1/performance/pages/:id
```

Planned in docs:

```text
POST /api/v1/performance/export
```

### Current UI

Implemented UI capabilities:

- KPI strip for average rank, impressions, clicks, CTR
- date range cycle: 7d, 30d, 8w, quarter
- insight summary band
- average ranking chart
- search traffic chart
- AI Search Visibility panel
- tracked pages table
- tracked page status filters
- mobile tracked-page card layout
- drilldown drawer with rank and traffic history
- recommended actions linking to Content and Alerts
- CSV export from client-side tracked page data
- loading skeleton
- lazy chart loading

## 3. What Is Good Already

The current product has a strong analytics foundation:

- clear rank and traffic story
- good page-level drilldown
- clean visual system
- useful responsive behavior
- AI visibility already exists conceptually
- tracked page rows connect to actions
- date ranges affect displayed charts
- export affordance exists
- alerts and content refresh flows already reference performance

The gap is not polish alone. The gap is that analytics is still mostly SEO
performance, not a full AI-era analytics product.

## 4. Key Gaps

### Gap 1: No Human Website Traffic Analytics

Gushwork highlights total visitors, page views, sessions, bounce rate, source,
device, and time period.

GEOSEO currently has search impressions and clicks, but not actual site traffic.

Missing:

- visitors
- page views
- sessions
- bounce rate
- engagement time
- source and medium
- device
- geography
- landing pages
- exit pages
- conversion rate
- event tracking

### Gap 2: No AI Bot Traffic Analytics

Gushwork specifically tracks AI bots visiting the site.

GEOSEO currently shows AI visibility mentions, but not AI bot crawl activity.

Missing:

- AI bot visits
- bot identity
- crawl frequency
- pages crawled by AI bots
- last AI crawl
- crawl depth
- AI bot engagement events
- blocked/allowed AI bot status
- llms.txt and robots.txt impact
- AI crawler trend over time

### Gap 3: AI Mentions Are Too Shallow

Current AI visibility has mentions and share of voice by engine. It does not
show what was asked, where the brand appeared, what was cited, or how GEOSEO can
improve it.

Missing:

- prompt/query tracked
- cited URL
- answer excerpt
- brand position
- competitors mentioned
- sentiment
- confidence
- citation presence
- source engine
- screenshot or captured response
- historical trend
- missed mention opportunities

### Gap 4: Lead Analytics Is Not Integrated

Gushwork includes leads by page and time. GEOSEO has a Leads page, but
Performance Trends does not deeply connect traffic and rankings to lead output.

Missing:

- leads by page
- conversion rate by page
- qualified leads by page
- won leads by page
- lead source attribution
- lead journey analytics
- leads from AI-search pages
- revenue or pipeline value
- page ROI leaderboard

### Gap 5: Ranking Tracker Needs Competitor Context

Current ranking tracker shows current and previous rank. It does not show
competitor positions, SERP features, keyword groups, intent, or page ownership.

Missing:

- keyword-level tracking
- competitor rank comparison
- SERP feature ownership
- rank distribution
- keyword intent stage
- device and location
- ranking URL changes
- cannibalization alerts
- search volume and estimated traffic value

### Gap 6: Content Performance Is Narrow

Current tracked pages score rank, impressions, and clicks. Gushwork expects every
page scored by traffic, engagement, and conversions.

Missing:

- content health score
- engagement score
- conversion score
- freshness score
- AI crawl score
- AI citation score
- internal link score
- refresh urgency
- business impact
- last optimization job
- next recommended action

### Gap 7: No Real Analytics Event Pipeline

The product needs a collection system for human and AI events. Current data is
provider/mock oriented.

Missing:

- public analytics ingestion endpoint
- tracker script or pixel
- anonymous visitor ID
- session ID
- bot detection
- consent-aware event capture
- server-side event validation
- event dedupe
- warehouse-style aggregation

### Gap 8: No Annotation and Change Correlation

Users need to understand cause and effect.

Missing annotations:

- page published
- page refreshed
- internal links applied
- backlink acquired
- Brand Memory changed
- sitemap synced
- llms.txt changed
- alert resolved
- competitor changed

### Gap 9: No Analytics-Driven Automation

Analytics should not only report. It should trigger action.

Missing:

- create content refresh job from analytics insight
- create internal link job
- create backlink opportunity from rank gap
- create alert threshold rule
- create Page Engine opportunity from search/AI gap
- create report/export schedule

### Gap 10: No Production Privacy and Bot Controls

Traffic analytics requires privacy design.

Missing:

- consent mode
- IP hashing
- user-agent hashing
- PII avoidance
- data retention
- crawler allow/block status
- workspace-scoped analytics keys
- rate limits
- bot spoof protection

## 5. Product Positioning

Analytics is not just a reporting tab.

It is the feedback loop that tells GEOSEO what to do next.

Positioning:

```text
GEOSEO Analytics unifies human traffic, AI bot activity, AI mentions, search
rankings, content health, and lead outcomes so teams can see what is working,
what is decaying, and what GEOSEO should optimize next.
```

## 6. Success Metrics

Activation:

- 80% of onboarded workspaces install analytics or use managed page tracking.
- 90% of published GEOSEO pages emit analytics events.
- First analytics event appears within 5 minutes of publishing a page.

Visibility:

- AI bot activity is captured for supported crawlers.
- AI mentions are tracked across configured engines.
- Ranking data is tied to page and keyword records.

Outcome:

- 100% of leads are attributable to a page or source when possible.
- Analytics identifies at least one actionable recommendation per active
  workspace per week.
- Users can export traffic, AI visibility, ranking, lead, and page performance
  reports.

Trust:

- Users can see where metrics came from.
- Users can distinguish estimated data from verified event data.
- Privacy controls are visible and configurable.

## 7. Primary Users

### Founder / Owner

Needs:

- business impact at a glance
- proof that GEOSEO is producing traffic and leads
- simple action recommendations
- no analytics jargon overload

### Marketer

Needs:

- channel, page, ranking, AI mention, and lead attribution
- content performance breakdown
- campaign and UTM reporting
- exportable reports

### SEO / Content Operator

Needs:

- rank tracker
- page decay detection
- AI crawl and AI mention visibility
- content refresh priority
- competitor comparison

### Agency / Operator

Needs:

- multi-client reporting
- client-ready exports
- proof of progress
- annotations showing what work was done
- scheduled reports

## 8. Core User Stories

1. As a user, I can see human visitors, page views, sessions, bounce rate, and
   engagement for generated pages.
2. As a user, I can see which AI bots crawled my pages and when.
3. As a user, I can see when ChatGPT, Perplexity, Gemini, Claude, or Google AI
   mention or cite my brand.
4. As a user, I can see which pages generate leads and qualified leads.
5. As a marketer, I can compare page traffic, engagement, rankings, AI mentions,
   and conversions in one table.
6. As an SEO operator, I can track keyword positions and competitor movement.
7. As a user, I can open any page and understand its full performance story.
8. As a user, I can trigger a content refresh from an analytics recommendation.
9. As an agency, I can export a client-ready report.
10. As an admin, I can configure privacy, tracking, AI crawler rules, and data
    retention.

## 9. Information Architecture

Analytics should become a first-class workspace with these sections:

```text
Overview
Human Traffic
AI Traffic
AI Mentions
Lead Analytics
Rankings
Content Performance
Attribution
Reports
Settings
```

The existing `/performance` route can remain as a backward-compatible alias or
deep link. The product-facing nav should use "Analytics".

### Overview

Purpose:

- show full-funnel performance at a glance
- connect traffic, AI visibility, rankings, content, and leads
- surface what to act on next

Primary metrics:

- visitors
- sessions
- page views
- AI bot visits
- AI mentions
- average rank
- impressions
- clicks
- leads
- qualified leads
- conversion rate
- content health

Required panels:

- performance summary
- human vs AI activity
- top converting pages
- AI mention trend
- ranking movement
- content needing action
- recent annotations

### Human Traffic

Purpose:

- answer how humans interact with pages

Metrics:

- visitors
- new visitors
- returning visitors
- sessions
- page views
- bounce rate
- engagement time
- scroll depth
- CTA clicks
- form starts
- conversions

Breakdowns:

- source/medium
- referrer
- campaign
- device
- browser
- country/region
- landing page
- page type

### AI Traffic

Purpose:

- show AI crawler behavior

Metrics:

- AI bot visits
- unique AI bots
- pages crawled
- crawl frequency
- last crawl
- status codes
- crawl depth
- crawl freshness
- llms.txt hits
- robots.txt hits

Breakdowns:

- bot name
- engine/company
- page
- status code
- date range
- crawl source

Supported bot labels:

- OpenAI / ChatGPT
- Perplexity
- Google AI / Gemini
- Anthropic / Claude
- Microsoft Copilot
- Common Crawl
- other detected crawlers

### AI Mentions

Purpose:

- track when AI tools mention or cite the brand and pages

Metrics:

- mentions
- citations
- share of voice
- answer inclusion rate
- average brand position
- competitor mentions
- sentiment
- cited URL count
- missed opportunity count

Rows:

- prompt/query
- engine
- brand mentioned
- cited page
- competitors cited
- answer excerpt
- captured at
- confidence
- recommended action

### Lead Analytics

Purpose:

- show which pages and sources produce buyers

Metrics:

- leads
- qualified leads
- high-intent leads
- conversion rate
- form starts
- form completion rate
- won leads
- pipeline value

Breakdowns:

- page
- source
- campaign
- AI-search vs organic vs referral vs direct
- opportunity
- page type
- buyer profile
- content cluster

### Rankings

Purpose:

- monitor keyword performance and competitor rank movement

Metrics:

- average rank
- rank distribution
- keywords in top 3 / top 10 / top 20
- rank gains
- rank losses
- estimated traffic value
- SERP feature ownership

Rows:

- keyword
- intent
- target page
- current rank
- previous rank
- competitor ranks
- search volume
- difficulty
- SERP features
- location/device

### Content Performance

Purpose:

- score every page by SEO, AI, traffic, engagement, and conversion performance

Metrics:

- traffic score
- engagement score
- conversion score
- ranking score
- AI crawl score
- AI citation score
- freshness score
- internal link score
- content health score

Rows:

- page
- status
- content type
- traffic
- AI visits
- AI mentions
- rank
- leads
- conversion rate
- health
- next action

### Attribution

Purpose:

- connect work performed by GEOSEO to results

Views:

- page published -> traffic trend
- page refreshed -> rank/click trend
- backlink acquired -> rank trend
- internal links applied -> crawl/rank trend
- AI mention gained -> source page/citation
- lead captured -> journey and source

### Reports

Purpose:

- help users sell, prove, and review performance

Required:

- export CSV
- export JSON
- export PDF snapshot
- scheduled email report
- client-ready report
- date range comparisons
- saved report views

### Settings

Purpose:

- configure analytics collection and privacy

Required:

- tracking status
- analytics key
- install snippet
- allowed domains
- consent mode
- data retention
- bot detection rules
- AI mention tracking prompts
- competitor list
- alert thresholds
- report schedule

## 10. End-to-End Workflows

### Workflow 1: Published Page Starts Tracking

1. Page is published by Page Engine.
2. System attaches workspace analytics key and page ID.
3. Public tracker records page view, session, source, and device.
4. Events are validated, deduped, and stored.
5. Aggregates update for page, source, and workspace.
6. Page detail shows traffic and conversion data.

### Workflow 2: AI Bot Crawls Page

1. AI bot requests a published page or `llms.txt`.
2. Server detects bot from user agent and request pattern.
3. Event is stored as AI bot traffic.
4. Page AI crawl freshness updates.
5. Analytics shows bot, page, status code, and crawl time.
6. If important pages are not crawled, an alert/recommendation appears.

### Workflow 3: AI Mention Is Detected

1. Scheduled tracker queries configured AI engines or approved monitoring source.
2. System captures answer result.
3. System detects brand mention, page citation, competitors, and sentiment.
4. Mention is stored with prompt, engine, answer excerpt, and confidence.
5. Analytics updates AI mention trend and share of voice.
6. Missed opportunities create recommendations for content/backlinks.

### Workflow 4: Lead Attribution

1. Visitor lands on generated page.
2. Tracker records journey events.
3. Visitor submits lead form.
4. Lead is tied to session, source, page, and campaign.
5. Analytics updates conversion rate and page ROI.
6. Authority HQ and Leads Dashboard show business impact.

### Workflow 5: Analytics Triggers Optimization

1. Analytics detects a page with rank drop, AI crawl decline, or conversion drop.
2. System creates a recommendation.
3. User clicks "Refresh page", "Apply internal links", "Add backlink target", or
   "Create new page".
4. Job is queued.
5. Annotation is added to charts.
6. Later performance changes are attributed to the action.

## 11. Data Model

### AnalyticsOverview

```ts
export interface AnalyticsOverview {
  workspaceId: string;
  range: string;
  humanTraffic: HumanTrafficSummary;
  aiTraffic: AiTrafficSummary;
  aiMentions: AiMentionSummary;
  rankings: RankingSummary;
  leads: LeadAnalyticsSummary;
  content: ContentPerformanceSummary;
  recommendations: AnalyticsRecommendation[];
  annotations: AnalyticsAnnotation[];
}
```

### HumanTrafficSummary

```ts
export interface HumanTrafficSummary {
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgEngagementSeconds: number;
  ctaClicks: number;
  formStarts: number;
  conversions: number;
  conversionRate: number;
  sources: TrafficBreakdown[];
  devices: TrafficBreakdown[];
}
```

### AiTrafficSummary

```ts
export interface AiTrafficSummary {
  botVisits: number;
  uniqueBots: number;
  pagesCrawled: number;
  llmsTxtHits: number;
  robotsTxtHits: number;
  lastCrawledAt?: string;
  byBot: AiBotBreakdown[];
  byPage: AiPageCrawlSummary[];
}
```

### AiBotVisit

```ts
export interface AiBotVisit {
  id: string;
  workspaceId: string;
  pageId?: string;
  url: string;
  bot:
    | "openai"
    | "perplexity"
    | "google-ai"
    | "anthropic"
    | "microsoft"
    | "common-crawl"
    | "other";
  userAgent: string;
  statusCode: number;
  referrer?: string;
  ipHash?: string;
  occurredAt: string;
}
```

### AiMention

```ts
export interface AiMention {
  id: string;
  workspaceId: string;
  engine: "chatgpt" | "perplexity" | "gemini" | "claude" | "google-ai" | "copilot";
  prompt: string;
  brandMentioned: boolean;
  citedUrls: string[];
  citedPageIds: string[];
  competitorsMentioned: string[];
  answerExcerpt: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  brandPosition?: number;
  confidence: number;
  capturedAt: string;
}
```

### RankingKeyword

```ts
export interface RankingKeyword {
  id: string;
  workspaceId: string;
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  targetPageId?: string;
  currentRank: number;
  previousRank: number;
  searchVolume?: number;
  difficulty?: number;
  estimatedTrafficValue?: number;
  location?: string;
  device?: "desktop" | "mobile";
  competitors: Array<{ domain: string; rank: number; url?: string }>;
  serpFeatures: string[];
  updatedAt: string;
}
```

### ContentPerformance

```ts
export interface ContentPerformance {
  pageId: string;
  title: string;
  path: string;
  pageType: string;
  status: "healthy" | "watch" | "needs_refresh" | "critical";
  visitors: number;
  sessions: number;
  aiBotVisits: number;
  aiMentions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  currentRank?: number;
  leads: number;
  qualifiedLeads: number;
  conversionRate: number;
  engagementScore: number;
  rankingScore: number;
  aiVisibilityScore: number;
  conversionScore: number;
  freshnessScore: number;
  healthScore: number;
  nextAction?: AnalyticsRecommendation;
}
```

### AnalyticsEvent

```ts
export interface AnalyticsEvent {
  id: string;
  workspaceId: string;
  anonymousVisitorId: string;
  sessionId: string;
  pageId?: string;
  type:
    | "page_view"
    | "cta_click"
    | "scroll_depth"
    | "form_start"
    | "form_submit"
    | "external_click"
    | "download";
  url: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  device?: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  country?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}
```

### AnalyticsAnnotation

```ts
export interface AnalyticsAnnotation {
  id: string;
  workspaceId: string;
  pageId?: string;
  type:
    | "page_published"
    | "page_refreshed"
    | "backlink_acquired"
    | "internal_links_applied"
    | "brand_memory_changed"
    | "sitemap_synced"
    | "llms_updated"
    | "alert_resolved"
    | "job_completed";
  label: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  occurredAt: string;
}
```

### AnalyticsRecommendation

```ts
export interface AnalyticsRecommendation {
  id: string;
  workspaceId: string;
  severity: "critical" | "warning" | "info" | "opportunity";
  type:
    | "refresh_content"
    | "add_internal_links"
    | "acquire_backlinks"
    | "create_page"
    | "improve_cta"
    | "update_schema"
    | "fix_indexing"
    | "improve_ai_citation";
  title: string;
  reason: string;
  pageId?: string;
  metricImpact?: string;
  actionLabel: string;
  actionEndpoint?: string;
}
```

## 12. API Requirements

Keep current `/performance` endpoints working. Add `/analytics` as the new
product API surface.

### Overview

```text
GET /api/v1/analytics/overview
GET /api/v1/analytics/summary
GET /api/v1/analytics/recommendations
POST /api/v1/analytics/recommendations/:id/action
```

### Human Traffic

```text
GET  /api/v1/analytics/human-traffic
GET  /api/v1/analytics/human-traffic/sources
GET  /api/v1/analytics/human-traffic/devices
GET  /api/v1/analytics/human-traffic/pages
POST /api/v1/analytics/events
```

Public event ingest:

```text
POST /api/v1/public/analytics/events
POST /api/v1/public/analytics/batch
GET  /api/v1/public/analytics/script.js
```

### AI Traffic

```text
GET /api/v1/analytics/ai-traffic
GET /api/v1/analytics/ai-traffic/bots
GET /api/v1/analytics/ai-traffic/pages
GET /api/v1/analytics/ai-traffic/events
```

### AI Mentions

```text
GET  /api/v1/analytics/ai-mentions
GET  /api/v1/analytics/ai-mentions/:id
POST /api/v1/analytics/ai-mentions/check
POST /api/v1/analytics/ai-mentions/prompts
GET  /api/v1/analytics/ai-mentions/prompts
DELETE /api/v1/analytics/ai-mentions/prompts/:id
```

### Lead Analytics

```text
GET /api/v1/analytics/leads
GET /api/v1/analytics/leads/by-page
GET /api/v1/analytics/leads/by-source
GET /api/v1/analytics/leads/funnel
GET /api/v1/analytics/leads/roi
```

### Rankings

```text
GET  /api/v1/analytics/rankings
GET  /api/v1/analytics/rankings/keywords
GET  /api/v1/analytics/rankings/keywords/:id
POST /api/v1/analytics/rankings/keywords
PATCH /api/v1/analytics/rankings/keywords/:id
DELETE /api/v1/analytics/rankings/keywords/:id
```

### Content Performance

```text
GET /api/v1/analytics/content
GET /api/v1/analytics/content/:pageId
GET /api/v1/analytics/content/:pageId/timeline
POST /api/v1/analytics/content/:pageId/refresh
POST /api/v1/analytics/content/:pageId/apply-internal-links
```

### Reports and Export

```text
POST /api/v1/analytics/export
GET  /api/v1/analytics/reports
POST /api/v1/analytics/reports
PATCH /api/v1/analytics/reports/:id
DELETE /api/v1/analytics/reports/:id
POST /api/v1/analytics/reports/:id/send
```

### Settings

```text
GET  /api/v1/analytics/settings
PUT  /api/v1/analytics/settings
POST /api/v1/analytics/settings/test
POST /api/v1/analytics/settings/regenerate-key
```

## 13. UI Requirements

### Page Header

Title:

```text
Analytics
```

Subtitle:

```text
Human traffic, AI bot activity, AI mentions, rankings, leads, and page
performance in one place.
```

Actions:

- date range picker
- export
- configure tracking
- report schedule

Route:

- primary: `/analytics`
- backward-compatible alias: `/performance`

### KPI Strip

Required cards:

- visitors
- AI bot visits
- AI mentions
- average rank
- clicks
- leads
- conversion rate
- content health

Each card:

- stable dimensions
- trend delta
- tooltip definition
- click filters the workspace

### Unified Insight Band

Show one concise insight:

```text
AI bot crawls are up 18%, but 3 high-intent pages slipped in rank and generated
40% fewer leads. Refresh the comparison cluster first.
```

The insight must include:

- status
- reason
- recommended action
- source of data

### Overview Layout

Desktop:

- top KPI strip
- human vs AI trend chart
- AI mentions panel
- top converting pages
- content needing action
- annotations timeline

Mobile:

- KPI carousel/grid
- stacked charts
- action cards before dense tables

### Human Traffic View

Required:

- trend chart
- source breakdown
- device breakdown
- top landing pages
- CTA/form events
- table with visitors, sessions, bounce, engagement, conversions

### AI Traffic View

Required:

- bot visit trend
- AI bot list
- top AI-crawled pages
- last crawl by bot
- llms.txt and robots.txt activity
- crawl status table
- recommendation for pages not crawled recently

### AI Mentions View

Required:

- mentions trend
- share of voice by engine
- prompt table
- cited URLs
- competitors mentioned
- answer excerpt drawer
- "Improve citation" action
- "Create page for missed prompt" action

### Lead Analytics View

Required:

- leads over time
- conversion by page
- qualified leads by page
- source/channel breakdown
- page ROI table
- link to Lead Dashboard filtered view

### Rankings View

Required:

- keyword table
- rank distribution
- competitor comparison
- SERP feature chips
- top gains/losses
- location/device filter
- add keyword
- export ranking report

### Content Performance View

Required:

- page health table
- health score breakdown
- filters by page type/status
- action buttons:
  - refresh content
  - apply internal links
  - add backlink target
  - inspect page
  - create related page
- page detail drawer with full timeline

### Attribution View

Required:

- annotations on charts
- before/after performance cards
- job/action timeline
- impact estimate
- link to related page, job, alert, or backlink

### Settings View

Required:

- tracking installation state
- script snippet
- allowed domains
- consent settings
- event types enabled
- AI bot detection status
- AI mention prompts
- competitors tracked
- report schedules
- data retention

## 14. Visual and UX Direction

Keep GEOSEO's current visual system:

- light analytics SaaS
- cool-gray canvas
- white panels
- violet accent
- black pill CTAs
- hairline borders
- compact data density
- status badges
- polished charts

Analytics should feel like a command center, not a generic chart dump.

Use:

- segmented tabs
- metric cards
- line/area charts
- compact tables
- confidence badges
- AI bot badges
- source chips
- annotation markers
- action cards
- page detail drawers

Avoid:

- placeholder "coming soon" panels
- chart-only pages with no recommendations
- dumping raw data without context
- table-only mobile layouts
- unlabelled AI metrics
- hidden export/report actions

## 15. Responsive Requirements

375px mobile:

- primary tabs horizontally scroll or collapse to menu
- KPI cards wrap cleanly
- tables become cards or use controlled horizontal scroll
- chart labels do not overlap
- detail drawer becomes full-screen sheet
- touch targets at least 44px

768px tablet:

- two-column card layout
- charts stack cleanly
- filters stay usable

Desktop:

- dense but readable dashboard
- sticky filter/date controls
- drilldowns open without losing context

## 16. Micro-Interactions

Use subtle motion with reduced-motion support:

- KPI count-up
- new event pulse
- chart annotation hover
- drawer transitions
- export/report progress
- recommendation action queued state
- filter chip transitions
- AI mention captured toast

Do not animate dense chart content in a way that harms readability.

## 17. Workflow Stitching

### Page Engine

Analytics must:

- receive publish/refesh annotations
- track generated pages automatically
- show leads and conversions per generated page
- feed refresh recommendations back to Page Engine

### Brand Memory

Analytics must:

- use buyer profiles to group pages and leads
- show performance by persona or ICP when available
- connect AI mentions to approved brand terms and competitors

### Leads

Analytics must:

- include lead conversion and quality
- link each page's traffic to leads
- show source-to-lead attribution
- update ROI when leads are won/lost

### Alerts

Analytics must:

- create alerts for rank drops, traffic drops, AI crawl drops, AI mention losses,
  lead spikes, and conversion drops
- link alerts back to chart context

### Content

Analytics must:

- trigger refresh recommendations
- expose stale pages
- show before/after refresh impact
- connect internal-link changes to performance

### Backlinks

Analytics must:

- correlate acquired backlinks with rank and traffic changes
- recommend backlink acquisition when rank gap is authority-driven

### Search

Global search must:

- find analytics pages, metrics, AI mentions, keywords, reports, and content
  performance records
- support action shortcuts like "export analytics" and "refresh slipping pages"

## 18. Security, Privacy, and Compliance

Analytics touches visitor behavior and lead-adjacent data. Requirements:

- workspace-scoped analytics keys
- allowed domain enforcement
- public event endpoint rate limits
- event payload validation
- no raw PII in analytics events
- IP hashing or truncation
- user-agent hashing where appropriate
- consent mode support
- data retention controls
- delete/export controls
- role-gated access to lead analytics
- bot spoofing mitigation
- CORS restrictions for tracker script
- signed webhook/report callbacks
- no secret keys in client bundles
- audit logs for export, settings change, report schedule, and key regeneration

## 19. Performance and Scale

Requirements:

- event ingest should be lightweight and async
- charts use aggregated tables, not raw event scans
- large tables use server pagination, filtering, and sorting
- heavy charts are dynamically loaded
- dashboard aggregates are cached by workspace and range
- AI mention checks run as jobs
- report generation runs as jobs
- event ingestion tolerates bursts
- old raw events roll up to daily aggregates

Suggested storage:

- `analytics_events`
- `analytics_sessions`
- `analytics_daily_rollups`
- `ai_bot_visits`
- `ai_mentions`
- `ranking_keywords`
- `ranking_snapshots`
- `content_performance_daily`
- `analytics_annotations`
- `analytics_recommendations`
- `analytics_reports`
- `analytics_settings`

## 20. Empty, Loading, and Error States

Empty:

- "No analytics data yet"
- show install snippet
- show "Publish a page" CTA
- show "Send test event" CTA

Loading:

- stable KPI skeletons
- chart skeletons
- table skeletons
- panel-level loading states

Error:

- retry
- show data source that failed
- keep partial data where possible
- explain missing permissions or integration

Partial data:

- show "Estimated" vs "Verified"
- show missing source warnings
- show setup checklist

## 21. Acceptance Criteria

Functional:

- `/analytics` loads and `/performance` remains compatible.
- Date range changes call APIs and update all visible data.
- Human traffic metrics are displayed.
- AI bot traffic metrics are displayed.
- AI mentions are displayed with prompt, engine, citation, and competitors.
- Lead analytics are displayed by page and source.
- Rankings include keyword-level rows.
- Content performance table includes traffic, AI, ranking, and conversion data.
- Recommendations can queue real jobs or call real APIs.
- Exports are generated through API.
- Tracking settings can be viewed and updated.

Workflow:

- Published pages emit analytics events.
- AI bot visits are captured.
- AI mention checks create records.
- Leads update analytics conversion metrics.
- Content refresh jobs create chart annotations.
- Alerts link to analytics context.

UX:

- User understands the main performance story in under 10 seconds.
- User can find what to act on next without reading every chart.
- Mobile is usable at 375px.
- No visible CTA is inert.
- Empty states tell users how to get data.

Security:

- Analytics event ingestion is rate-limited.
- Events do not store raw PII.
- Analytics keys are workspace-scoped.
- Exports are permission-gated and audited.

Performance:

- Overview loads under 2 seconds for normal workspaces.
- Large page/keyword tables are paginated.
- Chart rendering does not block the route.

## 22. Implementation Plan

### Phase 1: Route and API Foundation

- Add `/analytics` route and keep `/performance` as alias.
- Add `/api/v1/analytics/overview`.
- Add analytics overview types.
- Add empty/loading/error states.
- Move Performance Trends into Analytics tab structure.

### Phase 2: Human Traffic

- Add public analytics event endpoint.
- Add tracker script or managed page event emitter.
- Store page views, sessions, CTA clicks, form starts, and conversions.
- Add human traffic panels and breakdowns.

### Phase 3: AI Traffic

- Add AI bot detection.
- Capture AI bot visits for generated pages, `llms.txt`, and sitemap.
- Add AI traffic dashboard and page-level crawl freshness.

### Phase 4: AI Mentions

- Add AI mention prompt config.
- Add AI mention check job.
- Store mention, citation, competitor, and answer excerpt data.
- Add AI mention table and detail drawer.

### Phase 5: Lead and Content Analytics

- Connect lead events to analytics sessions.
- Add lead analytics panels.
- Add content health score.
- Add page ROI and conversion tables.

### Phase 6: Rankings and Competitors

- Add keyword-level ranking model.
- Add competitor rank snapshots.
- Add SERP feature data.
- Add rankings tab.

### Phase 7: Automation and Reports

- Add recommendation action endpoints.
- Add report export API.
- Add scheduled reports.
- Add annotations and before/after impact views.

### Phase 8: Privacy and Scale

- Add analytics settings.
- Add allowed domains.
- Add consent controls.
- Add retention rules.
- Add event rollups and caching.
- Add audit logs for settings, exports, and key regeneration.

## 23. Test Plan

Static:

```text
pnpm typecheck
pnpm lint
pnpm build
```

API smoke:

- get analytics overview
- post public analytics event
- post batch analytics events
- get human traffic
- get AI traffic
- create AI mention prompt
- run AI mention check
- get lead analytics
- get ranking keywords
- add ranking keyword
- get content performance
- queue content refresh from recommendation
- export analytics report
- update analytics settings

Browser QA:

- `/analytics` desktop loads
- `/analytics` mobile 375px loads
- `/performance` still works or redirects
- date range updates data
- tabs switch without blank states
- human traffic chart renders
- AI traffic panel renders
- AI mentions table opens detail
- lead analytics links to Leads
- content performance actions queue jobs
- export action works
- settings install snippet is visible
- no console errors
- no clipped text
- keyboard focus visible
- reduced motion respected

Security QA:

- public event endpoint rejects invalid workspace key
- public event endpoint rejects disallowed domain
- public event endpoint rate limits bursts
- raw PII is rejected or scrubbed
- analytics export requires permission
- settings change creates audit log
- tracker script does not expose secrets

## 24. Claude Implementation Prompt

```text
Implement the GEOSEO Analytics PRD.

Use the current Performance implementation as the baseline:
- packages/types/src/index.ts PerformanceOverview, RankPoint, ImpressionPoint,
  TrackedPage, AiVisibilitySignal
- apps/api/src/modules/performance.controller.ts
- apps/web/src/app/(app)/performance/page.tsx
- apps/web/src/components/performance/*
- apps/web/src/lib/api-client.ts performance methods

Do not leave Analytics as only SEO charts. Expand it into a full Analytics
workspace with Overview, Human Traffic, AI Traffic, AI Mentions, Lead Analytics,
Rankings, Content Performance, Attribution, Reports, and Settings.

Keep /performance working as an alias or compatibility route, but make
/analytics the product-facing route.

Prioritize:
1. analytics overview API and UI
2. human traffic event ingestion and panels
3. AI bot traffic tracking
4. AI mention records and detail drawer
5. lead analytics by page/source
6. content performance health table
7. keyword ranking tracker with competitor context
8. recommendations that queue real jobs
9. report export through API
10. privacy, consent, allowed domains, analytics keys, and audit logs

All visible actions must call APIs. No production workflow should depend on
dummy data. Use mock or seed data only for local/dev fallback where the product
explicitly marks it as sample.

Run:
- pnpm typecheck
- pnpm lint
- pnpm build

Then run API smoke tests and Browser QA for /analytics and /performance on
desktop and mobile.
```

