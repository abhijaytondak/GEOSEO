# PRD — Get Started / Onboarding UI, UX, and Workflow

Screen:

```text
Get started
Onboarding
Scan your site, confirm Brand Memory, connect publishing, and seed your first buyer-intent opportunities.
```

Onboarding is the first trust-building workflow in GEOSEO. It should turn a new
workspace from empty into useful in minutes: scan the website, create Brand Memory,
configure publishing, seed buyer-intent opportunities, and guide the user to the
next best action.

This flow must feel polished, guided, fast, safe, and valuable. The user should
finish onboarding with a working product state, not just a completed form.

---

## 1. Goal

Create a best-in-class onboarding flow that helps users set up GEOSEO and reach
their first meaningful result quickly.

The user should be able to:

- Scan a website.
- Extract brand context.
- Review and confirm Brand Memory.
- Configure publishing basics.
- Seed buyer-intent topics.
- Discover first opportunities.
- Understand what GEOSEO will do next.
- Land in the right dashboard with useful data and next actions.

## 2. Product Promise

Onboarding should feel like GEOSEO is doing real work from the first minute.

The flow should answer:

- Did GEOSEO understand my business?
- What brand context will the AI use?
- Where will generated pages be published?
- What topics should GEOSEO pursue first?
- What did GEOSEO discover?
- What should I do next?

## 3. Target Users

### Founder / Owner

Needs a quick setup and confidence that GEOSEO understands the business.

Key needs:

- Minimal friction.
- Clear ROI path.
- No technical confusion.
- Safe publishing defaults.

### Marketer

Needs control over brand voice, topics, and first workflows.

Key needs:

- Edit Brand Memory.
- Add seed topics.
- Review first opportunities.
- Start page/backlink workflows.

### Agency / Operator

Needs repeatable setup across clients.

Key needs:

- Fast workspace setup.
- Clear checklist.
- Exportable setup summary.
- Ability to skip and return later.

## 4. First Impression Requirements

The first onboarding viewport must include:

- Clear page identity: `Get started / Onboarding`.
- Short setup promise.
- Progress indicator.
- Current step label.
- Primary action.
- Trust note about demo/production mode and data usage.

The page should not feel like a generic wizard. It should feel like a guided AI
setup console.

## 5. Onboarding Flow

Recommended steps:

```text
1. Scan Website
2. Confirm Brand Memory
3. Configure Publishing
4. Seed Opportunities
5. Review First Results
6. Launch Workspace
```

Each step must have:

- Goal.
- Input.
- AI/API work state.
- Review state.
- Error state.
- Skip/back behavior where safe.
- Clear next action.

## 6. Step 1 — Scan Website

## 6.1 Goal

Extract initial brand, domain, audience, topics, positioning, and site context
from the user's website.

## 6.2 Inputs

Required:

- Website URL.

Optional:

- Company name.
- Primary market.
- Competitors.
- Existing sitemap URL.

## 6.3 Behavior

When the user clicks `Scan site`:

- Validate URL.
- Start scan job.
- Show progress.
- Extract:
  - company name
  - domain
  - value proposition
  - audience
  - industry
  - topics
  - keywords
  - differentiators
  - competitors if visible
  - contact email if visible
- Show result preview.

## 6.4 UI Requirements

Fields:

- URL input.
- Optional advanced fields accordion.

States:

- Idle.
- Validating.
- Scanning.
- Extracted.
- Failed.

Loading:

- Use checklist progress:
  - Reading homepage
  - Finding metadata
  - Extracting topics
  - Drafting Brand Memory
  - Preparing review

Error:

- Invalid URL.
- Site unavailable.
- Timeout.
- No extractable content.
- Provider unavailable.

Fallback:

- User can enter Brand Memory manually if scan fails.

Acceptance:

- Valid URL starts scan.
- Scan creates reviewable Brand Memory draft.
- Failure does not block manual setup.

## 7. Step 2 — Confirm Brand Memory

## 7.1 Goal

Let the user confirm the single source of truth used by outreach, page generation,
content refresh, and search recommendations.

## 7.2 Editable Fields

- Company name.
- Domain.
- Website URL.
- Value proposition.
- Audience.
- Industry.
- Tone.
- Topics.
- Differentiators.
- Competitors.
- Keywords.
- Contact name.
- Contact email.

## 7.3 UX Requirements

Show:

- Completeness score.
- Missing-field warnings.
- AI-detected fields with subtle source labels.
- Preview of compiled context.
- Example output:
  - outreach opening line
  - generated page intro

Actions:

- Save Brand Memory.
- Edit fields.
- Add/remove chips.
- Re-scan site.
- Skip with warning.

## 7.4 Validation

Required:

- Company.
- Domain.
- Value proposition.
- At least one topic.
- Contact email for outreach workflows, or explicit "add later".

Acceptance:

- Save creates or updates Brand Memory via API.
- Save creates a version history entry.
- Later outreach/content uses the saved Brand Memory.

## 8. Step 3 — Configure Publishing

## 8.1 Goal

Set safe publishing defaults for generated pages and crawl surfaces.

## 8.2 Fields

- Publishing destination:
  - managed subdirectory
  - subdomain
  - CMS integration later
- Default publish path.
- Approval policy:
  - require human approval
  - allow auto-publish later
- Sitemap updates.
- `llms.txt` updates.
- Rollback retention.

## 8.3 Integration States

Publishing destination status:

- Demo connected.
- Needs setup.
- Connected.
- Needs attention.
- Disabled.

Crawler surfaces:

- sitemap.xml enabled/disabled.
- llms.txt enabled/disabled.

## 8.4 UX Requirements

Show:

- Preview URL:
  - `example.com/feeds/...`
- What GEOSEO will publish.
- What requires approval.
- What AI/search crawlers can read.

Actions:

- Save publishing settings.
- Test publishing setup.
- View sitemap.
- View llms.txt.

Acceptance:

- Publishing settings persist through API.
- Page Engine uses saved publish path.
- User can continue without a real CMS in demo mode.

## 9. Step 4 — Seed Opportunities

## 9.1 Goal

Let the user seed first buyer-intent topics and discover initial opportunities.

## 9.2 Inputs

- Seed topics.
- Products/services.
- Customer pains.
- Competitors.
- Target geography.
- Buyer intent type:
  - comparison
  - alternative
  - best tools
  - how-to
  - industry solution

## 9.3 Behavior

When user clicks `Discover opportunities`:

- Create discovery job.
- Generate page-engine opportunities.
- Generate backlink prospect suggestions where relevant.
- Show first results.

## 9.4 UI Requirements

Inputs:

- Multi-line seed field.
- Suggested seed chips from Brand Memory.
- Competitor chips.

States:

- Idle.
- Discovering.
- Results ready.
- Failed.

Acceptance:

- Discovery creates persisted opportunities.
- Results appear in Review First Results step.
- Opportunities are searchable and actionable.

## 10. Step 5 — Review First Results

## 10.1 Goal

Show the first useful output from GEOSEO and convert setup into action.

Sections:

- Buyer-intent page opportunities.
- Backlink opportunities.
- Content refresh suggestions.
- Initial alerts if any.

Each result should show:

- Title/domain/keyword.
- Why it matters.
- Expected impact.
- Difficulty or readiness.
- Recommended action.

Actions:

- Approve opportunity.
- Generate page.
- Open Backlink Opportunities.
- Run Authority Audit.
- Add more seeds.

Acceptance:

- User can take at least one meaningful action from this step.
- Actions update relevant product areas.

## 11. Step 6 — Launch Workspace

## 11.1 Goal

Finish onboarding and route user to the most useful next screen.

Show setup summary:

- Brand Memory saved.
- Publishing configured.
- Opportunities discovered.
- First jobs completed or running.
- Recommended next action.

Primary CTA options:

- Go to Authority HQ.
- Review opportunities.
- Generate first page.
- Open Page Engine.

Acceptance:

- Completion state persists.
- User can return to onboarding later to edit setup.
- Workspace dashboard reflects setup results.

## 12. Progress and Navigation

Requirements:

- Stepper with current status.
- Completed steps show checkmarks.
- Failed steps show retry.
- User can go back without losing data.
- User can save and exit.
- Resume returns to last incomplete step.

Step states:

- not started
- in progress
- completed
- needs attention
- skipped

## 13. Data Model

Add onboarding state:

```ts
interface OnboardingState {
  workspaceId: string;
  status: "not-started" | "in-progress" | "completed" | "skipped";
  currentStep:
    | "scan"
    | "brand-memory"
    | "publishing"
    | "seeds"
    | "review"
    | "launch";
  completedSteps: string[];
  skippedSteps: string[];
  scanJobId?: string;
  discoveryJobId?: string;
  lastSavedAt?: ISODate;
  completedAt?: ISODate;
}
```

Add scan result:

```ts
interface SiteScanResult {
  id: string;
  workspaceId: string;
  sourceUrl: string;
  status: "running" | "completed" | "failed";
  extractedBrand?: Partial<BrandProfile>;
  discoveredTopics: string[];
  discoveredCompetitors: string[];
  errors?: string[];
  createdAt: ISODate;
  completedAt?: ISODate;
}
```

## 14. API Requirements

Required endpoints:

```text
GET  /api/v1/onboarding
PUT  /api/v1/onboarding
POST /api/v1/onboarding/scan-site
GET  /api/v1/onboarding/scan-site/:id
POST /api/v1/onboarding/seed-opportunities
POST /api/v1/onboarding/complete
POST /api/v1/onboarding/reset
```

Related existing or required endpoints:

```text
GET  /api/v1/brand-profile
PUT  /api/v1/brand-profile
POST /api/v1/brand-profile/extract-from-site
GET  /api/v1/settings/publishing
PUT  /api/v1/settings/publishing
POST /api/v1/opportunities/discover
POST /api/v1/backlink/opportunities/discover
POST /api/v1/jobs
GET  /api/v1/jobs/:id
```

All endpoints must:

- be workspace-scoped
- persist state
- validate input
- return typed responses
- avoid mock fallback in production mode

## 15. Workflow Stitching

Onboarding must update the rest of the product.

Required stitched behavior:

- Saved Brand Memory appears on Brand page.
- Publishing settings appear in Settings and Page Engine.
- Seeded opportunities appear in Research and Pages.
- Backlink prospects appear in Backlink Opportunities.
- Jobs appear in job drawer.
- Activity/audit records onboarding actions.
- Authority HQ shows setup progress or first recommendations.
- Search can find newly created Brand Memory, opportunities, and prospects.

## 16. UI/UX Requirements

## 16.1 Visual Direction

The onboarding flow should feel:

- guided
- premium
- calm
- intelligent
- safe
- high-conversion

Keep:

- light SaaS visual system
- white panels
- cool gray canvas
- violet accent
- black primary CTAs

Avoid:

- marketing landing-page hero treatment
- generic form wizard feel
- oversized decorative illustrations
- hidden progress
- technical jargon without explanation

## 16.2 Layout

Desktop:

- Left: stepper/progress.
- Center: current step.
- Right: live preview or setup summary.

Mobile:

- Top: compact progress.
- Middle: current step.
- Bottom: sticky primary action.
- Preview collapses below current step.

## 16.3 Live Preview

Show a contextual preview for each step:

- Scan: extracted fields.
- Brand: compiled Brand Memory.
- Publishing: destination URL.
- Seeds: opportunity examples.
- Review: first results.
- Launch: completed setup summary.

## 17. Empty, Loading, and Error States

Loading:

- Show progress checklist for scan/discovery.
- Show skeletons for extracted data.
- Show job progress where available.

Empty:

- Manual entry path if scan has no result.
- Suggested seeds if user has no ideas.

Error:

- Clear error message.
- Retry button.
- Manual fallback.
- Do not lose entered data.

Acceptance:

- User never reaches a dead end.

## 18. Micro-Interactions

Add:

- Step completion checkmark.
- Progress bar.
- Scan checklist animation.
- Save success state.
- Generated opportunity reveal.
- Copy URL/context success.
- Gentle transition between steps.

Rules:

- Honor `prefers-reduced-motion`.
- Keep transitions fast and useful.

## 19. Security and Privacy

Requirements:

- Tell user what website data is scanned.
- Do not expose API keys or server secrets.
- Validate URL server-side.
- Prevent SSRF in site scan implementation.
- Limit scan depth and timeout.
- Sanitize extracted content.
- Scope all onboarding state by workspace.
- Audit onboarding completion and reset.

Production scan safety:

- Allow only `http` and `https`.
- Block localhost/private IP ranges.
- Enforce request timeout.
- Enforce max response size.
- Avoid following unlimited redirects.

## 20. Performance Requirements

Targets:

- Onboarding page initial render under 1 second locally.
- Scan job starts in under 300 ms.
- UI responds immediately after each click.
- Step transition under 200 ms.
- No layout shift between steps.

Implementation:

- Use API jobs for scan/discovery.
- Poll job state efficiently.
- Keep heavy scan/provider logic server-side.
- Do not import mock fixtures into client components in production mode.

## 21. Accessibility

Requirements:

- Stepper has accessible labels.
- Current step is announced.
- Form fields have labels.
- Errors are associated with fields.
- Keyboard navigation works.
- Sticky footer does not trap focus.
- Dialogs/drawers trap focus.
- Reduced motion is respected.

## 22. Analytics

Track:

- onboarding_started
- site_scan_started
- site_scan_completed
- site_scan_failed
- brand_memory_saved
- publishing_settings_saved
- seeds_submitted
- opportunities_discovered
- onboarding_completed
- onboarding_abandoned

Do not log:

- secrets
- raw authorization headers
- sensitive lead/customer data

## 23. Acceptance Criteria

Functional:

- User can scan a website.
- User can manually enter Brand Memory if scan fails.
- User can save Brand Memory.
- User can configure publishing.
- User can seed opportunities.
- User can review first results.
- User can complete onboarding.
- Completion updates other product areas.

UX:

- User always knows current step.
- User always knows what GEOSEO is doing.
- User can recover from errors.
- User reaches first meaningful result quickly.

Visual:

- Looks premium and consistent with GEOSEO.
- Works at 375 px, 768 px, and desktop.
- No text clipping.
- No crowded form layout.

Security:

- Site scan has SSRF protection.
- State is workspace-scoped.
- No secrets exposed.

Performance:

- No blank screen.
- No layout jump.
- Jobs show progress.

## 24. Implementation Checklist

Phase 1:

- Add persisted onboarding state API.
- Add scan-site workflow with safe validation.
- Upgrade onboarding UI into 6-step flow.
- Save Brand Memory through API.
- Save publishing settings through API.
- Seed opportunities through API.
- Add launch summary.

Phase 2:

- Add live previews per step.
- Add job polling.
- Add resume/save-and-exit.
- Add onboarding activity/audit events.
- Add mobile sticky action footer.

Phase 3:

- Add setup analytics.
- Add global search indexing for onboarding-created objects.
- Add role-aware onboarding behavior.
- Add demo reset/setup command.

