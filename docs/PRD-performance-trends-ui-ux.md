# PRD — Performance Trends UI/UX

Screen:

```text
Analytics
Performance Trends
Ranking momentum, search traffic, and AI-answer visibility across your tracked pages.
```

Performance Trends is the analytics center for GEOSEO. It should help users
understand whether authority work and content work are improving rankings,
traffic, clicks, and AI visibility.

This page must feel precise, fast, trustworthy, and action-oriented.

---

## 1. Goal

Create a best-in-class analytics page for SEO and AI-search performance.

The user should be able to:

- Understand ranking movement.
- See search traffic trends.
- Compare impressions, clicks, CTR, and average rank.
- Identify pages gaining or losing momentum.
- Understand AI-answer visibility.
- Drill into tracked pages.
- Export a useful report.
- Take action when performance drops.

## 2. Product Promise

Performance Trends should not be a passive chart page. It should explain what
changed, why it matters, and what to do next.

The page should answer:

- Are rankings improving?
- Is traffic growing?
- Which pages are causing the change?
- Are AI search engines mentioning us?
- Which trend needs action now?
- What should we export or report?

## 3. Target Users

### Owner / Founder

Needs business-level clarity:

- "Are we getting more visibility?"
- "Is GEOSEO creating measurable progress?"
- "What changed this month?"

### Marketer

Needs workflow clarity:

- "Which pages are slipping?"
- "What should I refresh?"
- "Which keywords/pages are improving?"

### Analyst

Needs precise trend exploration:

- Date range control.
- Page drilldowns.
- Sortable tracked page table.
- Exportable data.
- Metric definitions.

## 4. First Viewport Requirements

The first viewport must include:

- Page identity: `Analytics / Performance Trends`.
- Description.
- Date range control.
- Export action.
- KPI strip:
  - average rank
  - impressions
  - clicks
  - average CTR
- At least one primary chart visible or partially visible.

The user should understand current performance without scrolling deeply.

## 5. Page Structure

Recommended layout:

```text
Header
  Analytics / Performance Trends
  Date range
  Export

Insight Summary Band
  Performance summary
  Data freshness
  Biggest mover

KPI Strip
  Avg rank
  Impressions
  Clicks
  Avg CTR

Primary Charts
  Average Ranking
  Search Traffic

Secondary Panels
  AI Search Visibility
  Tracked Pages

Drilldown Drawer
  Page details
  Rank chart
  Traffic chart
  AI visibility
  Recommended actions

Report / Export
  CSV
  JSON
  Executive summary
```

## 6. Header Actions

## 6.1 Date Range

Supported ranges:

- Last 7 days
- Last 30 days
- Last 8 weeks
- Last quarter
- Last 6 months
- Custom range later

Behavior:

- Changing date range updates charts, KPIs, and tracked page data.
- Active range is visible.
- Loading state keeps previous data until new data loads.
- URL may preserve selected range.

Acceptance:

- Date range is not just a toast; it changes the displayed data or query state.

## 6.2 Export

Behavior:

- Exports current date range and filters.
- Downloads CSV or JSON in demo mode.
- Can start an export job for larger reports.

Export should include:

- date range
- rank series
- impression/click series
- AI visibility summary
- tracked page rows
- top movers

Acceptance:

- Export button produces a real artifact.
- Toast confirms filename and row count/series count.

## 7. Insight Summary Band

Add a summary band above KPI cards.

Purpose:

- Translate analytics into plain language.
- Tell the user what changed.

Example:

```text
Average rank improved by 3 positions while impressions rose 12%.
Two pages are losing clicks and should be refreshed this week.
```

Required fields:

- Trend status: improving, stable, declining, mixed.
- Human-readable summary.
- Biggest positive mover.
- Biggest negative mover.
- Data freshness.

Acceptance:

- Summary is derived from metrics.
- Summary links to affected pages where possible.

## 8. KPI Strip

KPI cards:

- Average rank
- Impressions
- Clicks
- Average CTR

Each card should include:

- Current value.
- Delta vs previous period.
- Mini sparkline.
- Caption explaining period.
- Tooltip with metric definition.

Metric definitions:

- Average rank: mean tracked page search position. Lower is better.
- Impressions: times tracked pages appeared in search.
- Clicks: search clicks to tracked pages.
- CTR: clicks divided by impressions.

Interactions:

- Clicking KPI filters or highlights relevant chart.
- Hover/focus shows definition and data source.

Acceptance:

- User understands whether up/down is good for each metric.
- Cards are stable and readable on mobile.

## 9. Average Ranking Chart

Purpose:

- Show ranking momentum over time.

Requirements:

- Line chart.
- Lower rank values should be visually interpreted as better.
- Include previous period comparison later.
- Tooltip shows date and average rank.
- Annotate meaningful changes:
  - audit run
  - content refresh
  - backlink acquired
  - ranking drop alert

States:

- Loading skeleton.
- Empty data.
- Error with retry.

Acceptance:

- Chart is readable at desktop and mobile.
- User can tell improvement vs decline.

## 10. Search Traffic Chart

Purpose:

- Show impressions and clicks over time.

Requirements:

- Dual-series chart.
- Tooltip shows impressions, clicks, and CTR.
- Legend is clickable to hide/show series.
- Highlight significant spikes/drops.

Acceptance:

- User can see traffic trend and click quality.

## 11. AI Search Visibility Panel

Purpose:

- Show whether GEOSEO is visible in AI-answer engines.

Engines:

- ChatGPT
- Perplexity
- Gemini
- Google AI

Fields:

- mentions
- share of voice
- delta
- top cited pages later
- competitor comparison later

Interactions:

- Click engine to filter or open detail.
- Tooltip explains how AI visibility is calculated.

Acceptance:

- User can understand AI visibility without prior SEO expertise.

## 12. Tracked Pages Table

Tracked Pages is the action bridge from analytics to optimization.

Columns:

- Page title/path
- Current rank
- Previous rank
- Rank change
- Impressions
- Clicks
- CTR
- AI mentions
- Health/status
- Action

Actions:

- Open drilldown.
- Queue content refresh.
- Open Content page.
- Export row.

Sort by:

- rank change
- current rank
- impressions
- clicks
- CTR
- AI mentions

Filters:

- gaining
- slipping
- high impressions
- low CTR
- AI underperforming
- needs refresh

Acceptance:

- User can identify pages causing KPI movement.
- Clicking a row opens a useful drilldown.

## 13. Page Drilldown Drawer

Clicking a tracked page opens a drawer.

Sections:

- Page summary
- Rank history
- Traffic history
- AI visibility
- Related alerts
- Recommended actions

Recommended actions:

- Refresh content.
- Apply internal links.
- Investigate rank drop.
- View public/generated page.
- Create backlink campaign for page.

Acceptance:

- Drilldown provides enough context to act without leaving the page.
- Actions are functional or route to the correct workflow.

## 14. Trend Annotations

Charts should show meaningful events.

Annotation types:

- audit completed
- content refresh queued/completed
- backlink acquired
- alert created/resolved
- internal links applied
- page published

Acceptance:

- User can connect actions to outcomes.
- Annotation click opens related object/job.

## 15. Empty States

## 15.1 No Analytics Yet

Message:

```text
Run an audit or publish tracked pages to start collecting performance trends.
```

Actions:

- Run audit.
- Open Pages.
- Discover opportunities.

## 15.2 No Results After Filters

Message:

```text
No tracked pages match these filters.
```

Actions:

- Reset filters.
- Change date range.

## 16. Loading and Error States

Loading:

- KPI skeletons.
- Chart skeletons with fixed height.
- Table skeleton rows.
- Drawer skeleton.

Error:

- Keep previous data if available.
- Show inline retry.
- Explain if data source is unavailable.
- Avoid raw stack traces.

Acceptance:

- Page never appears broken or blank.

## 17. Micro-Interactions

Add:

- KPI value transition.
- Chart hover crosshair.
- Tooltip fade.
- Row hover/focus highlight.
- Drawer slide.
- Export progress toast.
- Filter chip animation.

Rules:

- Honor `prefers-reduced-motion`.
- Keep animations subtle and analytical.

## 18. Visual Design

Keep:

- Light analytics SaaS.
- White panels.
- Cool gray canvas.
- Violet accent.
- Black primary CTAs.
- Hairline borders.

Improve:

- Chart readability.
- Tooltip polish.
- Metric definitions.
- Active date range state.
- Status badges for page health.
- Consistent panel spacing with Authority HQ and Backlink Opportunities.

Avoid:

- Overly decorative charts.
- Dense legends that wrap awkwardly.
- Tables that break mobile.
- Unlabeled trend direction.

## 19. Responsive Behavior

## 19.1 Mobile 375 px

Order:

1. Header
2. Date range/export actions
3. Insight summary
4. KPI cards
5. Primary chart tabs
6. AI visibility
7. Tracked page cards

Rules:

- Charts use horizontal-safe layout.
- Table becomes cards.
- Drawer becomes full-screen sheet.
- Touch targets at least 44 px.

## 19.2 Tablet 768 px

Rules:

- KPI cards 2-column or 4-column depending width.
- Charts stack or use 2-column if readable.
- Tracked pages remains compact but not cramped.

## 19.3 Desktop 1440 px+

Rules:

- Charts can sit side by side.
- AI visibility and tracked pages can use 3-column layout.
- Avoid empty whitespace.

## 20. Search Integration

Global search should find analytics objects.

Search examples:

- "pages losing rank"
- "low CTR pages"
- "AI visibility"
- "rank drops"
- "impressions last month"
- "refresh pages with declining clicks"

Search result actions:

- Open tracked page drilldown.
- Queue refresh.
- Export report.
- Open AI visibility panel.

## 21. Reporting

Reports should be easy to produce.

Export options:

- CSV performance data.
- JSON raw series.
- Executive summary.
- Later: PDF report.

Executive summary includes:

- date range
- KPI deltas
- top gaining pages
- top slipping pages
- AI visibility summary
- recommended next actions

Acceptance:

- Export reflects selected date range and filters.

## 22. Permissions and Security

Role behavior:

- Owner/admin: view, export, run audit, refresh.
- Marketer: view, export, refresh.
- Analyst: view, export if allowed.

Security:

- Exports are audited in production.
- Data is workspace-scoped.
- Query params are validated.
- No provider credentials shown in UI.
- No cross-workspace analytics leakage.

## 23. API/Data Requirements

Existing endpoints:

```text
GET /api/v1/performance/rank-series
GET /api/v1/performance/impression-series
GET /api/v1/performance/ai-visibility
GET /api/v1/performance/pages
GET /api/v1/performance/pages/:id
POST /api/v1/jobs
```

Recommended aggregate endpoint:

```text
GET /api/v1/performance/overview?range=30d
```

Response:

```ts
interface PerformanceOverview {
  summary: {
    status: "improving" | "stable" | "declining" | "mixed";
    headline: string;
    updatedAt: ISODate;
    source: "demo" | "mock" | "search-console" | "dataforseo";
  };
  kpis: {
    avgRank: MetricSummary;
    impressions: MetricSummary;
    clicks: MetricSummary;
    ctr: MetricSummary;
  };
  rankSeries: RankPoint[];
  impressionSeries: ImpressionPoint[];
  aiVisibility: AiVisibilitySignal[];
  trackedPages: TrackedPagePerformance[];
  annotations: PerformanceAnnotation[];
}
```

Supporting types:

```ts
interface MetricSummary {
  value: number;
  deltaPct: number;
  direction: "up" | "down" | "flat";
  goodWhen: "up" | "down";
  spark: number[];
}

interface TrackedPagePerformance {
  id: string;
  path: string;
  title: string;
  currentRank: number;
  prevRank: number;
  impressions: number;
  clicks: number;
  ctr: number;
  aiMentions: number;
  status: "gaining" | "stable" | "slipping" | "needs-refresh";
}

interface PerformanceAnnotation {
  id: string;
  date: ISODate;
  type: "audit" | "content-refresh" | "backlink" | "alert" | "internal-link" | "publish";
  label: string;
  href?: string;
}
```

Recommended export endpoint:

```text
POST /api/v1/performance/export
```

Body:

```ts
{
  range: string;
  filters?: Record<string, string | number | boolean>;
  format: "csv" | "json";
}
```

## 24. Performance Requirements

Targets:

- Page route renders quickly with skeletons.
- Chart components are dynamically loaded where practical.
- Date range changes feel instant.
- Filtering tracked pages under 50 ms on demo data.
- API p95 under 300 ms in demo mode.

Implementation:

- Keep page-level data loading in Server Components.
- Dynamically import chart-heavy client components.
- Memoize tracked page filters and derived metrics.
- Use stable chart heights.
- Avoid large mock imports in client components.

## 25. Accessibility

Requirements:

- Charts have accessible summaries.
- KPI cards have metric labels and deltas for screen readers.
- Tooltips are not the only source of information.
- Date range control is keyboard accessible.
- Table/card rows are keyboard focusable.
- Drawer traps focus.
- Reduced motion respected.

## 26. Acceptance Criteria

Functional:

- Date range changes data/query state.
- Export downloads real artifact.
- KPI cards show deltas and definitions.
- Charts render correctly.
- Tracked page drilldown works.
- Refresh action routes or queues job.
- Empty/loading/error states exist.

UX:

- User understands trend direction in under 10 seconds.
- User can identify top slipping pages.
- User can drill into a page in one click.
- Mobile view is usable without table pinch-zoom.

Visual:

- Charts are clean and legible.
- Panels match the rest of GEOSEO.
- No clipped labels at 375 px.
- Tooltips feel premium.

Performance:

- No slow chart bundle blocking initial page.
- No layout shift from charts.
- Filters feel instant.

Security:

- Exports are role-aware.
- Analytics are tenant-scoped.
- No secrets shown.

## 27. Implementation Checklist

Phase 1:

- Add real date range state.
- Add real CSV/JSON export.
- Add insight summary band.
- Add KPI definitions/tooltips.
- Improve tracked page drilldown.
- Add mobile tracked-page cards.

Phase 2:

- Add chart annotations.
- Add page status filters.
- Add recommended actions in drilldown.
- Dynamically load chart components.
- Add accessible chart summaries.

Phase 3:

- Add aggregate performance overview endpoint.
- Add performance export endpoint.
- Add report summary.
- Add search integration.
- Add role-aware export gating.

