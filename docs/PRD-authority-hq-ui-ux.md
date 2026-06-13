# PRD — Authority HQ UI/UX

Screen:

```text
Overview
Authority HQ
Your domain authority, backlink momentum, and what to act on next — at a glance.
```

Authority HQ is the first serious product moment in GEOSEO. It must instantly
show the user that GEOSEO understands their authority, detects what is changing,
and knows the next best action.

This screen should feel like a premium operating dashboard: calm, dense, useful,
confident, and action-oriented.

---

## 1. Goal

Create a best-in-class overview screen for domain authority, backlink momentum,
SEO performance risk, and next actions.

The user should understand in under 10 seconds:

- Is my SEO authority improving or declining?
- What changed recently?
- What needs attention?
- What is GEOSEO doing in the background?
- What should I do next?

## 2. Product Promise

Authority HQ should not feel like a static analytics dashboard. It should feel like
an intelligent SEO control room.

The screen should combine:

- Executive summary.
- Operational metrics.
- Prioritized action list.
- Trust-building explanations.
- Background job visibility.
- Clear paths into Opportunities, Performance, Content, Alerts, and Brand Memory.

## 3. Target Users

### Founder / Owner

Needs a high-confidence business summary:

- "Are we growing authority?"
- "What actions create ROI?"
- "What changed this week?"

### Marketer

Needs tactical next actions:

- "Which prospects should I contact?"
- "Which pages need refresh?"
- "Which alerts matter now?"

### Agency / Operator

Needs multi-client operational clarity:

- "What work was completed?"
- "What needs review?"
- "What can be exported or reported?"

## 4. First Viewport Requirements

The first viewport must include:

- Page identity: `Overview / Authority HQ`.
- Human-readable value statement.
- Primary actions:
  - `Run audit`
  - `Acquire backlinks`
- Authority score or health score.
- 3 to 4 KPI cards.
- A clear "Next best action" or "Action Center".

The first viewport must not feel like marketing. It should be the actual dashboard.

## 5. Information Architecture

Recommended screen structure:

```text
Header
  Overview / Authority HQ
  Summary copy
  Run audit
  Acquire backlinks

Insight Summary Band
  One sentence: what changed and what to do next
  Data freshness
  Background jobs shortcut

KPI Strip
  Total backlinks
  Average rank
  Domain authority
  AI visibility

Main Grid
  Left: Domain Health
  Right: Action Center

Secondary Grid
  Backlink Profile
  Recent Activity
  Momentum / Forecast

Contextual Footer
  Reports, exports, settings, data sources
```

## 6. Header UX

## 6.1 Page Header

Text:

```text
Overview
Authority HQ
Your domain authority, backlink momentum, and what to act on next — at a glance.
```

Requirements:

- The title must be visually dominant but not oversized.
- Subtitle should be readable and calm.
- Header actions should remain visible on desktop.
- On mobile, actions should stack or become a compact action menu.

## 6.2 Header Actions

### Run Audit

Behavior:

- Starts simulated or real audit job.
- Opens job drawer automatically.
- Shows progress toast.
- On completion, shows summary:
  - opportunities found
  - alerts detected
  - pages needing refresh
  - backlink changes

Acceptance:

- Click produces immediate feedback.
- Job can be tracked.
- Completion links to actionable surfaces.

### Acquire Backlinks

Behavior:

- Starts backlink acquisition/discovery job.
- Routes to Opportunities.
- Applies a useful default view:
  - high-impact prospects
  - new prospects
  - recommended outreach

Acceptance:

- User lands on Opportunities with meaningful context.
- New or highlighted prospects are visible.

## 7. Insight Summary Band

Add a premium summary band directly below the header.

Purpose:

- Give the user a human-readable interpretation of the dashboard.
- Make the overview feel intelligent and alive.

Example:

```text
Authority is up 4.2% this month. Three high-impact prospects are ready for outreach,
and two stale pages should be refreshed to protect rankings.
```

Required elements:

- Primary insight sentence.
- Status badge: improving / stable / needs attention.
- Data freshness: "Updated 4 min ago" or "Demo data".
- Shortcut to job drawer.

States:

- Healthy: positive but restrained.
- Warning: specific issue, not alarmist.
- Critical: clearly tells user what to fix.
- Empty/demo: explains data is seeded.

## 8. KPI Strip

## 8.1 KPI Cards

Cards:

- Total backlinks
- Average rank
- Domain authority
- AI visibility

Each KPI card should include:

- Label
- Current value
- Change delta
- Trend sparkline
- Short caption
- Last updated hint on hover/focus
- Optional confidence/data-source hint

Visual rules:

- Stable height across cards.
- No text clipping.
- Tabular numerals.
- Motion count-up only if reduced motion is not enabled.
- Use semantic delta colors:
  - positive
  - warning
  - negative
  - neutral

Interaction:

- Click KPI card to open deeper route:
  - backlinks -> Opportunities or Backlink Profile
  - rank -> Performance
  - domain authority -> Domain Health detail
  - AI visibility -> Performance AI section

Acceptance:

- KPI cards are scannable at 375 px, 768 px, and desktop.
- Click actions are discoverable.
- Screen reader labels explain metric and delta.

## 9. Domain Health Panel

The Domain Health panel is the main explanatory visualization.

Required content:

- Composite score.
- Grade.
- Delta.
- Factor breakdown:
  - backlink quality
  - content freshness
  - technical health
  - AI visibility
- Backlinks acquired progress.
- Explanation of what drives the score.

UX behavior:

- Hover/focus on each factor reveals a short explanation.
- Clicking a factor filters/navigates to the relevant route.
- Score animation should be subtle and reduced-motion-safe.

Example factor explanation:

```text
Backlink quality improved because 4 links moved from pending to live.
```

Acceptance:

- User can understand why the score exists.
- Each factor points to an action or detail view.

## 10. Action Center

The Action Center should be the screen's primary operational module.

Purpose:

- Tell the user what to do next.
- Rank actions by impact.
- Make every action executable.

Action card fields:

- Title
- Reason
- Expected impact
- Urgency
- Related entity
- Primary action
- Secondary action

Example actions:

- "Contact 3 high-impact prospects"
- "Refresh 2 stale pages"
- "Resolve broken backlink alert"
- "Apply 4 internal link suggestions"
- "Update Brand Memory before generating outreach"

Action states:

- New
- In progress
- Done
- Snoozed
- Failed

Required actions:

- Open opportunity
- Start outreach
- Refresh content
- Resolve alert
- Apply internal links
- Run audit

Acceptance:

- No inert action cards.
- Every action links to a workflow.
- Completed actions visibly update.

## 11. Backlink Profile

Backlink Profile should explain link inventory health.

Required content:

- Live links
- Pending links
- Lost links
- Broken links
- Nofollow/dofollow when available
- Quality distribution
- Recent changes

Visual:

- Segmented progress bar.
- Small status legend.
- Link to Opportunities.
- Link to Performance if lost/broken links affect rank.

Upgrade:

- Add "link health score".
- Add "lost this week" callout.
- Add "recover lost links" action.

Acceptance:

- User can identify whether backlink growth is real or fragile.

## 12. Recent Activity

Recent Activity should build trust.

Content:

- Backlink acquired.
- Outreach draft saved.
- Alert resolved.
- Page refreshed.
- Internal links applied.
- Audit completed.
- Lead captured from page engine if relevant.

Each row:

- Icon
- Event description
- Timestamp
- Actor or system label
- Link to target object

UX:

- Show newest first.
- Allow filtering later by type.
- Empty state should say no activity yet and suggest running audit.

Acceptance:

- Activity is not decorative; it links to real context.

## 13. Momentum / Forecast Module

Add a premium forward-looking module.

Purpose:

- Make GEOSEO feel strategic.
- Show expected direction based on current actions.

Example:

```text
Projected authority gain: +3 to +5 points if 8 recommended backlinks go live.
```

Inputs:

- New prospects
- Pending backlinks
- Content decay
- Rank movement
- AI visibility trend

States:

- Improving
- Stable
- At risk
- Insufficient data

Acceptance:

- Forecast copy is clearly labeled as estimate.
- User sees which actions influence forecast.

## 14. Data Freshness and Trust

Authority HQ must show when data was last updated.

Required:

- Data freshness badge.
- Source hint:
  - Demo data
  - Mock API
  - DataForSEO
  - Search Console
  - CMS
- Stale data warning if data is old.
- Retry/reconnect action if source fails.

Acceptance:

- User never has to guess whether the dashboard is live.

## 15. Empty, Loading, and Error States

## 15.1 Loading

Use skeletons for:

- KPI cards
- Domain health
- Action center
- Activity feed
- Backlink profile

Rules:

- Skeleton dimensions match final layout.
- Header remains visible.
- Do not flash blank page.

## 15.2 Empty

If no data:

- Show onboarding action:
  - scan domain
  - run first audit
  - discover prospects
  - connect data source

Empty state copy:

```text
Run your first authority audit to uncover backlink opportunities, ranking risks,
and content refresh actions.
```

## 15.3 Error

If API fails:

- Show calm inline error.
- Keep mock/demo fallback only if mode allows it.
- Provide retry.
- Provide setup link if credential issue.

Acceptance:

- No raw stack traces.
- No silent failure for mutations.

## 16. Micro-Interactions

Add subtle interactions:

- KPI count-up.
- Progress bars fill on first view.
- Action card completion check.
- Button press movement.
- Drawer entrance for job center.
- Toast progress updates.
- Copy success state.

Rules:

- Respect `prefers-reduced-motion`.
- No distracting loops.
- Animations should clarify state change.

## 17. Responsive Behavior

## 17.1 Mobile 375 px

Layout:

- Header copy wraps cleanly.
- Primary actions stack or become action menu.
- KPI cards become 2-column grid.
- Domain health becomes single-column.
- Action Center appears before less urgent modules.
- Tables become cards.
- Touch targets at least 44 px.

Priority order:

1. Header
2. Insight summary
3. KPI cards
4. Action Center
5. Domain Health
6. Backlink Profile
7. Recent Activity

## 17.2 Tablet 768 px

Layout:

- KPI cards remain 2 or 4 columns depending width.
- Main modules use 2-column where possible.
- Drawer widths must not cover all context unless modal is intended.

## 17.3 Desktop 1440 px+

Layout:

- Keep dashboard dense but readable.
- Avoid giant empty whitespace.
- Use 3-column balance:
  - primary analytical panel
  - action center
  - supporting context

Acceptance:

- No text overlaps.
- No clipped buttons.
- No horizontal page scroll.

## 18. Accessibility

Requirements:

- Header hierarchy is correct.
- KPI cards have accessible labels.
- Icon-only buttons have `aria-label`.
- Job drawer and modals trap focus.
- Escape closes drawers/modals.
- Focus returns to triggering button.
- Color is not the only way to show status.
- Reduced motion is honored.

## 19. Visual Design Rules

Keep:

- Light-first analytics SaaS look.
- Cool gray canvas.
- White panels.
- Violet accent.
- Black primary CTAs.
- Hairline borders.

Improve:

- Normalize panel radius.
- Normalize spacing between modules.
- Use consistent status badges.
- Use consistent metric typography.
- Add stronger active states.
- Reduce decorative gradients.
- Use meaningful icons only.

Avoid:

- Marketing hero treatment.
- Nested cards inside cards.
- Random one-off colors.
- Overly large headings inside compact panels.
- Decorative animations that do not explain state.

## 20. Search and Command Integration

Authority HQ should integrate with global search.

Search examples:

- "run audit"
- "high impact prospects"
- "broken backlinks"
- "domain health"
- "AI visibility"
- "stale pages"

Command palette actions:

- Run audit
- Acquire backlinks
- Open action center
- Export overview
- Open alerts

## 21. Export and Reporting

Add export/report affordance.

Options:

- Export dashboard CSV/JSON.
- Generate executive summary.
- Copy weekly update.

Executive summary should include:

- Domain health score.
- KPI deltas.
- Top 3 actions.
- Alerts resolved/open.
- Backlink profile summary.
- Next recommendation.

Acceptance:

- Export action produces a real artifact in demo mode.

## 22. Security and Permissions

Authority HQ must respect role permissions.

Examples:

- Analyst can view metrics but may not change settings.
- Marketer can run audit and update opportunities.
- Admin can connect integrations.
- Owner can export reports and manage billing.

Requirements:

- Hide or disable actions based on role.
- Destructive actions require confirmation.
- Export actions are audited in production mode.
- No secrets or API credentials shown in data-source hints.

## 23. API/Data Requirements

Recommended aggregate endpoint:

```text
GET /api/v1/overview/authority
```

Response:

```ts
interface AuthorityOverview {
  summary: {
    status: "improving" | "stable" | "needs-attention" | "critical";
    headline: string;
    updatedAt: ISODate;
    source: "demo" | "mock" | "dataforseo" | "search-console";
  };
  kpis: KpiMetric[];
  health: DomainHealth;
  backlinkProfile: {
    total: number;
    live: number;
    pending: number;
    lost: number;
    broken: number;
    qualityScore: number;
  };
  actions: AuthorityAction[];
  activity: ActivityEvent[];
  jobs: JobRun[];
}
```

Action type:

```ts
interface AuthorityAction {
  id: string;
  title: string;
  reason: string;
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  status: "new" | "in-progress" | "done" | "snoozed" | "failed";
  href: string;
  primaryAction: {
    label: string;
    kind: "navigate" | "job" | "mutation";
  };
}
```

## 24. Acceptance Criteria

Functional:

- Run audit works.
- Acquire backlinks works.
- KPI cards navigate to relevant detail.
- Action Center actions are functional.
- Backlink Profile links to opportunities.
- Recent Activity links to objects.
- Export/report produces artifact.

UX:

- User understands current authority status in under 10 seconds.
- User sees a clear next best action.
- All states are handled: loading, empty, error, success.
- No inert controls.

Visual:

- Screen looks premium at desktop.
- Screen is usable at 375 px mobile.
- Typography and spacing are consistent.
- No text clipping or overlap.

Performance:

- Route starts rendering quickly.
- Skeletons prevent layout shift.
- Heavy charts/details are lazy-loaded if added.
- Interactions respond immediately.

Accessibility:

- Keyboard navigation works.
- Focus states are visible.
- Reduced motion works.
- Screen reader labels are meaningful.

Security:

- Actions respect role permissions.
- Exports are audited in production.
- No secrets are displayed.

## 25. Implementation Checklist

Phase 1:

- Add insight summary band.
- Upgrade Action Center into real prioritized action cards.
- Add data freshness badge.
- Add KPI card click navigation.
- Add export/report action.
- Improve mobile ordering.

Phase 2:

- Add factor explanations in Domain Health.
- Add backlink quality score.
- Add momentum/forecast module.
- Add role-aware actions.
- Add richer job completion summaries.

Phase 3:

- Add aggregate overview endpoint.
- Add search command integration.
- Add report generation.
- Add analytics tracking for action clicks.

