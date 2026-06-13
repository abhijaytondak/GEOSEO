# PRD - Leads Dashboard, Qualification, and Conversion Workflow

Benchmark:

```text
https://www.gushwork.ai/leads-dashboard
```

GEOSEO screen:

```text
Page Engine
Leads
Inbound leads captured from published pages, AI-search traffic, and buyer-intent
content. Spam-filtered, deduped, scored, assigned, followed up, and tied back to
pages, journeys, revenue, and ROI.
```

This PRD updates GEOSEO's Leads Dashboard based on the Gushwork benchmark and
the current GEOSEO product direction.

Gushwork frames Leads Dashboard around:

- seeing every visitor
- automatically filtering spam
- instant notifications
- lead status
- notes and activity
- sales rep assignment
- visitor journey tracking

GEOSEO already has a functional prototype: public page lead forms, server-side
lead ingest, spam and duplicate status, simple scoring, lead status updates, CSV
export, CRM sync placeholder, delete, dashboard stats, and global search
indexing. The next version must turn Leads from a table into a full inbound
intelligence and conversion system.

---

## 1. Product Goal

Build a Leads Dashboard that proves GEOSEO generates real business outcomes.

The dashboard should help users:

- capture leads from every published GEOSEO page
- understand which AI-search and organic journeys created each lead
- filter spam and duplicates automatically
- prioritize high-intent buyers
- assign ownership
- log sales activity
- trigger notifications
- sync to CRM
- follow up quickly
- connect pages, channels, campaigns, and Brand Memory to pipeline impact

The user should feel:

- "I can see which leads matter."
- "I know exactly what this buyer looked at."
- "I know who owns the lead."
- "My team can act without switching tools."
- "GEOSEO is creating pipeline, not only traffic."

## 2. Current GEOSEO Baseline

### Current Lead Type

Current `Lead` includes:

- id
- pageId
- pageTitle
- name
- email
- company
- message
- sourceUrl
- utm
- score
- status
- spamStatus
- crmSyncStatus
- createdAt

Current statuses:

```text
new
qualified
contacted
won
lost
```

Current spam statuses:

```text
clean
spam
duplicate
```

### Current API

Implemented endpoints:

```text
GET    /api/v1/leads
GET    /api/v1/leads/:id
PUT    /api/v1/leads/:id
POST   /api/v1/leads/export
POST   /api/v1/leads/:id/sync
DELETE /api/v1/leads/:id
POST   /api/v1/public/leads
```

### Current UI

Implemented `/leads` capabilities:

- KPI cards for total leads, qualified, spam/duplicates, and average score
- filter by all, clean, spam, duplicate
- lead table
- status dropdown
- spam badge
- score display
- source page display
- CSV export
- sync-to-CRM action
- delete with confirmation
- empty filtered state
- loading skeleton

### Current Public Capture

Published pages include a lead form that captures:

- name
- email
- company
- message
- slug
- sourceUrl

Server ingest:

- validates email
- detects obvious spam terms
- detects duplicates by email plus page
- assigns a simple score
- persists lead

## 3. What Is Good Already

The current version already has the right foundation:

- lead capture is connected to published pages
- lead records have source page attribution
- lead statuses can be updated
- spam and duplicate labels exist
- lead score exists
- CSV export works in the UI
- CRM sync action exists as a placeholder
- delete persists and audits
- global search can surface leads
- dashboard can show qualified lead count and conversion

This is a strong prototype. The gap is depth, trust, sales usability, and
production-grade workflow stitching.

## 4. Key Gaps

### Gap 1: No Visitor Journey Tracking

The benchmark emphasizes seeing every page a lead visited before conversion.
GEOSEO currently stores only source URL and UTM.

Missing:

- first-touch page
- last-touch page
- full visited-page timeline
- session count
- time on page
- touchpoints before conversion
- referrer
- device
- country or region
- AI crawler or AI-search source context
- conversion page
- journey visualization

### Gap 2: No Lead Detail Workspace

Current UI is a table. Users need a lead detail drawer or page with:

- profile summary
- score explanation
- journey timeline
- message
- page context
- activity
- notes
- owner
- recommended next action
- CRM sync state
- privacy actions

### Gap 3: No Notes and Activity

Gushwork includes notes and activity. GEOSEO currently has no way to log calls,
emails, meetings, handoffs, status changes, or internal comments.

### Gap 4: No Sales Rep Assignment

Gushwork includes rep assignment. GEOSEO currently has no owner field,
assignment workflow, routing rules, or team workload view.

### Gap 5: Notifications Are Not Real

Settings mention lead alerts, but leads do not trigger real notification jobs.

Missing:

- email alerts
- Slack alerts
- webhook alerts
- in-app alerts
- owner-specific notifications
- high-score-only routing
- quiet hours
- notification history

### Gap 6: Spam Protection Is Too Basic

Current spam logic is a regex plus email validation.

A sellable product needs:

- honeypot fields
- rate limiting
- bot behavior checks
- disposable email detection
- domain validation
- duplicate clustering
- IP reputation in production
- AI or rules-based message quality classification
- manual override
- spam reason display

### Gap 7: Lead Scoring Is Not Explainable Enough

Current score is simple. Users need to know why a lead is hot.

Missing:

- score factors
- fit score
- intent score
- engagement score
- spam risk score
- page intent weighting
- Brand Memory ICP match
- source channel weighting
- negative factors
- recommended action

### Gap 8: CRM Sync Is Only a Placeholder

Current sync marks a lead as synced. A production product needs real provider
state, retries, field mapping, errors, jobs, and audit logs.

### Gap 9: No Source and ROI Attribution

The lead must connect back to:

- page
- opportunity
- blueprint
- keyword or intent
- AI-search source
- organic search
- paid campaign
- UTM
- referrer
- internal link path
- conversion CTA
- generated page version
- Brand Memory version

Without this, GEOSEO cannot prove which pages or channels create pipeline.

### Gap 10: No Follow-Up Workflow

Users need to act from the dashboard.

Missing:

- email follow-up drafts
- call task
- reminder
- sequence status
- copy lead summary
- mailto with context
- CRM task creation
- owner handoff

### Gap 11: No Lead Capture Configuration

Current form is static. Users need per-page and workspace form configuration:

- fields
- required fields
- CTA text
- consent text
- destination
- hidden UTM fields
- spam controls
- routing rules
- form style matching customer website

### Gap 12: No Privacy, Consent, and PII Controls

Lead data includes PII. GEOSEO needs role-based access, retention controls,
export, deletion, consent tracking, and audit logs.

### Gap 13: No Bulk Operations or Saved Views

Sales users need speed.

Missing:

- bulk assign
- bulk status change
- bulk export
- bulk delete/spam
- saved views
- advanced filters
- sort by score, date, source, owner, status

### Gap 14: No Real-Time Experience

Leads should feel alive. Current UI only loads server data on page load.

Missing:

- new lead toast
- realtime or polling refresh
- "new leads since you opened" indicator
- notification center integration

## 5. Product Positioning

Leads Dashboard is not only a contact list.

It is the proof layer for GEOSEO.

Positioning:

```text
Leads Dashboard turns AI-search visitors and buyer-intent page conversions into
prioritized, assigned, explainable pipeline. It shows who converted, what they
looked at, why they matter, and what your team should do next.
```

## 6. Success Metrics

Activation:

- 80% of workspaces publish at least one lead capture page.
- 70% of workspaces receive at least one test or real lead during onboarding.
- Median time from published page to working lead capture is under 5 minutes.

Quality:

- 95% of spam leads are filtered or labeled.
- Less than 2% of clean leads are incorrectly marked spam.
- 90% of leads have source page attribution.
- 80% of leads have at least one journey touchpoint.

Sales speed:

- High-score lead alert delivered within 60 seconds.
- Median time to assign a qualified lead is under 2 minutes.
- Median time to first action is under 10 minutes.

ROI:

- Dashboard can show leads by page, source, campaign, and status.
- Won leads can be tied to generated pages.
- Users can export lead and attribution data.

## 7. Primary Users

### Founder / Owner

Needs:

- see whether GEOSEO is creating leads
- know which leads are real
- understand ROI by page and channel
- get alerted when important leads come in

### Marketer

Needs:

- understand conversion source
- see which content generates qualified leads
- improve CTAs and page strategy
- export leads and performance

### Sales Rep

Needs:

- see assigned leads
- understand buyer journey
- take notes
- update status
- follow up fast
- sync to CRM

### Agency / Operator

Needs:

- manage lead flow for multiple clients
- prove value
- export reports
- configure notifications
- avoid exposing PII to the wrong users

## 8. Core User Stories

1. As a visitor, I can submit a native-looking form on a published page.
2. As a user, I can see new leads in the dashboard immediately.
3. As a sales rep, I can open a lead and see every page they visited before
   conversion.
4. As a founder, I can see which GEOSEO page produced the lead.
5. As a marketer, I can filter leads by page, campaign, score, spam status, and
   owner.
6. As a sales rep, I can add notes and log calls, emails, and meetings.
7. As a manager, I can assign leads to team members.
8. As a user, I can mark leads as New, Contacted, Qualified, Won, or Lost.
9. As a user, I can understand why a lead was scored highly.
10. As a user, I can receive Slack, email, webhook, or in-app alerts for high-fit
    leads.
11. As a user, I can sync leads to HubSpot, Salesforce, or a webhook.
12. As an admin, I can delete, export, or redact PII.

## 9. Information Architecture

The `/leads` workspace should include:

```text
Overview
Inbox
Lead Detail
Journeys
Source Attribution
Spam Review
Assignments
Notifications
Forms
CRM Sync
Reports
Settings
```

### Overview

Purpose:

- show lead performance at a glance
- prove GEOSEO ROI
- surface urgent action

Primary cards:

- total leads
- qualified leads
- high-intent leads
- spam blocked
- average score
- conversion rate
- leads from AI-search pages
- won pipeline value

Charts:

- leads over time
- qualified leads over time
- lead source breakdown
- page-to-lead leaderboard
- status funnel
- spam trend

### Inbox

Purpose:

- triage and act on individual leads

Required:

- lead table and responsive card view
- search
- filters
- saved views
- bulk actions
- status update
- owner assignment
- spam override
- quick sync
- open detail drawer

### Lead Detail

Purpose:

- provide everything needed before follow-up

Sections:

- identity and contact
- fit and intent score
- score explanation
- visitor journey
- source and campaign attribution
- message
- page context
- Brand Memory ICP match
- notes and activity
- owner and status
- recommended next action
- CRM sync
- privacy actions

### Journeys

Purpose:

- show buyer behavior before conversion

Required:

- timeline of visited pages
- first touch
- last touch
- conversion touch
- time between touches
- referrer
- UTM
- device
- geography
- AI-search or organic context when available

### Source Attribution

Purpose:

- connect leads to GEOSEO's value

Views:

- leads by page
- leads by opportunity
- leads by keyword or intent
- leads by AI-search citation
- leads by campaign
- leads by referrer
- leads by generated page version
- won leads by page

### Spam Review

Purpose:

- protect users from junk and prevent false positives

Required:

- spam queue
- duplicate groups
- spam reasons
- restore as clean
- mark clean as spam
- disposable email flag
- bot reason
- rate-limit reason

### Assignments

Purpose:

- make ownership clear

Required:

- owner field
- unassigned queue
- assign to user
- bulk assign
- routing rules
- workload count by rep
- SLA overdue view

### Notifications

Purpose:

- make high-quality leads actionable fast

Required channels:

- in-app
- email
- Slack
- webhook
- CRM task in future
- SMS/WhatsApp in future if enabled

Rules:

- notify for all clean leads
- notify only high-score leads
- notify by page
- notify by assigned owner
- notify by company domain
- quiet hours

### Forms

Purpose:

- configure capture forms per workspace and page

Required:

- workspace default form
- per-page override
- required fields
- hidden UTM fields
- consent checkbox
- CTA text
- thank-you state
- form destination
- webhook destination
- visual style preview

### CRM Sync

Purpose:

- connect to sales systems

Required:

- provider status
- field mapping
- sync queue
- retry failed sync
- sync errors
- last synced
- synced object URL

### Reports

Purpose:

- export proof of value

Required:

- CSV export
- filtered export
- source attribution export
- weekly lead report
- won/lost report
- page ROI report

## 10. End-to-End Workflows

### Workflow 1: Visitor Converts

1. Visitor lands on a published GEOSEO page.
2. Tracking script records anonymous page events with consent rules.
3. Visitor submits lead form.
4. Public API validates payload.
5. System dedupes and spam-checks submission.
6. System calculates fit, intent, engagement, and spam risk scores.
7. Lead is stored with journey, source, page, UTM, and consent.
8. Lead appears in dashboard.
9. Notification rule runs.
10. Owner assignment rule runs.
11. CRM sync job is queued if enabled.

### Workflow 2: Sales Triage

1. User opens Leads Inbox.
2. User filters to clean, high-score, unassigned leads.
3. User opens lead detail.
4. User reviews journey and score explanation.
5. User assigns owner or claims lead.
6. User adds note.
7. User marks contacted.
8. User syncs to CRM or starts follow-up.

### Workflow 3: Spam Review

1. System flags spam or duplicate lead.
2. Lead goes to spam review.
3. User sees reason.
4. User restores as clean or confirms spam.
5. System records feedback.
6. Spam rule improves future classification.

### Workflow 4: ROI Attribution

1. Lead converts from a published page.
2. Page is tied to opportunity, blueprint, page version, Brand Memory version, and
   search intent.
3. User marks lead as won and enters optional deal value.
4. Dashboard attributes revenue to page and source.
5. Authority HQ and Performance Trends show business impact.

### Workflow 5: Notification and Routing

1. Qualified lead arrives.
2. System checks notification rules.
3. System checks routing rules.
4. Lead is assigned to correct owner.
5. Owner receives Slack/email/in-app notification.
6. Dashboard records notification delivery.

## 11. Data Model

### Lead

```ts
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "nurture"
  | "disqualified";

export type SpamStatus =
  | "clean"
  | "spam"
  | "duplicate"
  | "needs_review";

export interface Lead {
  id: string;
  workspaceId: string;
  pageId?: string;
  pageTitle?: string;
  opportunityId?: string;
  blueprintId?: string;
  pageVersionId?: string;
  brandMemoryVersionId?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  message?: string;
  status: LeadStatus;
  spamStatus: SpamStatus;
  score: LeadScore;
  ownerId?: string;
  source: LeadSource;
  journeySummary: LeadJourneySummary;
  consent: LeadConsent;
  crm: LeadCrmState;
  deal?: LeadDeal;
  createdAt: string;
  updatedAt: string;
}
```

### LeadScore

```ts
export interface LeadScore {
  total: number;
  fit: number;
  intent: number;
  engagement: number;
  spamRisk: number;
  confidence: number;
  reasons: LeadScoreReason[];
  recommendedAction: string;
}

export interface LeadScoreReason {
  label: string;
  impact: "positive" | "negative" | "neutral";
  points: number;
  explanation: string;
}
```

### LeadSource

```ts
export interface LeadSource {
  sourceUrl: string;
  referrer?: string;
  firstTouchUrl?: string;
  lastTouchUrl?: string;
  conversionUrl?: string;
  channel:
    | "ai_search"
    | "organic_search"
    | "paid"
    | "referral"
    | "direct"
    | "email"
    | "social"
    | "unknown";
  aiEngine?: "chatgpt" | "perplexity" | "gemini" | "claude" | "copilot" | "other";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}
```

### LeadJourneyEvent

```ts
export interface LeadJourneyEvent {
  id: string;
  leadId?: string;
  anonymousVisitorId: string;
  sessionId: string;
  type:
    | "page_view"
    | "cta_click"
    | "form_start"
    | "form_submit"
    | "download"
    | "external_click";
  pageId?: string;
  url: string;
  title?: string;
  referrer?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface LeadJourneySummary {
  anonymousVisitorId?: string;
  sessionCount: number;
  touchpointCount: number;
  firstSeenAt?: string;
  convertedAt?: string;
  timeToConvertSeconds?: number;
  topPages: Array<{ pageId?: string; title: string; url: string; views: number }>;
}
```

### LeadActivity

```ts
export type LeadActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "status_change"
  | "assignment"
  | "crm_sync"
  | "notification"
  | "spam_override"
  | "delete"
  | "export";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  body: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### LeadConsent

```ts
export interface LeadConsent {
  hasConsent: boolean;
  consentText?: string;
  consentedAt?: string;
  privacyPolicyUrl?: string;
  ipHash?: string;
  userAgentHash?: string;
}
```

### LeadCrmState

```ts
export interface LeadCrmState {
  provider?: "hubspot" | "salesforce" | "pipedrive" | "webhook" | "none";
  status: "none" | "queued" | "syncing" | "synced" | "failed";
  externalId?: string;
  externalUrl?: string;
  lastSyncedAt?: string;
  error?: string;
}
```

### LeadDeal

```ts
export interface LeadDeal {
  value?: number;
  currency?: string;
  stage?: string;
  wonAt?: string;
  lostReason?: string;
}
```

### LeadAssignmentRule

```ts
export interface LeadAssignmentRule {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  conditions: Array<{
    field: "score" | "pageId" | "channel" | "companyDomain" | "country" | "status";
    operator: "equals" | "contains" | "gte" | "lte" | "in";
    value: string | number | string[];
  }>;
  assignToUserId: string;
}
```

### LeadNotificationRule

```ts
export interface LeadNotificationRule {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  channels: Array<"in_app" | "email" | "slack" | "webhook">;
  minScore?: number;
  statuses?: LeadStatus[];
  pages?: string[];
  ownerOnly?: boolean;
  quietHours?: { start: string; end: string; timezone: string };
}
```

### LeadFormConfig

```ts
export interface LeadFormConfig {
  id: string;
  workspaceId: string;
  pageId?: string;
  name: string;
  fields: Array<{
    id: string;
    type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "hidden";
    label: string;
    required: boolean;
    options?: string[];
  }>;
  ctaText: string;
  thankYouTitle: string;
  thankYouBody: string;
  consentRequired: boolean;
  consentText?: string;
  spamProtection: {
    honeypot: boolean;
    rateLimit: boolean;
    disposableEmailCheck: boolean;
  };
  styleMode: "geoseo_default" | "match_page_theme";
}
```

## 12. API Requirements

All production workflows must be API-driven and workspace-scoped.

### Lead Capture

```text
POST /api/v1/public/leads
POST /api/v1/public/events
POST /api/v1/public/form-start
GET  /api/v1/public/forms/:pageId
```

Public endpoints must be rate-limited, spam-protected, and safe without
authenticated user context.

### Leads

```text
GET    /api/v1/leads
GET    /api/v1/leads/:id
PATCH  /api/v1/leads/:id
DELETE /api/v1/leads/:id
POST   /api/v1/leads/bulk
POST   /api/v1/leads/export
POST   /api/v1/leads/:id/restore
POST   /api/v1/leads/:id/mark-spam
POST   /api/v1/leads/:id/mark-clean
```

### Lead Detail

```text
GET  /api/v1/leads/:id/journey
GET  /api/v1/leads/:id/activity
POST /api/v1/leads/:id/activity
GET  /api/v1/leads/:id/score
GET  /api/v1/leads/:id/attribution
POST /api/v1/leads/:id/recalculate-score
```

### Assignment

```text
POST  /api/v1/leads/:id/assign
POST  /api/v1/leads/bulk-assign
GET   /api/v1/leads/assignment-rules
POST  /api/v1/leads/assignment-rules
PATCH /api/v1/leads/assignment-rules/:id
DELETE /api/v1/leads/assignment-rules/:id
```

### Notifications

```text
GET    /api/v1/leads/notification-rules
POST   /api/v1/leads/notification-rules
PATCH  /api/v1/leads/notification-rules/:id
DELETE /api/v1/leads/notification-rules/:id
POST   /api/v1/leads/:id/notify
GET    /api/v1/leads/:id/notifications
```

### Forms

```text
GET    /api/v1/lead-forms
POST   /api/v1/lead-forms
GET    /api/v1/lead-forms/:id
PATCH  /api/v1/lead-forms/:id
DELETE /api/v1/lead-forms/:id
POST   /api/v1/lead-forms/:id/preview
```

### CRM Sync

```text
POST /api/v1/leads/:id/sync
POST /api/v1/leads/bulk-sync
GET  /api/v1/leads/:id/sync-status
POST /api/v1/leads/:id/retry-sync
GET  /api/v1/crm/field-mapping
PUT  /api/v1/crm/field-mapping
POST /api/v1/crm/test
```

### Reports

```text
GET  /api/v1/leads/reports/overview
GET  /api/v1/leads/reports/source-attribution
GET  /api/v1/leads/reports/page-roi
GET  /api/v1/leads/reports/funnel
POST /api/v1/leads/reports/export
```

## 13. UI Requirements

### Page Header

Header should show:

- Page Engine / Leads
- concise description
- primary CTA: "Export"
- secondary CTA: "Configure forms"
- secondary CTA: "Notification rules"
- tertiary CTA: "CRM settings"

### KPI Strip

Required metrics:

- total leads
- qualified leads
- high-intent leads
- spam blocked
- average lead score
- conversion rate
- leads from AI-search pages
- won pipeline value

Each card should:

- have stable dimensions
- show trend if data exists
- link to filtered view

### Lead Inbox

Required controls:

- search by name, email, company, page, campaign
- filter by status
- filter by spam status
- filter by owner
- filter by score range
- filter by source page
- filter by channel
- filter by date range
- saved views
- sort by score, created date, status, owner, page
- bulk select

Required columns on desktop:

- lead
- company
- source
- score
- status
- owner
- spam
- created
- actions

Mobile:

- card layout
- top facts visible without horizontal table reliance
- quick status and owner controls
- open detail action

### Lead Detail Drawer

Open from any row.

Header:

- name
- email
- company
- score
- status
- owner
- spam status

Tabs:

- Overview
- Journey
- Activity
- Attribution
- CRM
- Privacy

Overview:

- message
- recommended next action
- score explanation
- source page
- page intent
- Brand Memory ICP match

Journey:

- timeline of touchpoints
- page titles
- duration
- referrer
- UTM
- first touch and conversion touch

Activity:

- notes
- calls
- emails
- meetings
- status changes
- assignments
- notification logs

Attribution:

- source channel
- page
- opportunity
- blueprint
- keyword or buyer intent
- page version
- campaign

CRM:

- provider
- sync status
- external link
- field mapping issue
- retry action

Privacy:

- consent
- export lead
- redact PII
- delete lead

### Spam Review

Required:

- separate saved view or tab
- reason badges
- duplicate group drawer
- mark clean
- confirm spam
- delete
- explain false-positive feedback

### Notification Rules UI

Required:

- list rules
- create/edit drawer
- channel selection
- min score
- status filter
- source/page filter
- owner routing
- test notification
- delivery log

### Form Builder UI

Required:

- workspace default form
- per-page override
- field list
- required toggles
- CTA copy
- thank-you copy
- consent text
- hidden fields
- spam controls
- preview in GEOSEO style and page theme style

### CRM Settings UI

Required:

- provider status
- connect/disconnect placeholder if credentials unavailable
- field mapping
- test sync
- failed sync queue
- retry
- last sync history

## 14. UX and Visual Design

Use GEOSEO's existing light analytics SaaS system:

- cool-gray canvas
- white panels
- violet accent
- black pill CTAs
- hairline borders
- compact but readable density
- status badges
- restrained motion

Leads should feel like a sales command center, not a spreadsheet.

Use:

- clear heat score badges
- journey timeline
- source chips
- owner avatars or initials
- action menu
- detail drawer
- saved view chips
- notification badges
- CRM sync badges
- score reason breakdown

Avoid:

- placeholder actions
- vague AI labels
- table-only mobile UX
- burying message content
- showing PII to unauthorized users
- too many equal-weight CTAs

## 15. Micro-Interactions

Required:

- new lead toast
- score badge soft transition
- drawer slide
- status update feedback
- owner assignment feedback
- CRM sync progress
- notification test progress
- spam restore feedback
- bulk action progress

Respect `prefers-reduced-motion`.

## 16. Responsiveness

375px mobile:

- lead inbox becomes cards
- filters collapse into sheet
- detail drawer becomes full-screen
- table horizontal scroll is allowed only for secondary report tables
- all touch targets at least 44px
- PII text wraps safely

768px tablet:

- KPI strip wraps 2 by 2
- inbox remains usable
- detail drawer width adapts

Desktop:

- dense inbox
- sticky detail drawer
- side-by-side journey and score possible

## 17. Workflow Stitching

### Page Engine

Every generated page should:

- know whether lead capture is enabled
- know which form config is attached
- pass pageId and pageVersionId into lead capture
- show leads generated by page
- show conversion rate

### Brand Memory

Lead scoring should:

- compare company, role, message, and page intent to buyer profiles
- use ICP fit where available
- use forbidden/allowed claims when follow-up drafts are generated

### Analytics

Analytics should:

- show page views to lead conversion
- show source-to-lead attribution
- distinguish AI-search, organic, paid, referral, and direct when possible

### Alerts

Alerts should:

- notify high-score lead
- notify lead spike
- notify CRM sync failure
- notify form capture failure
- notify spam spike

### Search

Global search should:

- find leads by name, email, company, source page, status, owner, and notes
- respect PII permissions
- allow actions like open lead, copy email, assign owner, mark contacted

### Settings

Settings should:

- manage team members used for lead assignment
- manage notification channels
- manage CRM integrations
- manage data retention and privacy rules

## 18. Security, Privacy, and Compliance

Leads contain PII. Production requirements:

- workspace-scoped data access
- RBAC for viewing lead PII
- PII masking for analyst or read-only roles
- audit log for view, export, delete, status change, owner change, CRM sync
- rate limiting on public lead endpoints
- bot and spam protection
- honeypot support
- CSRF-safe form submission pattern
- CORS controls for public embed/capture
- input validation and sanitization
- HTML escaping for messages
- private notes not exposed publicly
- export permission gate
- delete and redact flow
- consent capture
- retention policy
- webhook secret signing
- no raw lead messages in application logs
- encryption at rest in production

Privacy actions:

- export one lead
- export all leads
- delete lead
- redact lead PII
- suppress domain/email
- consent audit

## 19. Performance and Scale

Requirements:

- paginated lead list
- server-side filtering and sorting
- indexed search by email, company, status, page, owner, createdAt
- journey events stored separately from lead summary
- aggregated report tables for charts
- async CRM sync jobs
- async notification jobs
- realtime or polling updates for inbox
- virtualized table for large workspaces
- cached dashboard aggregates
- no client import of heavy mock data in production

Suggested storage:

- `leads`
- `lead_events`
- `lead_activities`
- `lead_assignments`
- `lead_notification_rules`
- `lead_notifications`
- `lead_forms`
- `lead_form_submissions`
- `lead_crm_sync_jobs`
- `lead_exports`

## 20. Empty, Loading, and Error States

Empty:

- "No leads yet"
- show how to publish a page with lead capture
- CTA: "Create page"
- CTA: "Configure lead form"
- CTA: "Submit test lead"

Loading:

- stable KPI skeletons
- table skeleton
- drawer skeleton
- chart skeleton

Error:

- retry
- explain failed API
- keep last known rows where possible
- show CRM sync errors inline
- show notification delivery failures

No results:

- explain active filters
- clear filters action

## 21. Acceptance Criteria

Functional:

- Public form creates a lead with page and source attribution.
- Public events create visitor journey records.
- Lead list supports server-side pagination, filtering, and sorting.
- User can open lead detail drawer.
- User can update status.
- User can assign owner.
- User can add notes and activities.
- User can mark spam or clean.
- User can bulk update leads.
- User can export filtered leads.
- User can sync or retry CRM sync.
- User can configure lead forms.
- User can configure notification rules.

Workflow:

- High-score clean leads trigger configured alerts.
- New leads can be auto-assigned by rules.
- Won leads update ROI attribution.
- Page Engine shows leads per page.
- Search can find and action leads.
- Alerts show lead spikes and CRM sync failures.

Quality:

- Score explanation is visible.
- Spam reason is visible.
- Duplicate group is visible.
- Visitor journey shows first touch, last touch, and conversion.
- CRM sync failures are actionable.

UX:

- User can triage a lead in under 30 seconds.
- User can understand why a lead matters without leaving the drawer.
- Mobile view is usable at 375px.
- No visible CTA is inert.

Security:

- PII is role-gated.
- Lead exports are audited.
- Public endpoints are rate-limited.
- Messages are sanitized.
- Delete and redact work.

Performance:

- Inbox loads under 2 seconds for normal workspaces.
- Filters respond quickly with server-side querying.
- Dashboard aggregates do not recalculate large histories on every request.

## 22. Implementation Plan

### Phase 1: Lead Model and Detail

- Extend Lead types.
- Add LeadSource, LeadScore, LeadJourneyEvent, LeadActivity, LeadConsent, and
  LeadCrmState.
- Add API endpoints for lead detail, activity, journey, score, and attribution.
- Add lead detail drawer.
- Add notes and activity timeline.

### Phase 2: Inbox Upgrade

- Add advanced filters.
- Add saved views.
- Add owner assignment.
- Add bulk actions.
- Add responsive mobile card layout.
- Add score explanation UI.

### Phase 3: Visitor Journey and Attribution

- Add public events endpoint.
- Add anonymous visitor/session IDs.
- Store journey events.
- Connect journey to lead on submit.
- Add attribution reports.
- Tie lead to page, opportunity, blueprint, and page version.

### Phase 4: Spam and Scoring

- Add spam reasons.
- Add honeypot and rate limiting.
- Add disposable email check.
- Add duplicate clustering.
- Add score factors.
- Add manual spam/clean feedback.

### Phase 5: Notifications and Assignment

- Add assignment rules.
- Add notification rules.
- Add in-app notification events.
- Add email/Slack/webhook provider stubs.
- Add delivery logs.

### Phase 6: Forms and CRM

- Add lead form configuration.
- Add per-page form override.
- Add form preview.
- Add CRM field mapping.
- Add sync jobs, retry, error states.
- Add provider-specific connectors later.

### Phase 7: Privacy and Production Hardening

- Add RBAC and PII masking.
- Add export audit.
- Add redact/delete.
- Add retention rules.
- Add webhook signing.
- Add no-PII logging guardrails.

## 23. Test Plan

Static:

```text
pnpm typecheck
pnpm lint
pnpm build
```

API smoke:

- submit public lead
- submit spam lead
- submit duplicate lead
- create journey event
- list leads with filters
- open lead detail
- update status
- assign owner
- add note
- mark spam
- mark clean
- export filtered leads
- sync lead
- retry failed sync
- create notification rule
- create assignment rule
- create lead form config
- delete/redact lead

Browser QA:

- `/leads` desktop loads
- `/leads` mobile 375px loads
- KPI strip does not shift
- filters work
- lead detail drawer works
- journey tab works
- notes/activity works
- owner assignment works
- status update works
- spam review works
- export works
- CRM sync state works
- notification rule UI works
- form builder UI works
- no console errors
- no clipped text
- keyboard focus visible

Security QA:

- unauthenticated public capture is rate-limited
- invalid email rejected or marked spam
- private note not exposed publicly
- export blocked for unauthorized role
- PII masked for restricted role
- delete and redact audit events are created
- webhook signatures verified

## 24. Claude Implementation Prompt

```text
Implement the GEOSEO Leads Dashboard PRD.

Use the current implementation as the baseline:
- packages/types/src/page-engine.ts Lead, LeadStatus, SpamStatus
- apps/api/src/modules/page-engine.service.ts lead ingest/list/update/export/sync/delete
- apps/api/src/modules/page-engine.controller.ts LeadsController and PublicController
- apps/web/src/app/(app)/leads/page.tsx
- apps/web/src/components/leads/leads-view.tsx
- apps/web/src/components/feeds/lead-form.tsx
- apps/web/src/lib/page-engine-client.ts

Do not leave Leads as a simple table. Build it into an inbound intelligence and
sales workflow workspace.

Prioritize:
1. lead detail drawer
2. visitor journey tracking
3. notes and activity timeline
4. owner assignment
5. score explanation and spam reasons
6. advanced filters and mobile card layout
7. notification rules
8. lead form configuration
9. CRM sync jobs and errors
10. privacy, RBAC, PII masking, export audit, and redact/delete

All visible actions must call APIs. Keep existing endpoints working while adding
new /leads, /lead-forms, /public/events, assignment, notification, CRM, and
report endpoints.

Run:
- pnpm typecheck
- pnpm lint
- pnpm build

Then run API smoke tests and Browser QA for /leads on desktop and mobile.
```

