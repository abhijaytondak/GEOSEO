# PRD - Brand Memory Engine, UI, and Product Workflow

Benchmark:

```text
https://www.gushwork.ai/brand-memory
```

GEOSEO screen:

```text
Workspace
Brand Memory
Your brand's single source of truth, captured once and injected into every
outreach, page, content, analytics, and AI-search workflow.
```

This PRD updates GEOSEO Brand Memory based on the Gushwork benchmark and the
current GEOSEO product direction.

Gushwork frames Brand Memory as a single source of truth for what AI needs to
know about a business. Its visible pillars are:

- Product and service library
- Buyer profile
- Brand kit
- Feedback memory
- Competitor context

GEOSEO already has a useful first version: editable profile, website extraction,
completeness score, compiled prompt context, version history, and revert. The
next version must turn Brand Memory from a profile form into the operating
memory layer for every product workflow.

---

## 1. Product Goal

Build Brand Memory as the trusted business brain behind GEOSEO.

It should:

- capture the business once
- preserve source-backed facts
- learn from user corrections
- power page generation, backlink outreach, content refresh, analytics, search,
  onboarding, and future AI agents
- prevent hallucinated claims
- make AI output consistent with the customer's product, voice, proof, audience,
  competitors, and website style

The user should feel:

- "GEOSEO understands my business"
- "I do not need to repeat the same context"
- "AI pages and outreach sound like us"
- "I can see and control what the AI knows"
- "I can trust this to publish and sell with"

## 2. Current GEOSEO Baseline

### Implemented Data Shape

Current `BrandProfile` includes:

- company
- domain
- url
- valueProp
- topics
- industry
- tone
- contactName
- contactEmail
- audience
- differentiators
- competitors
- keywords

### Implemented API

Current API supports:

```text
GET  /api/v1/brand-profile
PUT  /api/v1/brand-profile
GET  /api/v1/brand-profile/versions
POST /api/v1/brand-profile/revert/:id
POST /api/v1/brand-profile/extract-from-site
```

### Implemented UI

Current UI supports:

- Brand Identity panel
- Positioning panel
- Outreach Contact panel
- Memory Strength meter
- Compiled Context preview
- Copy compiled context
- Save Brand Memory
- Discard local changes
- Version History
- Restore old version

### What Is Good Already

- Clear single-source-of-truth concept
- Simple editable model
- Versioned updates
- Revert safety
- Completeness meter
- Context preview for transparency
- Website extraction starting point
- Existing integration with onboarding, outreach, search, and Page Engine

## 3. Key Gaps

### Gap 1: Profile Is Too Shallow

The current profile cannot deeply represent:

- multiple products and services
- pricing and plans
- features
- use cases
- industries served
- locations served
- proof points
- customer stories
- claims that are allowed or forbidden
- brand terminology rules
- visual brand kit
- objection handling
- buyer journey stages
- ICP segmentation

### Gap 2: No Product and Service Library

The benchmark includes a product/service library so AI does not invent details.
GEOSEO needs structured product and service objects with descriptions, pricing,
features, benefits, target audiences, proof, URLs, and publishing rules.

### Gap 3: No True Buyer Profile System

Current `audience` is one free-text field. GEOSEO needs multiple personas with:

- role
- industry
- company size
- pain points
- buying triggers
- objections
- search intent
- content needs
- conversion CTA
- qualification rules

### Gap 4: No Brand Kit

Current Brand Memory has voice tone, but not a full brand kit.

Missing:

- colors
- typography
- logo references
- button style
- section rhythm
- preferred UI style
- banned visual styles
- image preferences
- screenshots
- generated page design rules

This gap connects directly to Page Engine. Brand Memory and Site Theme Profile
must work together so generated pages look native to the customer's website.

### Gap 5: No Feedback Memory

User corrections are saved as versions, but not learned as reusable rules.

If a user changes:

- "do not say AI-powered"
- "always mention warehouse-native"
- "avoid enterprise jargon"
- "use founder-led tone"
- "never compare us to X"

GEOSEO should save that as a reusable feedback rule, not only as a full profile
snapshot.

### Gap 6: No Competitor Intelligence

Current competitors are only strings. GEOSEO needs competitor profiles:

- URL
- positioning
- feature claims
- pricing notes
- keywords
- pages to monitor
- strengths
- weaknesses
- gaps GEOSEO can exploit
- last crawled date
- change alerts

### Gap 7: No Source Citations or Confidence

Brand Memory should show where each fact came from.

For example:

- "Pricing starts at $99/month" came from pricing page
- "For contractors" came from homepage H1
- "Used by HVAC businesses" came from case study

Every important fact should have:

- source
- confidence
- last verified date
- owner approval status
- conflict status

### Gap 8: No Memory Conflict Handling

If the website says "AI analytics platform" and a doc says "customer data
platform", GEOSEO should surface the conflict and ask the user to resolve it.

### Gap 9: No Context Packs Per Workflow

Different agents need different memory slices.

Examples:

- Page Engine needs product, ICP, proof, voice, keywords, theme guidance
- Backlink outreach needs company, differentiators, audience, credibility, CTA
- Content refresh needs claims, competitors, SEO terms, outdated facts
- Analytics needs goals, buyer journey, important conversion actions

Current compiled context is one generic block. GEOSEO needs workflow-specific
context packs.

### Gap 10: No Production-Grade Persistence and Multi-Tenant Controls

Brand Memory must be workspace-scoped, persistent, auditable, secure, and safe
for multiple users. The current implementation is a useful prototype, but the
sellable product requires production data stores, RBAC, audit logs, source
history, and data export.

## 4. Product Positioning

Brand Memory is not a settings page.

It is the operating layer that makes every GEOSEO agent business-aware.

Positioning:

```text
Brand Memory turns your website, documents, corrections, products, proof, and
competitor context into a living business memory that every GEOSEO workflow uses
before it writes, recommends, publishes, or optimizes anything.
```

## 5. Success Metrics

Activation:

- 80% of new workspaces complete Brand Memory during onboarding.
- 70% of workspaces add at least one source beyond homepage scan.
- Median time to useful Brand Memory is under 7 minutes.

Quality:

- 90% of generated outputs cite at least one approved Brand Memory fact.
- Less than 3% of generated drafts contain unapproved product claims.
- 80% of user edits become reusable feedback rules or fact updates.

Usage:

- Brand Memory is used by 100% of Page Engine drafts.
- Brand Memory is used by 100% of outreach drafts.
- Brand Memory is searchable from global search.
- Brand Memory changes trigger relevant refresh suggestions.

Trust:

- Users can inspect the source of every high-impact fact.
- Users can revert any change.
- Users can export their Brand Memory.
- Users can remove sources and delete sensitive fields.

## 6. Primary Users

### Founder / Owner

Needs:

- fast capture from website
- confidence AI understands the business
- easy correction
- generated pages that sound accurate
- no fake claims
- visible ROI

### Marketer

Needs:

- product and persona control
- brand voice consistency
- positioning and competitor context
- reusable messaging rules
- approval workflow
- content-ready context

### Agency / Operator

Needs:

- manage many client memories
- detect missing context
- add sources quickly
- maintain version history
- show clients what AI knows
- export or hand off client data

### Sales / Growth User

Needs:

- outreach-ready value props
- personas and objections
- differentiators
- proof points
- approved claims
- forbidden claims

## 7. Core User Stories

1. As a new user, I can scan my website and get a draft Brand Memory in minutes.
2. As a marketer, I can review every extracted fact before it affects generated
   content.
3. As a founder, I can add products, services, pricing, and customer segments so
   AI never invents what we sell.
4. As an agency, I can upload docs and URLs to enrich memory.
5. As a user, I can correct AI output once and have that correction apply
   everywhere.
6. As a content operator, I can see which pages were generated with which Brand
   Memory version.
7. As a user, I can compare versions and revert safely.
8. As a user, I can see source citations for claims.
9. As a user, I can mark facts as approved, needs review, outdated, or forbidden.
10. As a user, I can export Brand Memory if I leave GEOSEO.

## 8. Information Architecture

Brand Memory should become a first-class workspace with these tabs:

```text
Overview
Products & Services
Buyer Profiles
Voice & Messaging
Brand Kit
Competitors
Proof & Claims
Feedback Memory
Sources
Context Packs
Versions
```

### Overview

Purpose:

- show memory health
- show missing areas
- show recently learned facts
- show active sources
- show where memory is used
- offer quick actions

Primary UI:

- Memory Health score
- Source Coverage score
- Approval Coverage score
- Last updated
- "Scan site" CTA
- "Add source" CTA
- "Test output" CTA
- "Export memory" action
- "Review gaps" action

### Products & Services

Purpose:

- define exactly what the business sells
- prevent invented features, pricing, and service descriptions

Objects:

- products
- services
- plans
- features
- add-ons
- target use cases
- disallowed claims

### Buyer Profiles

Purpose:

- define who the business sells to
- improve page targeting and outreach personalization

Objects:

- personas
- industries
- pain points
- buying triggers
- objections
- search intents
- qualification rules

### Voice & Messaging

Purpose:

- make every generated output sound like the customer

Objects:

- tone
- vocabulary
- taglines
- approved phrases
- forbidden phrases
- CTA style
- messaging hierarchy
- elevator pitches
- objection responses

### Brand Kit

Purpose:

- connect written memory with visual identity and Page Engine theme matching

Objects:

- colors
- fonts
- logo assets
- button style
- image style
- layout preferences
- content density
- section rhythm
- screenshot references
- site theme profile link

### Competitors

Purpose:

- help GEOSEO generate pages and recommendations that exploit market gaps

Objects:

- competitor profiles
- comparison positioning
- competitor page watchlist
- keyword overlap
- strengths
- weaknesses
- gap opportunities
- monitored changes

### Proof & Claims

Purpose:

- keep content persuasive but truthful

Objects:

- testimonials
- case studies
- metrics
- certifications
- partners
- customers
- awards
- allowed claims
- forbidden claims
- claims needing proof

### Feedback Memory

Purpose:

- turn user corrections into durable rules

Examples:

- "Use 'AI search visibility' instead of 'GEO'."
- "Mention service coverage before pricing."
- "Never promise guaranteed rankings."
- "Prefer concise founder-led copy."

### Sources

Purpose:

- show every source that feeds memory
- allow re-scan and deletion
- surface extraction confidence

Source types:

- website page
- sitemap
- uploaded document
- pasted text
- CMS content
- competitor URL
- onboarding answer
- user correction
- approved generated page
- call transcript in future

### Context Packs

Purpose:

- show exactly what each workflow will use

Packs:

- Page Engine context
- Outreach context
- Content Refresh context
- Internal Linking context
- Analytics interpretation context
- AI Visibility context
- Search context

### Versions

Purpose:

- provide trust, auditability, rollback, and compliance

Required:

- version timeline
- diff view
- author
- change note
- sources changed
- downstream impact
- restore version

## 9. End-to-End Workflow

### Workflow 1: Onboarding to Brand Memory

1. User enters domain.
2. GEOSEO scans homepage, about page, product/service pages, pricing page, blog
   categories, sitemap, and metadata.
3. System creates a draft Brand Memory.
4. User reviews key extracted facts.
5. User resolves missing required fields.
6. User approves memory.
7. Memory becomes active version `v1`.
8. Page Engine, outreach, and search use `v1`.

### Workflow 2: Add Source

1. User clicks "Add source".
2. User chooses URL, sitemap, text, file, CMS, or manual note.
3. System queues extraction job.
4. System extracts facts with confidence and citations.
5. User reviews suggested additions.
6. User accepts, edits, rejects, or marks as forbidden.
7. Accepted facts create a new memory version.
8. Downstream context packs update.

### Workflow 3: Correct Once, Learn Everywhere

1. User edits a generated page or outreach draft.
2. GEOSEO detects a reusable correction.
3. UI asks: "Save this as a Brand Memory rule?"
4. User approves.
5. Rule is added to Feedback Memory.
6. Future generation uses the rule.
7. Existing drafts using old context are marked for optional refresh.

### Workflow 4: Generate Page With Memory

1. User approves a buyer-intent opportunity.
2. Page Engine requests Page Engine context pack.
3. Context pack includes product, ICP, claims, proof, voice, keywords, and theme
   guidance.
4. Draft page cites Brand Memory facts internally.
5. Quality gate checks generated page against approved/forbidden claims.
6. User sees "Generated from Brand Memory v12".
7. Publishing audit stores the memory version used.

### Workflow 5: Competitor Context Update

1. System monitors competitor pages.
2. New positioning or feature claim is detected.
3. System creates competitor change insight.
4. User reviews gap opportunity.
5. Accepted change updates competitor context.
6. Page Engine and content refresh receive new recommendations.

## 10. Data Model

### BrandMemory

```ts
export interface BrandMemory {
  id: string;
  workspaceId: string;
  status: "draft" | "active" | "needs_review" | "archived";
  activeVersionId: string;
  health: BrandMemoryHealth;
  profile: BrandProfile;
  products: ProductService[];
  buyerProfiles: BuyerProfile[];
  voice: BrandVoice;
  brandKit: BrandKit;
  competitors: CompetitorProfile[];
  proofPoints: ProofPoint[];
  claims: BrandClaim[];
  feedbackRules: FeedbackRule[];
  sources: MemorySource[];
  contextPacks: ContextPackSummary[];
  createdAt: string;
  updatedAt: string;
}
```

### BrandMemoryHealth

```ts
export interface BrandMemoryHealth {
  completeness: number;
  sourceCoverage: number;
  approvalCoverage: number;
  conflictCount: number;
  staleFactCount: number;
  missingCriticalFields: string[];
  lastVerifiedAt?: string;
}
```

### ProductService

```ts
export interface ProductService {
  id: string;
  name: string;
  type: "product" | "service" | "plan" | "addon";
  summary: string;
  description?: string;
  url?: string;
  pricing?: string;
  features: string[];
  benefits: string[];
  targetBuyerProfileIds: string[];
  useCases: string[];
  proofPointIds: string[];
  allowedClaims: string[];
  forbiddenClaims: string[];
  sourceIds: string[];
  approvalStatus: "approved" | "needs_review" | "rejected";
}
```

### BuyerProfile

```ts
export interface BuyerProfile {
  id: string;
  name: string;
  roles: string[];
  industries: string[];
  companySizes: string[];
  painPoints: string[];
  buyingTriggers: string[];
  objections: string[];
  desiredOutcomes: string[];
  searchIntents: string[];
  qualificationRules: string[];
  preferredCta?: string;
  sourceIds: string[];
  approvalStatus: "approved" | "needs_review" | "rejected";
}
```

### BrandVoice

```ts
export interface BrandVoice {
  tone: "friendly" | "professional" | "concise" | "expert" | "bold" | "premium";
  readingLevel?: string;
  personalityTraits: string[];
  approvedTerms: string[];
  forbiddenTerms: string[];
  spellingPreferences: string[];
  ctaStyle: string;
  sampleCopy: string[];
  elevatorPitch: string;
  shortBoilerplate: string;
  longBoilerplate: string;
}
```

### BrandKit

```ts
export interface BrandKit {
  logoUrls: string[];
  primaryColors: string[];
  secondaryColors: string[];
  fonts: string[];
  buttonStyle?: string;
  imageStyle?: string;
  iconStyle?: string;
  layoutNotes?: string;
  siteThemeProfileId?: string;
  screenshotSourceIds: string[];
}
```

### CompetitorProfile

```ts
export interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  positioning?: string;
  products: string[];
  strengths: string[];
  weaknesses: string[];
  trackedPages: string[];
  keywordOverlap: string[];
  gapOpportunities: string[];
  lastCrawledAt?: string;
  sourceIds: string[];
}
```

### ProofPoint

```ts
export interface ProofPoint {
  id: string;
  type:
    | "testimonial"
    | "case_study"
    | "metric"
    | "customer_logo"
    | "certification"
    | "award"
    | "partner";
  title: string;
  body: string;
  metric?: string;
  customerName?: string;
  url?: string;
  sourceIds: string[];
  approvalStatus: "approved" | "needs_review" | "rejected";
}
```

### BrandClaim

```ts
export interface BrandClaim {
  id: string;
  text: string;
  policy: "allowed" | "forbidden" | "requires_proof" | "needs_review";
  appliesToProductIds: string[];
  proofPointIds: string[];
  sourceIds: string[];
  notes?: string;
}
```

### FeedbackRule

```ts
export interface FeedbackRule {
  id: string;
  rule: string;
  scope:
    | "global"
    | "page_engine"
    | "outreach"
    | "content_refresh"
    | "analytics"
    | "search";
  origin:
    | "manual"
    | "draft_edit"
    | "page_review"
    | "outreach_review"
    | "support_note";
  examples: string[];
  status: "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
}
```

### MemorySource

```ts
export interface MemorySource {
  id: string;
  type:
    | "website"
    | "sitemap"
    | "document"
    | "pasted_text"
    | "cms"
    | "manual"
    | "competitor"
    | "generated_output"
    | "user_feedback";
  title: string;
  url?: string;
  fileName?: string;
  status: "queued" | "processing" | "ready" | "failed" | "removed";
  lastScannedAt?: string;
  extractedFactCount: number;
  error?: string;
}
```

### BrandFact

```ts
export interface BrandFact {
  id: string;
  path: string;
  value: string | string[] | Record<string, unknown>;
  confidence: number;
  sourceIds: string[];
  approvalStatus: "approved" | "needs_review" | "rejected" | "forbidden";
  conflictIds: string[];
  lastVerifiedAt?: string;
}
```

### ContextPack

```ts
export interface ContextPack {
  id: string;
  workspaceId: string;
  type:
    | "page_engine"
    | "outreach"
    | "content_refresh"
    | "internal_linking"
    | "analytics"
    | "ai_visibility"
    | "search";
  brandMemoryVersionId: string;
  content: string;
  facts: BrandFact[];
  tokenEstimate: number;
  generatedAt: string;
}
```

## 11. API Requirements

Use production API data. Do not rely on dummy data for production workflows.

### Read Memory

```text
GET /api/v1/brand-memory
GET /api/v1/brand-memory/health
GET /api/v1/brand-memory/gaps
GET /api/v1/brand-memory/context-packs
GET /api/v1/brand-memory/context-packs/:type
```

### Update Memory

```text
PATCH /api/v1/brand-memory/profile
PUT   /api/v1/brand-memory/products/:id
POST  /api/v1/brand-memory/products
DELETE /api/v1/brand-memory/products/:id

PUT   /api/v1/brand-memory/buyer-profiles/:id
POST  /api/v1/brand-memory/buyer-profiles
DELETE /api/v1/brand-memory/buyer-profiles/:id

PUT   /api/v1/brand-memory/voice
PUT   /api/v1/brand-memory/brand-kit
PUT   /api/v1/brand-memory/proof-points/:id
POST  /api/v1/brand-memory/proof-points
DELETE /api/v1/brand-memory/proof-points/:id
```

### Sources and Extraction

```text
POST /api/v1/brand-memory/sources
GET  /api/v1/brand-memory/sources
GET  /api/v1/brand-memory/sources/:id
POST /api/v1/brand-memory/sources/:id/rescan
DELETE /api/v1/brand-memory/sources/:id

POST /api/v1/brand-memory/extract-from-site
POST /api/v1/brand-memory/extract-from-sitemap
POST /api/v1/brand-memory/extract-from-text
POST /api/v1/brand-memory/extract-from-document
```

### Facts, Approval, and Conflicts

```text
GET   /api/v1/brand-memory/facts
PATCH /api/v1/brand-memory/facts/:id
POST  /api/v1/brand-memory/facts/:id/approve
POST  /api/v1/brand-memory/facts/:id/reject
POST  /api/v1/brand-memory/facts/:id/forbid
GET   /api/v1/brand-memory/conflicts
POST  /api/v1/brand-memory/conflicts/:id/resolve
```

### Feedback Memory

```text
GET    /api/v1/brand-memory/feedback-rules
POST   /api/v1/brand-memory/feedback-rules
PATCH  /api/v1/brand-memory/feedback-rules/:id
DELETE /api/v1/brand-memory/feedback-rules/:id
POST   /api/v1/brand-memory/feedback-rules/from-edit
```

### Competitors

```text
GET    /api/v1/brand-memory/competitors
POST   /api/v1/brand-memory/competitors
PATCH  /api/v1/brand-memory/competitors/:id
DELETE /api/v1/brand-memory/competitors/:id
POST   /api/v1/brand-memory/competitors/:id/rescan
GET    /api/v1/brand-memory/competitors/:id/changes
```

### Versions and Export

```text
GET  /api/v1/brand-memory/versions
GET  /api/v1/brand-memory/versions/:id
GET  /api/v1/brand-memory/versions/:id/diff
POST /api/v1/brand-memory/versions/:id/revert
POST /api/v1/brand-memory/export
POST /api/v1/brand-memory/preview-context
```

### Backward Compatibility

Keep current endpoints temporarily:

```text
GET  /api/v1/brand-profile
PUT  /api/v1/brand-profile
GET  /api/v1/brand-profile/versions
POST /api/v1/brand-profile/revert/:id
POST /api/v1/brand-profile/extract-from-site
```

Internally map them to the new Brand Memory model so existing screens do not
break during migration.

## 12. UI Requirements

### Brand Memory Overview

Above the fold:

- title and description
- memory health score
- source coverage score
- approval coverage score
- active version
- last updated
- primary CTA: "Add source"
- secondary CTA: "Scan site"
- tertiary CTA: "Test output"

Main layout:

- left: health and gap cards
- center: memory sections
- right: active context pack preview and recent changes

Required states:

- empty workspace
- extraction running
- extraction failed
- needs review
- conflicts detected
- healthy/complete

### Memory Health Card

Show:

- completeness
- source coverage
- approvals pending
- conflicts
- stale facts
- missing critical sections

Behavior:

- click a missing area to jump to section
- click a conflict to open resolution drawer
- click stale facts to rescan sources

### Add Source Drawer

Options:

- website URL
- sitemap
- upload document
- paste text
- manual note
- competitor URL
- CMS content in future

After submit:

- show queued job
- show progress
- show extraction result
- show facts to accept/reject

### Fact Review Drawer

Each extracted fact should show:

- field path
- extracted value
- source snippet
- confidence
- approve
- edit and approve
- reject
- mark forbidden

### Product and Service Editor

Must support CRUD:

- create product/service
- read product/service list
- update details
- delete/archive
- assign buyer profiles
- attach proof points
- attach source citations
- add forbidden claims

### Buyer Profile Editor

Must support CRUD:

- create persona
- read personas
- update pain points and triggers
- delete/archive
- assign products/services
- attach keywords and intent

### Voice and Messaging Editor

Must support:

- tone selection
- approved terms
- forbidden terms
- CTA examples
- boilerplates
- sample copy
- test generation prompt

### Brand Kit Editor

Must support:

- show detected colors
- show detected fonts
- upload/select logo references
- connect Site Theme Profile
- preview generated section using brand kit
- mark visual rules as approved

### Competitor Editor

Must support:

- add competitor
- scan competitor domain
- edit positioning notes
- review gap opportunities
- view tracked pages
- detect changes over time

### Feedback Memory

Must support:

- list rules
- create rule manually
- create rule from draft edit
- pause/archive rule
- set scope
- preview which workflows use rule

### Context Pack Preview

Must support:

- select workflow type
- see compiled context
- see included facts
- see excluded facts
- see token estimate
- copy context
- regenerate context pack
- inspect source citations

### Versions

Must support:

- timeline
- diff view
- affected sections
- author
- source of change
- downstream impact
- restore confirmation

## 13. Visual and UX Direction

Keep GEOSEO's current light analytics SaaS style:

- cool-gray canvas
- white panels
- violet accent
- black pill CTAs
- hairline borders
- compact professional data density
- 8px card radius unless existing system needs otherwise

Brand Memory should feel more powerful than a form.

Use:

- memory map cards
- source-backed fact chips
- confidence indicators
- approval badges
- small diff highlights
- progress states for scans
- compact tables for facts and sources
- drawers for review and conflict resolution
- segmented controls for context pack types
- icon buttons with tooltips

Avoid:

- marketing hero layout
- placeholder "coming soon" panels
- vague AI sparkle copy
- decorative gradients that reduce legibility
- cards inside cards
- inert CTAs

## 14. Responsive Requirements

375px mobile:

- tabs collapse to horizontal scroll or menu
- add source remains reachable
- fact review drawer becomes full-screen sheet
- tables become cards
- all touch targets at least 44px
- compiled context is scrollable and does not overflow

768px tablet:

- overview cards wrap cleanly
- section list and detail can stack
- source review remains usable

Desktop:

- three-column overview is allowed
- context pack preview can stay sticky
- dense lists remain scan-friendly

## 15. Micro-Interactions

Use subtle motion with reduced-motion support:

- source scan progress
- new fact reveal
- approve/reject button feedback
- conflict resolution transition
- memory score count-up
- version restore confirmation
- context pack regenerate shimmer
- source rescan status

Do not animate text in ways that make dense workflows harder to read.

## 16. Memory Quality Gates

Brand Memory should produce warnings when:

- no products/services exist
- no buyer profiles exist
- no proof points exist
- no competitors exist
- no approved claims exist
- forbidden claims conflict with generated content
- source coverage is weak
- critical facts are stale
- product pricing has no source
- generated page uses unapproved claim
- outreach draft references missing proof

## 17. Workflow Stitching

### Onboarding

Onboarding must:

- scan website
- create draft Brand Memory
- show source-backed facts
- require minimum approval before launch
- save active memory version

### Page Engine

Page Engine must:

- use Page Engine context pack
- show memory version used
- validate generated content against claims
- use Brand Kit and Site Theme Profile for native page style
- allow correction to update Feedback Memory

### Backlinks and Outreach

Outreach must:

- use Outreach context pack
- pull proof, differentiators, audience, and tone
- avoid forbidden claims
- save user edits as feedback rules

### Content Refresh

Refresh must:

- detect outdated brand facts
- suggest refreshing pages generated from old memory versions
- verify claims against active memory

### Analytics and Performance

Analytics must:

- interpret performance by target personas and page goals
- connect conversion goals to Brand Memory
- show which persona or product each page supports

### Search

Global search must:

- find Brand Memory facts, sources, products, personas, competitors, versions,
  and feedback rules
- support actions like "open source", "approve fact", "copy context"

### Alerts

Alerts must notify when:

- source scan fails
- memory conflicts appear
- competitor positioning changes
- generated content uses unapproved claims
- critical source is stale

## 18. AI and Extraction Requirements

Extraction must:

- crawl only allowed URLs
- parse metadata, headings, pricing, product/service pages, FAQs, case studies,
  testimonials, and schema
- extract structured facts
- attach source citations
- assign confidence
- detect conflicts
- suggest missing fields
- summarize source quality
- avoid executing page scripts unless explicitly allowed

Generation systems must:

- request workflow-specific context packs
- include memory version ID
- log facts used
- refuse to invent unsupported product/pricing claims
- surface missing context rather than guessing

## 19. Security Requirements

Brand Memory handles high-value business data. It must be secure by default.

Required:

- workspace-scoped data access
- RBAC for view/edit/publish/admin
- audit log for every memory change
- source deletion and export
- sensitive data redaction during extraction
- SSRF protection for website and competitor scanning
- block private IPs, localhost, link-local, and cloud metadata IPs
- URL allowlist/denylist support
- file upload size and type limits
- malware scanning hook for uploaded files in production
- HTML sanitization
- prompt injection filtering from crawled pages
- rate limits for extraction endpoints
- encrypted secrets and credentials
- no raw API keys in client bundles
- no cross-workspace source leakage

Sensitive fields:

- contacts
- pricing
- private docs
- unpublished positioning
- customer names
- internal proof
- API/webhook credentials

## 20. Performance and Scale

Requirements:

- extraction runs as async jobs
- long crawls do not block request/response
- context packs are cached by memory version and pack type
- large sources are chunked and embedded
- fact search uses indexed storage
- vector search uses pgvector or equivalent
- source rescans are incremental where possible
- UI uses pagination/virtualization for large fact/source lists
- heavy editors and diff views are dynamically loaded
- context preview has stable height to avoid layout shift

Production architecture:

- Postgres for structured memory
- pgvector for source chunks and semantic retrieval
- object storage for uploaded files and screenshots
- job queue for scans and extraction
- event bus for downstream invalidation
- audit log table for compliance

## 21. Empty, Loading, and Error States

Empty:

- "Scan your website to build Brand Memory"
- actions: scan site, add source, enter manually

Loading:

- skeleton cards for overview
- progress for extraction jobs
- streaming fact extraction list if available

Error:

- clear error message
- retry action
- manual fallback
- contact support action for repeated failures

Needs review:

- show pending facts
- show conflicts
- show missing critical fields

## 22. Acceptance Criteria

Functional:

- User can create, read, update, and delete products/services.
- User can create, read, update, and delete buyer profiles.
- User can add, rescan, and delete sources.
- User can approve, reject, edit, and forbid extracted facts.
- User can create and manage feedback rules.
- User can add and monitor competitors.
- User can view workflow-specific context packs.
- User can compare and revert versions.
- User can export Brand Memory.

Workflow:

- Onboarding creates draft Brand Memory from website scan.
- Page Engine uses active Brand Memory version.
- Outreach uses active Brand Memory version.
- User corrections can become feedback rules.
- Generated content logs memory version used.
- Changed memory can trigger refresh recommendations.

Quality:

- Every high-impact claim has a source or is marked manual.
- Low-confidence facts require review.
- Conflicts are surfaced before approval.
- Forbidden claims are blocked from generated outputs.
- Context packs include only approved facts by default.

UX:

- User understands memory health in under 10 seconds.
- User can add a source in under 30 seconds.
- User can approve or reject extracted facts without leaving the page.
- No visible CTA is inert.
- Mobile fact review is usable at 375px.

Security:

- Cross-workspace access is impossible.
- Website scanner blocks private network targets.
- Uploaded content is permission-gated.
- Every change has an audit entry.

Performance:

- Overview loads in under 2 seconds on normal data.
- Context pack preview loads in under 1 second when cached.
- Extraction jobs stream or poll progress.
- Large fact lists remain responsive.

## 23. Implementation Plan

### Phase 1: Model and API Foundation

- Add new Brand Memory types.
- Add Postgres tables for memory, facts, sources, versions, products, personas,
  competitors, proof, claims, feedback rules, and context packs.
- Keep compatibility with current `/brand-profile` endpoints.
- Add workspace scoping and audit logs.
- Add CRUD APIs for products, personas, sources, facts, and feedback rules.

### Phase 2: Brand Memory UI Upgrade

- Replace single form with tabbed Brand Memory workspace.
- Add overview health dashboard.
- Add source drawer.
- Add fact review drawer.
- Add product/service editor.
- Add buyer profile editor.
- Add context pack preview.
- Upgrade version history with diff.

### Phase 3: Extraction and Learning

- Upgrade website extraction beyond homepage.
- Add sitemap scan.
- Add document/text extraction.
- Add source citations and confidence.
- Add conflict detection.
- Add feedback rule creation from edits.
- Add async job progress.

### Phase 4: Workflow Integration

- Make Page Engine consume Page Engine context pack.
- Make Outreach consume Outreach context pack.
- Make Content Refresh validate against claims.
- Make Search index memory facts.
- Make Alerts surface memory issues.
- Store memory version IDs on generated outputs.

### Phase 5: Production Hardening

- Add RBAC.
- Add SSRF protection.
- Add upload limits and malware scanning hook.
- Add prompt-injection sanitation.
- Add export/delete flows.
- Add performance instrumentation.
- Add automated tests and browser QA.

## 24. Test Plan

Static:

```text
pnpm typecheck
pnpm lint
pnpm build
```

API smoke:

- create product
- update product
- delete product
- create buyer profile
- add source
- run extraction
- approve fact
- reject fact
- resolve conflict
- create feedback rule
- generate context pack
- create version
- revert version
- export memory

Browser QA:

- `/brand` loads on desktop
- `/brand` loads on 375px mobile
- add source drawer works
- extraction progress appears
- fact review actions work
- product CRUD works
- buyer profile CRUD works
- feedback rule CRUD works
- context pack preview works
- version diff and revert works
- no clipped text
- no console errors
- reduced motion respected

Security QA:

- blocked private IP scan
- blocked localhost scan
- blocked cross-workspace source access
- file type validation
- unauthorized edit blocked
- audit log created for changes

## 25. Claude Implementation Prompt

```text
Implement the GEOSEO Brand Memory PRD.

Use the current Brand Memory implementation as the migration baseline:
- packages/types BrandProfile and BrandMemoryVersion
- apps/api brand.controller and brand.service
- apps/web /brand page
- apps/web BrandMemoryEditor and VersionHistory

Do not leave the product as a profile form. Convert it into a full Brand Memory
workspace with Overview, Products & Services, Buyer Profiles, Voice & Messaging,
Brand Kit, Competitors, Proof & Claims, Feedback Memory, Sources, Context Packs,
and Versions.

Make all visible actions functional through API endpoints. Production flows
should be API-driven and workspace-scoped. Keep backward compatibility for
/brand-profile while introducing /brand-memory APIs.

Prioritize:
1. data model and API contracts
2. source-backed facts with confidence and approval states
3. product/service and buyer profile CRUD
4. feedback memory rules
5. context packs for Page Engine and Outreach
6. UI polish, responsive behavior, and clear empty/loading/error states
7. security protections for scanning, uploads, workspace scope, and audit logs

Run:
- pnpm typecheck
- pnpm lint
- pnpm build

Then run API smoke tests and Browser QA for /brand on desktop and mobile.
```

