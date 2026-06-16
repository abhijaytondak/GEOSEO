# PRD - GEOSEO Workflow and Navigation Optimization

Date: 2026-06-16
Owner: Product / Design / Engineering
Status: Draft for review
Repo audited: `/Users/abhijay/GEOSEO`

## 1. Objective

Reduce GEOSEO's sidebar and tab sprawl by reorganizing the product around a small number of outcome-led workflows, similar to the way Gushwork presents one growth system made of coordinated agents.

The current app exposes many implementation surfaces as separate navigation items. This makes the product look broad but harder to understand. The optimized version should make GEOSEO feel like a single AI growth operating system: learn the business, find buyer intent, create and publish pages, build authority, convert leads, and monitor growth.

## 2. Why This Matters

GEOSEO has accumulated powerful features:

- Authority HQ
- Backlink Opportunities
- Competitors
- Analytics
- Page Engine Dashboard
- Onboarding
- Opportunity Explorer
- Pages
- Leads
- Conversion Audit
- Theme
- Brand Memory
- Content
- Alerts
- AI Search
- Solutions
- Settings

This is too much for a persistent sidebar. It forces the user to understand the internal feature model before they understand the business workflow. A user looking for "how do I get more qualified leads?" sees many options, but the product does not clearly say what happens first, what happens next, and what is running in the background.

The redesign should preserve all existing functionality while changing the information architecture from feature-first to workflow-first.

## 3. Gushwork Comparison

Public Gushwork positioning consistently frames the product as a unified growth system, not a menu of separate tools.

Sources reviewed:

- Gushwork homepage: https://www.gushwork.ai/
- Brand Memory: https://www.gushwork.ai/brand-memory
- Page Creation Engine: https://www.gushwork.ai/page-creation-engine
- AI-First CMS: https://www.gushwork.ai/ai-first-cms
- Leads Dashboard: https://www.gushwork.ai/leads-dashboard
- Analytics: https://www.gushwork.ai/analytics
- AI Search solution: https://www.gushwork.ai/solutions/ai-search

### Gushwork's Product Story

Gushwork groups many capabilities under a simple promise: help businesses get discovered across Google and AI search, then convert that demand into qualified leads. Its homepage frames the product as specialized agents working together in the background. The AI Search solution page describes a sequence: learn the business, find high-intent searches, create pages, publish them, build trust signals, update pages, and track demand in the Leads Dashboard.

Important product patterns observed:

- The user-facing mental model is "agents and outcomes", not "modules and admin pages".
- Brand Memory is foundational, but it is not the final destination; it feeds every other agent.
- Research, strategy, content, authority, analytics, and lead conversion are part of one pipeline.
- Leads are the business outcome, not just another table.
- Analytics is described as unified visibility across human traffic, AI traffic, mentions, rankings, content performance, and lead analytics.
- CMS/content management is not treated as a separate writing app; it is the operational layer that keeps pages, links, refreshes, schema, and AI visibility healthy.

### Gap Against GEOSEO

GEOSEO already has most of the underlying pieces. The gap is not primarily capability. The gap is choreography.

Gushwork says: "Six agents. One outcome."

GEOSEO currently says, through the sidebar: "Here are 17 places you might need to go."

The product should be redesigned so the default user experience is:

1. What is my growth status?
2. What is the next best action?
3. Which agent/workflow owns it?
4. What evidence supports it?
5. What changed after it ran?

## 4. Current GEOSEO IA Audit

Current sidebar source: `/Users/abhijay/GEOSEO/apps/web/src/components/shell/nav-config.ts`

Current primary groups:

- Ungrouped top section: Authority HQ, Backlink Opportunities, Competitors, Analytics
- Page Engine: Dashboard, Onboarding, Opportunity Explorer, Pages, Leads, Conversion Audit, Theme
- Workspace: Brand Memory, Content, Alerts, AI Search, Solutions, Settings

### Problems

1. Duplicate dashboards

Authority HQ, Analytics, Page Engine Dashboard, Performance, AI Search, and Conversion Audit all overlap as "how are we doing?" views.

2. Internal steps are treated as destinations

Onboarding, Opportunity Explorer, Theme, Conversion Audit, and Content are workflow steps or contextual settings, but they occupy permanent sidebar slots.

3. Business outcome is buried

Leads is currently inside Page Engine, but leads are the end-to-end outcome of the whole product. It should not feel like a sub-feature of page creation.

4. Brand Memory is disconnected

Brand Memory should be the foundation for all agents. Today it is a workspace page with tabs. It should be present as an always-visible context layer and setup health signal.

5. Alerts are a separate page

Alerts should mostly become an Action Inbox / Tasks layer that appears on Home and relevant workflows. A separate archive can remain, but alerts should not be a major nav destination.

6. Competitors and Backlink Opportunities are split too far apart

Competitors, keyword gaps, authority gaps, and backlink opportunities are all part of growth strategy and authority building. They should be connected in one workflow.

7. Too many horizontal tabs inside pages

Brand, Settings, Analytics, lead detail drawers, and outreach drawers use tabs for legitimate subviews, but the current product relies on tabs as a way to store unrelated capabilities. Tabs should only separate sibling views within the same workflow state.

## 5. Proposed Product Model

Use a top-level "Growth OS" model with five primary destinations and one utility area.

### Primary Navigation

1. Home

Label: Home
Purpose: Executive cockpit and action queue.
Replaces/absorbs: Authority HQ, Page Engine Dashboard, Alerts summary, Brand Scorecard.

2. Growth Pipeline

Label: Pipeline
Purpose: The full AI Search workflow from opportunity discovery to published pages.
Replaces/absorbs: Opportunity Explorer, Pages, Content, Theme, Conversion Audit, parts of AI Search.

3. Authority

Label: Authority
Purpose: Competitors, backlink opportunities, citations, trust signals, and authority health.
Replaces/absorbs: Backlink Opportunities, Competitors, authority sections of Analytics.

4. Leads

Label: Leads
Purpose: Qualified lead inbox, journey, assignment, follow-up, CRM sync.
Replaces/absorbs: Leads Dashboard, lead detail tabs, follow-up.

5. Analytics

Label: Analytics
Purpose: Unified measurement across AI visibility, search rankings, page performance, traffic, and conversion.
Replaces/absorbs: Analytics, Performance, AI Search reporting, monitoring.

6. Settings

Label: Settings
Purpose: Workspace profile, integrations, team, billing, notifications, publishing config.
Replaces/absorbs: Settings, setup-only configuration pages.

### Removed From Primary Sidebar

The following should no longer appear as permanent sidebar items:

- Onboarding
- Opportunity Explorer
- Pages
- Conversion Audit
- Theme
- Brand Memory
- Content
- Alerts
- AI Search
- Solutions
- Competitors as a standalone item
- Backlink Opportunities as a standalone item

All remain accessible contextually inside the five workflows or via command palette/global search.

## 6. New Workflow Architecture

### 6.1 Home - Growth Command Center

Home is the default 80 percent page.

It should answer:

- Are we on track to generate qualified leads?
- What is running now?
- What needs my approval?
- What changed since last visit?
- Which agent should I pay attention to?

Sections:

1. Growth Scorecard

Shows:

- Pipeline health score
- Published pages
- AI visibility
- Authority trend
- Qualified leads
- Revenue or estimated pipeline influenced

2. Next Best Actions

Combines alerts, pending approvals, data gaps, and recommendations.

Action types:

- Complete Brand Memory
- Approve page blueprint
- Publish page
- Add CMS credentials
- Review slipping page
- Approve outreach/backlink target
- Follow up with high-score lead

3. Agent Activity

Timeline of what agents did:

- Memory updated
- Research found new opportunities
- Strategy generated blueprint
- Content drafted page
- CMS published page
- Authority found backlink/citation
- Refresh recommended update
- Lead captured

4. Business Outcome Strip

Shows leads and conversion signals first, not vanity metrics.

5. Setup Health

Compact checklist for:

- Brand Memory
- CMS connection
- Analytics/GSC
- DataForSEO/keyword source
- CRM
- Auth/team

Home should not become another dense analytics page. It is the operator cockpit.

### 6.2 Pipeline - Research to Publish Workflow

Pipeline is the main Page Engine replacement.

It should be organized as a stage board or left-to-right workflow, not separate sidebar pages.

Stages:

1. Discover

Current sources:

- Opportunity Explorer
- Keyword research
- Competitor gaps
- AI search gaps

Primary job:

- Find buyer-intent opportunities.

2. Plan

Current sources:

- Blueprints
- Intent mapping
- Conversion audit
- Theme fidelity checks

Primary job:

- Turn an opportunity into a content/page plan.

3. Create

Current sources:

- Pages drafts
- Puter/DeepSeek generation
- Brand Memory grounding
- Image generation
- Content editor

Primary job:

- Draft the page and visual assets.

4. Review

Current sources:

- SEO gate
- Theme fidelity
- Brand QA
- Version history
- Approval workflow

Primary job:

- Make the page safe to publish.

5. Publish

Current sources:

- Feeds
- CMS publishing status
- Sitemap
- llms.txt
- canonical/schema

Primary job:

- Push live and expose to AI/search crawlers.

6. Refresh

Current sources:

- Monitoring recommendations
- Performance trends
- Auto-updates
- Needs-refresh pages

Primary job:

- Improve or update pages based on evidence.

Navigation inside Pipeline:

- Use a stage switcher at the top.
- Use filters within each stage.
- Page details open in a drawer or split panel.
- Blueprints, editor, versions, theme, and SEO gate are detail panels inside selected page/opportunity.

Do not show separate top-level links for Opportunity Explorer, Pages, Theme, Conversion Audit, or Content.

### 6.3 Authority - Trust and Competitive Position

Authority should combine:

- Backlink Opportunities
- Competitors
- Citations
- Keyword gaps
- Domain/page authority
- Outreach drafts
- Archived prospects
- Restore prospect
- Authority alerts

Recommended internal sections:

- Overview
- Competitors
- Opportunities
- Outreach
- Acquired Links / Inventory
- Alerts / Risks

The default Authority view should be an "authority gap" dashboard:

- Who outranks us?
- Which topics/pages need trust signals?
- Which backlinks/citations should we pursue next?
- Which outreach drafts are ready?
- Which wins were acquired?

Backlink Opportunities and Competitors should be siblings inside Authority, not two separate sidebar destinations.

### 6.4 Leads - Qualified Demand Inbox

Leads should become a top-level destination because it is the business outcome.

Keep:

- Lead list
- Spam/duplicate filtering
- Lead score
- Journey
- Activity
- Owner assignment
- Follow-up drafts
- CRM sync
- Delete/export

Optimize:

- Default filter should prioritize clean, high-score, unassigned/new leads.
- Follow-up should be visible as a right-side action, not hidden behind a deep tab.
- Journey and activity can remain as detail tabs because they are true sibling views of a selected lead.

Leads should connect back to:

- Source page
- Source opportunity
- Campaign/authority effort
- AI/search/referrer source

### 6.5 Analytics - Unified Evidence Layer

Analytics should become the single measurement hub.

Unify:

- Human traffic
- AI bot traffic
- AI mentions/citations
- Ranking tracker
- Content performance
- Lead analytics
- Authority movement
- Performance trends

Recommended internal tabs:

- Overview
- AI Visibility
- Search Rankings
- Pages
- Leads
- Authority

This is one of the few places where tabs make sense because these are sibling measurement lenses.

Analytics should not be confused with Home. Home says what to do. Analytics explains why.

### 6.6 Settings - Setup and Admin

Settings should be the utility area, not a feature warehouse.

Keep tabs:

- Workspace
- Brand Context
- Integrations
- Publishing
- Team
- Notifications
- Billing

Move into Settings or contextual setup panels:

- Brand Memory base configuration
- Theme tokens
- CMS settings
- GSC/analytics keys
- CRM keys
- DataForSEO
- Image generation
- Notification rules

However, Brand Memory should still be surfaced throughout the app as a persistent context status. Users should not need to "go to Brand Memory" often after setup.

## 7. Recommended Sidebar

### Desktop Sidebar

Primary:

- Home `/`
- Pipeline `/pipeline`
- Authority `/authority`
- Leads `/leads`
- Analytics `/analytics`

Utility:

- Settings `/settings`

Optional:

- Command/Search button
- "Run Agent" primary CTA
- Setup health chip

### Mobile Navigation

Use 4 bottom tabs plus overflow:

- Home
- Pipeline
- Leads
- Analytics
- More

More contains Authority and Settings. If Authority becomes heavily used, swap it into bottom nav and move Analytics into More for sales users.

## 8. Route Mapping

| Current route | Proposed destination | Treatment |
|---|---|---|
| `/` Authority HQ | `/` Home | Keep root, reshape into command center |
| `/dashboard` | `/` Home or `/pipeline?view=overview` | Remove from sidebar; redirect |
| `/onboarding` | `/setup` or modal checklist | Remove from sidebar; setup flow only |
| `/research` | `/pipeline?stage=discover` | Redirect/alias |
| `/pages` | `/pipeline?stage=create` or `/pipeline?stage=review` | Redirect/alias |
| `/content` | `/pipeline?stage=create` | Merge |
| `/theme` | `/settings?tab=publishing` and Pipeline page QA panel | Remove from sidebar |
| `/conversion-audit` | `/pipeline?panel=conversion-audit` | Contextual panel |
| `/opportunities` | `/authority?view=opportunities` | Merge |
| `/competitors` | `/authority?view=competitors` | Merge |
| `/leads` | `/leads` | Keep top-level |
| `/analytics` | `/analytics` | Keep and expand |
| `/performance` | `/analytics?view=rankings` or `/analytics?view=pages` | Redirect/alias |
| `/ai-search` | `/analytics?view=ai-visibility` and `/pipeline` recommendations | Merge |
| `/alerts` | `/` Action Inbox plus `/settings?tab=notifications` | Remove as primary |
| `/brand` | `/settings?tab=brand-context`; expose score on Home | Remove as primary |
| `/solutions` | Remove from product app or move to Help/Marketing | Not a core workflow |
| `/settings` | `/settings` | Keep |

Implementation can keep old routes as redirects for compatibility.

## 9. Tab Strategy

Tabs should be used only when all tabs are sibling views of the same object or workflow.

### Keep Tabs

- Analytics: Overview / AI Visibility / Rankings / Pages / Leads / Authority
- Lead detail drawer: Overview / Journey / Activity / Follow-up
- Settings: Workspace / Brand / Integrations / Team / Notifications / Billing
- Authority: Overview / Competitors / Opportunities / Outreach / Inventory

### Replace Tabs With Workflow Stages

- Page Engine: replace separate Dashboard / Opportunity Explorer / Pages / Theme / Conversion Audit with Pipeline stage navigation.
- Brand Workspace: replace multi-tab page with Settings plus compact Brand Context panel across Home and Pipeline.

### Avoid

- Tabs that hide primary actions.
- Tabs with unrelated nouns.
- Tabs nested inside tabs unless the inner tab is scoped to a selected object drawer.

## 10. Functional Requirements

### FR1 - Sidebar Consolidation

The sidebar must show no more than six persistent destinations.

Acceptance:

- Desktop sidebar has Home, Pipeline, Authority, Leads, Analytics, Settings.
- No implementation-step pages appear in the sidebar.
- Badges are reserved for actionable counts, not decorative counts.

### FR2 - Home Action Inbox

Home must aggregate pending work from all agents.

Acceptance:

- Shows at least five action types from different systems.
- Each action has owner/workflow, priority, evidence, and primary CTA.
- Actions deep-link into the correct Pipeline/Authority/Lead/Settings context.

### FR3 - Pipeline Stage Board

Pipeline must replace Page Engine sub-navigation.

Acceptance:

- User can move from discovery to publish without leaving Pipeline.
- Stage counts show work-in-progress per stage.
- Existing page editor, SEO gate, theme fidelity, blueprint review, publish, and refresh functions remain available.
- Old `/research` and `/pages` routes redirect or alias into Pipeline.

### FR4 - Authority Workflow

Authority must combine competitor intelligence and backlink opportunity work.

Acceptance:

- Competitor gaps can generate page ideas or backlink actions.
- Backlink opportunities can be filtered by target page/topic.
- Outreach drafts remain accessible from selected opportunity detail.
- Archived prospects and restore action remain available.

### FR5 - Lead Outcome Focus

Leads must be treated as the business result of the system.

Acceptance:

- Lead list prioritizes clean, high-score, new/unassigned leads.
- Every lead links back to source page and source workflow.
- Follow-up action is prominent.
- CRM sync status is honest and visible.

### FR6 - Analytics as Evidence

Analytics must consolidate all measurement views.

Acceptance:

- AI visibility, rankings, page performance, traffic, and lead analytics are accessible from one hub.
- Home cards link to the relevant evidence view.
- Demo/fallback data state remains clearly labeled.

### FR7 - Setup and Brand Context

Brand Memory and setup should become context infrastructure.

Acceptance:

- Settings contains Brand Context setup and integration configuration.
- Home shows Brand Context health.
- Pipeline generation surfaces which Brand Memory facts were used.
- Missing context prompts appear inline where the user needs them.

### FR8 - Backwards Compatibility

Old routes must not break.

Acceptance:

- Existing bookmarks redirect or render aliases.
- Command palette can still find old concepts by name.
- API clients do not need to change for phase 1.

## 11. Non-Functional Requirements

- Reduce cognitive load: persistent nav should fit without scrolling on a 768px-tall desktop viewport.
- Preserve all built functionality.
- Avoid large backend rewrites in phase 1.
- Maintain demo-mode fallback honesty.
- Preserve accessibility of keyboard navigation and command palette.
- Maintain mobile usability with a compact nav model.

## 12. Content and Labeling Rules

Use outcome language:

- "Pipeline" instead of "Page Engine Dashboard"
- "Discover" instead of "Opportunity Explorer"
- "Plan" instead of "Blueprints"
- "Create" instead of "Content"
- "Review" instead of "Conversion Audit"
- "Publish" instead of "CMS"
- "Refresh" instead of "Monitoring"
- "Authority" instead of "Backlink Opportunities"
- "Brand Context" instead of "Brand Memory" in settings, while keeping "Brand Memory" as product copy where useful

Avoid exposing provider names in primary UI:

- DataForSEO, Brave, DeepSeek, Puter, Supabase, Redis, Clerk, etc. should appear in settings/status/tooltips, not primary workflow labels.

## 13. Implementation Phases

### Phase 0 - Design Alignment

Deliverables:

- Confirm final primary nav labels.
- Confirm redirect strategy.
- Confirm whether `/brand` becomes Settings tab or remains a secondary route hidden from sidebar.
- Confirm mobile priority between Authority and Analytics.

### Phase 1 - Navigation Collapse

Scope:

- Update `nav-config.ts`.
- Add redirects/aliases for hidden routes.
- Update mobile nav.
- Ensure command palette still finds all workflows.

Risk:

- Low. Mostly IA shell changes.

### Phase 2 - Pipeline Container

Scope:

- Create `/pipeline` route.
- Reuse existing Opportunity Explorer, PagesView, content/page editor, theme fidelity, conversion audit, and publish controls inside staged UI.
- Convert `/research` and `/pages` into stage aliases.

Risk:

- Medium. Existing page components are large and may need extraction.

### Phase 3 - Authority Container

Scope:

- Create `/authority` route.
- Move competitors and backlink opportunities into one workflow.
- Preserve outreach drawer and archived prospect restore.

Risk:

- Medium. Needs careful data linking between competitor gaps and backlink/page actions.

### Phase 4 - Home Action Inbox

Scope:

- Replace current Authority HQ layout with a command center.
- Aggregate tasks from pages, authority, leads, settings, alerts, and audits.
- Add priority scoring.

Risk:

- Medium/high. Requires product decisions on action priority.

### Phase 5 - Analytics Consolidation

Scope:

- Fold Performance and AI Search views into Analytics.
- Keep old routes as redirects.
- Improve source labeling and evidence links.

Risk:

- Medium.

### Phase 6 - Brand Context and Setup Cleanup

Scope:

- Move Brand Memory into Settings/Brand Context.
- Show context health across Home and Pipeline.
- Add inline prompts where generation is under-grounded.

Risk:

- Medium. Existing Brand Workspace tabs should be reused, not deleted.

## 14. Success Metrics

Quantitative:

- Sidebar item count reduced from 17 to 6.
- New user can identify the next best action within 10 seconds.
- User can go from discovered opportunity to published page in one workflow without using sidebar.
- User can find lead source and follow-up action within 2 clicks from Leads.
- Old routes maintain 100 percent compatibility through redirects/aliases.

Qualitative:

- Product feels like one system, not a collection of admin screens.
- Users describe the product in terms of outcomes: "it finds opportunities, publishes pages, builds authority, and brings leads."
- Sales demos can be narrated through a single workflow from Home to Leads.

## 15. Open Questions

1. Should "Authority" be top-level for the target buyer, or should it be nested under Pipeline as a trust-building stage?

Recommendation: keep Authority top-level because backlinks/citations are a distinct ongoing engine.

2. Should "Brand Memory" disappear from primary nav immediately?

Recommendation: yes, but only after Home shows Brand Context health and Settings exposes the editor clearly.

3. Should "Solutions" exist inside the product app?

Recommendation: no. It is marketing/commercial framing. Move to help/docs or remove from authenticated app.

4. Should Home be called "Home", "Command Center", or "Growth HQ"?

Recommendation: use "Home" in nav for clarity, with page title "Growth Command Center".

5. Should Pipeline use stages or tabs?

Recommendation: stages. This is a workflow with progression, not sibling views.

## 16. Engineering Notes

Likely files touched in implementation:

- `/Users/abhijay/GEOSEO/apps/web/src/components/shell/nav-config.ts`
- `/Users/abhijay/GEOSEO/apps/web/src/components/shell/sidebar.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/shell/mobile-nav.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/shell/command-palette.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/app/(app)/page.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/app/(app)/pipeline/page.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/app/(app)/authority/page.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/pages/pages-view.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/research/opportunities-explorer.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/opportunities/opportunities-view.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/competitors/competitor-analysis-view.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/analytics/analytics-workspace.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/brand/brand-workspace.tsx`
- `/Users/abhijay/GEOSEO/apps/web/src/components/settings/settings-view.tsx`

Do not start by deleting routes. Start by creating the new containers and redirecting/aliasing gradually.

## 17. Acceptance Test Plan

Manual:

- Open desktop app and verify sidebar has six items.
- Navigate old routes and confirm redirects/aliases work.
- Complete flow: Home action -> Pipeline Discover -> Plan -> Create -> Review -> Publish.
- Complete flow: Authority competitor gap -> create page idea or backlink action.
- Complete flow: Lead detail -> journey -> follow-up -> CRM sync.
- Check mobile nav at 375px and 768px.

Automated:

- Typecheck web.
- Lint web.
- Add route smoke checks for old and new routes.
- Add Playwright screenshots for Home, Pipeline, Authority, Leads, Analytics, Settings.

## 18. Recommendation Summary

Ship the IA change as a workflow refactor, not a visual redesign.

GEOSEO should keep its existing capability depth, but the user should see six clear destinations:

Home, Pipeline, Authority, Leads, Analytics, Settings.

Everything else becomes either:

- a stage inside a workflow,
- a detail drawer,
- a settings tab,
- an action in Home,
- or a searchable command palette result.

This will make GEOSEO feel closer to Gushwork's "one system, multiple agents" positioning while preserving the code and product investment already made.
