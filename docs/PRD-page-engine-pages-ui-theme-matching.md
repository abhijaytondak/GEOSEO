# PRD - Page Engine / Pages UI, Theme Matching, and Publishing Workflow

Screen:

```text
Page Engine
Pages
Buyer-intent opportunities become approved blueprints, AI-drafted pages, and published, AI-search-ready content.
```

This PRD defines the next-generation Pages workflow for GEOSEO Page Engine.
The goal is to create buyer-intent pages that do not look like generic AI pages.
They must look and feel like native pages from the customer's own website,
regardless of where the website is built or published.

Reference benchmark: Gushwork positions its Page Creation Engine around keyword
research, intent mapping, competitor tracking, blog pages, service pages,
infographics, branded images, and auto-updates for AI bots and human visitors:
https://www.gushwork.ai/page-creation-engine

GEOSEO should match and exceed that product promise with stronger workflow
control, theme fidelity, preview, publishing, monitoring, and rollback.

---

## 1. Goal

Build a Page Engine Pages workspace where users can turn buyer-intent opportunities
into branded, AI-search-ready pages that visually belong inside the customer's
website.

The user should be able to:

- Review buyer-intent opportunities.
- Approve a page blueprint.
- Generate an AI-drafted page.
- Match the customer's website theme and layout style.
- Preview desktop/tablet/mobile versions.
- Edit content and SEO metadata.
- Approve and publish safely.
- See the page live under the customer's publishing destination.
- Track leads and performance.
- Refresh or rollback when needed.

## 2. Product Promise

The Pages product should feel like an AI content and publishing team that can:

- understand what buyers are searching for
- map that search intent to the right page type
- generate high-converting content
- make the page look native to the customer's website
- publish without engineering work
- keep pages updated as rankings, AI visibility, and data change

The output should not look like a detached template or iframe. It should look like
the customer built it in their own site design system.

## 3. Target Users

### Founder / Owner

Needs:

- fast path to inbound leads
- confidence pages match the brand
- low technical burden
- clear ROI

### Marketer

Needs:

- control over page topics, copy, CTA, and brand voice
- preview before publishing
- SEO and AI-readiness checks
- ability to refresh and improve pages

### Agency / Operator

Needs:

- repeatable workflow across clients
- theme extraction per website
- approval and rollback
- client-ready reporting
- scalable publishing

## 4. First Viewport Requirements

The first viewport of `/pages` must include:

- Page identity: `Page Engine / Pages`.
- Value statement.
- Primary actions:
  - `Discover opportunities`
  - `Generate page`
  - `Publishing settings`
- KPI strip:
  - published pages
  - drafts
  - awaiting review
  - pages needing refresh
  - leads generated
- Workflow status:
  - opportunities -> blueprints -> drafts -> review -> published
- First actionable list:
  - pages needing attention, or
  - approved opportunities ready to generate.

The first viewport should make the pipeline obvious.

## 5. Core Workflow

```text
1. Discover buyer-intent opportunity
2. Approve opportunity
3. Generate blueprint
4. Extract or confirm website theme
5. Generate page draft
6. Preview in customer theme
7. Edit content, SEO, CTA, and layout sections
8. Run quality checks
9. Submit for review
10. Approve
11. Publish
12. Monitor leads, ranking, AI visibility
13. Refresh or rollback
```

Every step must be API-backed and persisted.

## 6. Page Types

Supported page types:

- Service page
- Use-case page
- Industry page
- Comparison page
- Alternative page
- Best tools / list page
- Guide / blog article
- FAQ / resource page
- Location page later
- Calculator/tool landing page later

Each page type must define:

- search intent
- structure
- required sections
- schema markup
- CTA pattern
- internal-link strategy
- conversion goal

## 7. Theme Matching Requirement

This is the most important product differentiator.

Generated pages must visually fit the customer's website.

The system must extract, infer, or let the user configure:

- typography
- color palette
- spacing scale
- button styles
- border radius
- card styles
- grid width
- nav/header treatment
- footer treatment
- CTA style
- form style
- image style
- icon style
- section rhythm
- content density
- dark/light mode if present

## 7.1 Theme Extraction

Add a website theme scan step.

Inputs:

- website URL
- optional sample URLs
- optional brand guidelines upload later
- optional CSS URL later

Scan should collect:

- homepage visual tokens
- service page layout patterns
- blog/resource page layout patterns
- header and footer structure
- colors from CSS and rendered page
- fonts from CSS
- button styles
- form styles
- section/container widths
- common components

Output:

```ts
interface SiteThemeProfile {
  id: string;
  workspaceId: string;
  sourceUrls: string[];
  status: "draft" | "confirmed" | "needs-review";
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary?: string;
    accent?: string;
    muted?: string;
    border?: string;
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    scale: string[];
    headingWeight?: number;
    bodyWeight?: number;
  };
  layout: {
    maxWidth: number;
    sectionSpacing: number;
    gridGap: number;
    headerStyle: "centered" | "split" | "minimal" | "editorial" | "custom";
    radius: number;
  };
  components: {
    button: ComponentStyle;
    card: ComponentStyle;
    input: ComponentStyle;
    badge?: ComponentStyle;
  };
  assets: {
    logoUrl?: string;
    faviconUrl?: string;
    sampleImages: string[];
  };
  confidence: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}
```

## 7.2 Theme Confirmation UI

Before page generation, user can confirm theme profile.

UI should show:

- detected colors as swatches
- detected typography sample
- button preview
- card preview
- page section preview
- confidence score
- source URLs used

Actions:

- accept theme
- edit tokens
- rescan
- upload brand guide later
- choose fallback theme

Acceptance:

- User can see what GEOSEO thinks the website style is.
- User can fix obvious style issues before publishing.

## 7.3 Native Page Rendering

Generated pages should render using the customer's theme profile.

Requirements:

- Use customer colors and fonts.
- Use customer-like section widths and spacing.
- Use customer-like button and card styling.
- Header/footer should match or be compatible with publishing mode.
- Page should not feel like an unrelated microsite.
- Lead forms should match customer form style.
- Generated images/infographics should use customer visual identity.

Important:

- Do not clone copyrighted assets or exact proprietary layouts from unrelated
  competitors.
- It is acceptable to match the customer's own website theme because the customer
  owns or controls that brand context.

## 8. Publishing Modes

Pages must be publishable no matter where the customer's website is built.

Supported modes:

### 8.1 Managed Subdirectory

Example:

```text
customer.com/feeds/page-slug
```

Use when GEOSEO hosts/renders pages but they appear under a customer-owned path.

Requirements:

- sitemap support
- `llms.txt` support
- canonical URL
- OpenGraph tags
- schema markup
- lead capture

### 8.2 Subdomain

Example:

```text
feeds.customer.com/page-slug
```

Requirements:

- DNS setup
- SSL
- sitemap
- `llms.txt`
- branded theme

### 8.3 CMS Adapter

Future adapters:

- Webflow
- WordPress
- Shopify
- Framer
- HubSpot CMS
- custom webhook/static export

Requirements:

- same page model
- same quality checks
- same rollback model where provider allows it
- provider-specific publish status

## 9. Page Builder Output

Generated page must include:

- meta title
- meta description
- canonical URL
- OpenGraph title/description/image
- H1
- hero copy
- conversion CTA
- structured sections
- FAQs
- internal links
- schema markup
- lead form or CTA block
- image/infographic slots
- source/last updated info if appropriate

AI-search readiness:

- concise answer blocks
- structured headings
- FAQ schema
- direct definitions
- comparison tables where relevant
- evidence/source notes where relevant
- `llms.txt` inclusion

Human conversion readiness:

- clear benefit
- proof points
- CTA
- readable section rhythm
- trust content
- lead capture

## 10. Pages Workspace UI

## 10.1 Pipeline Summary

Cards:

- Opportunities ready
- Blueprints approved
- Draft pages
- In review
- Published
- Needs refresh
- Leads captured

Clicking a card filters the page list.

## 10.2 Action Header

Actions:

- Discover opportunities
- Generate page
- Theme settings
- Publishing settings
- Export report

No header CTA can be inert.

## 10.3 Page List

Desktop table columns:

- page title
- slug
- type
- status
- SEO score
- AI readiness
- theme status
- leads
- last updated
- actions

Mobile cards:

- title
- status
- SEO/AI score
- publish path
- primary action
- secondary menu

Actions:

- edit
- preview
- submit
- approve
- publish
- refresh
- rollback
- duplicate
- delete/archive

## 10.4 Needs Attention Panel

Shows:

- pages with SEO blockers
- pages with theme mismatch
- pages with rank drops
- pages with stale content
- pages with broken links
- pages with low conversion

Each item has:

- reason
- impact
- primary action

## 11. Page Detail / Editor

The editor is the core work surface.

Tabs:

- Content
- SEO
- Theme Preview
- Schema
- Internal Links
- Leads
- Versions
- Publish

## 11.1 Content Tab

Editable:

- title
- meta title
- meta description
- hero copy
- sections
- FAQ
- CTA
- images/infographics later

Requirements:

- autosave or explicit save
- validation
- diff against previous version
- AI regenerate section action

## 11.2 SEO Tab

Checks:

- title length
- meta length
- H1 presence
- canonical
- schema
- internal links
- keyword coverage
- AI-answer structure
- readability

## 11.3 Theme Preview Tab

Must show:

- customer-theme rendered preview
- desktop/tablet/mobile modes
- theme confidence
- mismatched components if any
- ability to edit theme tokens

Acceptance:

- User can see whether the page looks like part of the website before publishing.

## 11.4 Publish Tab

Shows:

- publish destination
- URL preview
- approval status
- SEO blockers
- theme blockers
- last published version
- rollback options

Actions:

- submit for review
- approve
- publish
- unpublish later
- rollback

## 12. Quality Gates

Page cannot publish if blocking checks fail.

Blocking checks:

- missing title/H1
- missing meta description
- missing canonical URL
- invalid slug
- no CTA
- broken schema
- unsafe generated content
- unconfirmed theme profile in production
- publishing destination not configured

Warning checks:

- low theme confidence
- weak keyword coverage
- no FAQ
- low internal links
- stale source data
- no lead form

Acceptance:

- Publish button explains blockers.
- User can fix blockers from the same flow.

## 13. Theme Fidelity Score

Add a score that tells user how native the page looks.

Inputs:

- color match
- typography match
- spacing/layout match
- component match
- header/footer compatibility
- CTA style match
- form style match

Score:

```text
0-59: Needs review
60-79: Acceptable
80-100: Native fit
```

UI:

- badge in page list
- detailed breakdown in Theme Preview
- warning before publish if score is low

## 14. Image and Infographic Generation

Inspired by the benchmark page's focus on branded images and infographics, GEOSEO
should support visual assets that match the customer brand.

Requirements:

- Generate branded image prompts from theme profile.
- Use customer colors and typography guidance.
- Support infographic blocks for:
  - process flows
  - comparison tables
  - checklists
  - data visualizations
- Store generated asset metadata.
- Allow replace/regenerate.

First version can use placeholders with theme-aware styling if image generation
is not configured.

## 15. Auto-Updates and Refresh

Pages should improve over time.

Triggers:

- ranking drop
- traffic drop
- AI visibility drop
- stale content age
- broken internal/external links
- new competitor pages
- new opportunity data

Actions:

- queue refresh
- regenerate section
- update metadata
- apply internal links
- create new version
- require approval before publish

Acceptance:

- Refresh creates a new version, not destructive overwrite.

## 16. Lead Capture

Every published page can include a native-looking lead capture element.

Requirements:

- form style matches theme profile
- lead source page is tracked
- spam/duplicate filtering
- thank-you state
- CRM sync later
- analytics events

Fields:

- name
- email
- company
- message
- hidden page/source fields
- UTM fields

## 17. API Requirements

Existing and required endpoints:

```text
GET    /api/v1/pages
POST   /api/v1/pages/generate
GET    /api/v1/pages/:id
PUT    /api/v1/pages/:id
DELETE /api/v1/pages/:id
POST   /api/v1/pages/:id/submit
POST   /api/v1/pages/:id/approve
POST   /api/v1/pages/:id/publish
POST   /api/v1/pages/:id/refresh
GET    /api/v1/pages/:id/versions
POST   /api/v1/pages/:id/rollback/:versionId
```

Add:

```text
GET    /api/v1/site-theme
POST   /api/v1/site-theme/scan
GET    /api/v1/site-theme/:id
PUT    /api/v1/site-theme/:id
POST   /api/v1/site-theme/:id/confirm

GET    /api/v1/pages/:id/preview
POST   /api/v1/pages/:id/validate
POST   /api/v1/pages/:id/export
POST   /api/v1/pages/:id/duplicate
POST   /api/v1/pages/:id/unpublish

GET    /api/v1/publishing/status
POST   /api/v1/publishing/test
POST   /api/v1/publishing/sitemap/sync
POST   /api/v1/publishing/llms/sync
```

## 18. Workflow Stitching

Required connections:

- Onboarding site scan creates initial Site Theme Profile.
- Brand Memory powers page content generation.
- Page opportunities create blueprints.
- Blueprints generate pages.
- Site Theme Profile styles page preview and published output.
- Publishing settings determine final URL.
- Published pages update sitemap and `llms.txt`.
- Published pages appear in public `/feeds/[slug]`.
- Lead form submissions appear in Leads.
- Performance trends connect back to pages.
- Refresh recommendations create page refresh jobs.
- Search finds pages, versions, and opportunities.
- Activity/audit logs record generate/edit/approve/publish/rollback.

## 19. Security Requirements

Theme scanning and publishing have security risk.

Requirements:

- SSRF protection for theme/site scans.
- Block private IP ranges and localhost.
- Limit crawl depth.
- Limit response size.
- Sanitize HTML.
- Never store or expose secrets from scanned pages.
- Validate slugs.
- Escape generated content.
- Audit publish/unpublish/rollback/export.
- Enforce workspace scoping.
- Enforce role permissions.

## 20. Performance Requirements

Targets:

- Pages list renders quickly with skeletons.
- Editor opens under 300 ms after data loads.
- Preview renders under 1 second in demo mode.
- Theme scan starts under 300 ms as a job.
- Publishing job is trackable.

Implementation:

- Use jobs for scan/generate/publish/refresh.
- Cache Site Theme Profile.
- Keep preview renderer isolated.
- Dynamically load heavy editor/preview components.
- Use stable preview dimensions.

## 21. Responsive Requirements

Mobile:

- page cards instead of wide table
- preview device toggle
- editor sections stacked
- sticky save/submit action

Tablet:

- split editor/preview if room allows
- collapsible side panels

Desktop:

- pipeline and needs attention visible
- editor can use split content/preview layout
- no wasted whitespace

## 22. Accessibility

Requirements:

- editor fields have labels
- preview controls keyboard accessible
- status badges include text
- publish blockers announced
- dialogs/drawers trap focus
- contrast meets accessibility standards
- generated pages have semantic headings
- forms have accessible labels and errors

## 23. Acceptance Criteria

Functional:

- User can discover opportunity.
- User can generate blueprint.
- User can scan/confirm site theme.
- User can generate a themed page.
- User can preview desktop/tablet/mobile.
- User can edit content and SEO.
- User can validate quality gates.
- User can publish.
- Published page uses customer theme profile.
- Published page appears under configured path.
- Lead form works.
- Sitemap and `llms.txt` update.
- User can refresh and rollback.

UX:

- User understands page pipeline in under 10 seconds.
- User can see whether page matches their website.
- User can fix publish blockers without leaving flow.
- User never sees inert CTAs.

Visual:

- Generated page looks native to customer website.
- Page list and editor match GEOSEO design system.
- Preview is polished and trustworthy.
- No clipped text at mobile widths.

Security:

- Theme scan has SSRF protection.
- Publishing is permission-gated.
- Generated HTML is sanitized.
- No secrets exposed.

Performance:

- Heavy preview/editor code does not block route.
- Jobs show progress.
- No layout shift in preview.

## 24. Implementation Checklist

Phase 1:

- Add Site Theme Profile type.
- Add theme scan API.
- Add theme confirmation UI.
- Wire Pages header discovery CTA.
- Add real page preview route/API.
- Add publish validation endpoint.
- Add theme status and theme fidelity score to page list.

Phase 2:

- Render generated pages with theme tokens.
- Add desktop/tablet/mobile preview.
- Add quality gate UI.
- Add publishing status and blockers.
- Add sitemap/llms sync feedback.

Phase 3:

- Add branded image/infographic blocks.
- Add auto-refresh versioning.
- Add CMS adapter abstraction.
- Add report/export for pages.
- Add production-grade theme scanner.

