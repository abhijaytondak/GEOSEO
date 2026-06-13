# PRD — Best-in-Class Global Search

GEOSEO needs a search experience that feels like a product superpower, not a
filter box. Search should let users instantly find any page, prospect, alert,
lead, content item, job, setting, or recommendation, and then take action without
breaking flow.

This PRD defines a premium, scalable, secure global search system for GEOSEO.

---

## 1. Goal

Build a best-in-class search experience across GEOSEO that helps users answer:

- What am I looking for?
- Why does it matter?
- What action should I take next?

Search should work across the full product:

- Authority HQ data
- Backlink opportunities
- Outreach drafts
- Performance pages
- Alerts
- Content recommendations
- Brand Memory
- Settings
- Page Engine opportunities
- Generated pages
- Leads
- Jobs
- Audit/activity logs

The experience should support both fast keyword lookup and higher-level natural
language intent, such as:

- "show stale pages losing rank"
- "prospects with DA over 70 in fintech"
- "alerts about broken backlinks"
- "leads from published comparison pages"
- "pages ready to publish"
- "settings for integrations"

## 2. Product Vision

Search is the command center for GEOSEO.

It should feel closer to Linear, Raycast, Superhuman, Algolia, Notion, and Stripe
Dashboard than a traditional website search box:

- Instant keyboard-first access.
- High-quality autocomplete.
- Grouped results with useful metadata.
- Fast filters and scopes.
- Recent and suggested actions.
- Natural language interpretation.
- One-click actions from results.
- Beautiful empty, loading, and error states.
- Secure tenant-scoped results.

The user should be able to press `Cmd+K`, type a thought, and get to the correct
object or action in seconds.

## 3. Success Metrics

Product metrics:

- 60%+ of weekly active users use search at least once per week.
- Median time to result click under 5 seconds.
- 80%+ successful search sessions, defined as result click, action click, or saved filter.
- Less than 10% zero-result searches after synonym/semantic expansion.
- 30%+ of power-user navigation happens through command search.

Performance metrics:

- Search overlay opens in under 100 ms.
- First suggestions render in under 150 ms using local/recent index.
- API search response p95 under 300 ms in demo mode.
- API search response p95 under 600 ms in production mode.
- Result interaction has no visible layout shift.

Quality metrics:

- Top result is relevant for 80%+ of benchmark queries.
- No cross-workspace result leakage.
- No sensitive secrets indexed or displayed.
- Mobile search usable at 375 px.

## 4. Users

### Owner / Founder

Needs quick answers about business outcomes:

- "which pages generated leads?"
- "what should I fix this week?"
- "show biggest ranking drops"
- "export performance"

### Marketer

Needs fast workflow navigation and action:

- "find outreach draft for productled.com"
- "prospects tagged editorial"
- "pages ready for review"
- "content refresh queue"

### Analyst

Needs precise lookup and filters:

- "rank drops over 5"
- "alerts resolved this week"
- "traffic down last 30 days"
- "AI visibility underperforming"

### Admin

Needs settings and operational search:

- "team member Maya"
- "Webflow integration"
- "billing"
- "jobs failed"

## 5. Scope

## 5.1 In Scope

- Global command palette launched from topbar, sidebar, and keyboard shortcut.
- Inline topbar search that routes into the same result system.
- Search results across all core GEOSEO entities.
- Scoped search by entity type.
- Natural language query parsing for common GEOSEO intents.
- Recent searches and recently opened objects.
- Suggested searches and quick actions.
- Search result actions.
- Saved searches/views for high-value filters.
- API-backed search endpoint.
- Demo-mode mock search index.
- Production-ready search abstraction.
- Security and tenant scoping.
- Analytics for search quality.

## 5.2 Out of Scope for First Release

- Full vector database implementation if production search infrastructure is not ready.
- Real cross-customer benchmarking.
- Browser history search outside GEOSEO.
- Searching private external CRM/CMS data directly unless synced into GEOSEO.
- User-generated custom ranking formulas.

## 6. Search Surfaces

## 6.1 Topbar Search

Current topbar search should be upgraded from "filter opportunities" into a
universal entry point.

Requirements:

- Placeholder: "Search pages, prospects, alerts, leads..."
- Typing opens lightweight suggestions.
- Pressing `Enter` opens full search results or navigates to top result.
- `Cmd+K` / `Ctrl+K` opens command palette.
- Recent searches appear before typing.
- On mobile, tapping search opens a full-screen search sheet.

## 6.2 Command Palette

The command palette is the primary premium search experience.

Behavior:

- Opens with `Cmd+K` / `Ctrl+K`.
- Focuses input automatically.
- Shows recent objects, suggested actions, and saved searches before typing.
- Supports keyboard navigation with arrow keys.
- `Enter` opens selected result.
- `Cmd+Enter` or secondary action runs primary action when available.
- `Esc` closes.
- Results update while typing.

Visual requirements:

- Centered desktop overlay.
- Full-screen mobile sheet.
- No page layout shift.
- Results grouped by type.
- Each result has icon, title, subtitle, metadata, status, and action hint.
- Highlight matched terms.

## 6.3 Dedicated Search Results Page

Route:

```text
/search?q=<query>&type=<scope>&sort=<sort>
```

Use when:

- Query has many results.
- User presses "View all results".
- User opens a saved search.
- User needs advanced filters.

Requirements:

- Left rail filters on desktop.
- Horizontal filter chips on mobile.
- Sort controls: relevance, newest, impact, status, type.
- Result density toggle: comfortable / compact.
- Empty state with suggested query rewrites.
- Export filtered result set where relevant.

## 7. Searchable Entity Types

## 7.1 Backlink Prospects

Fields:

- domain
- URL
- industry
- tags
- contact email
- status
- rationale
- notes
- DA
- relevance score
- impact score

Actions:

- Open detail/outreach
- Copy contact email
- Edit prospect
- Change status
- Archive
- Export

## 7.2 Outreach Drafts

Fields:

- prospect domain
- subject
- body excerpt
- variant
- saved status
- updated time

Actions:

- Open draft
- Copy subject
- Copy body
- Open mailto

## 7.3 Tracked Pages

Fields:

- title
- path
- current rank
- previous rank
- impressions
- clicks
- freshness
- content health

Actions:

- Open performance drilldown
- Queue refresh
- View content health
- Export row

## 7.4 Alerts

Fields:

- title
- description
- type
- severity
- metric
- read/resolved status
- created time

Actions:

- Open recommended action
- Mark read
- Resolve
- Snooze

## 7.5 Content Recommendations

Fields:

- page title
- reason
- decay risk
- internal-link suggestion
- action type

Actions:

- Queue refresh
- Apply internal link
- Open page

## 7.6 Brand Memory

Fields:

- company
- domain
- topics
- audience
- differentiators
- competitors
- keywords
- version notes

Actions:

- Open Brand Memory
- Copy compiled context
- View version

## 7.7 Settings

Fields:

- workspace profile
- integrations
- team members
- notifications
- billing
- publishing settings

Actions:

- Open tab
- Connect integration
- Invite team member
- Open billing

## 7.8 Page Engine Opportunities

Fields:

- keyword
- intent
- estimated traffic
- difficulty
- priority
- status
- page type

Actions:

- Approve
- Defer
- Reject
- Generate page

## 7.9 Generated Pages

Fields:

- title
- slug
- status
- SEO score
- AI visibility readiness
- publish state
- lead count

Actions:

- Edit
- Submit
- Approve
- Publish
- Rollback
- View public page

## 7.10 Leads

Fields:

- name
- email
- company
- source page
- score
- status
- spam status
- created time

Actions:

- Open lead
- Update status
- Sync to CRM
- Delete
- Export

## 7.11 Jobs

Fields:

- title
- description
- type
- status
- progress
- result
- created time

Actions:

- Open job drawer
- Retry
- Cancel
- Download artifact

## 7.12 Audit and Activity

Fields:

- actor
- action
- entity
- entity ID
- timestamp
- workspace

Actions:

- Open target object
- Filter by actor/action/entity

## 8. Query Types

## 8.1 Keyword Search

Examples:

- `productled.com`
- `webflow`
- `broken backlink`
- `Maya`
- `/feeds/ai-seo`

Behavior:

- Exact matches rank highest.
- Prefix matches rank high.
- Fuzzy matches allowed for typos.
- Synonyms expand common GEOSEO terms.

## 8.2 Structured Search

Examples:

- `status:contacted`
- `type:alert severity:critical`
- `da>70`
- `rank>10`
- `tag:editorial`
- `owner:maya`

Behavior:

- Token parser recognizes filters.
- Unknown filters are treated as text terms.
- UI converts recognized filters into chips.

## 8.3 Natural Language Search

Examples:

- "show me prospects with high authority"
- "pages losing traffic"
- "alerts I have not resolved"
- "leads from published pages"
- "content that needs refresh"

Behavior:

- First release uses deterministic intent parsing.
- Later release can use an LLM parser behind a safe adapter.
- Natural language should map to filters and sort, then show chips.

## 8.4 Action Search

Examples:

- `run audit`
- `discover prospects`
- `invite teammate`
- `connect webflow`
- `export leads`

Behavior:

- Command results appear above object results.
- Commands require permission checks.
- Destructive commands require confirmation.

## 9. Ranking Model

Search ranking should combine:

- Text relevance.
- Entity importance.
- Recency.
- User role.
- Current route context.
- Object status.
- Business impact.
- User history.

Example weighting:

```text
finalScore =
  textScore * 0.40 +
  entityBoost * 0.15 +
  recencyBoost * 0.10 +
  impactBoost * 0.15 +
  routeContextBoost * 0.10 +
  userHistoryBoost * 0.10
```

Entity boosts:

- Critical alerts boost strongly.
- High-impact prospects boost strongly.
- Pages needing approval or refresh boost strongly.
- Failed jobs boost moderately.
- Settings results boost only for admin-like queries.

Route context:

- On `/opportunities`, prospect results rank higher.
- On `/performance`, tracked pages rank higher.
- On `/settings`, settings and integrations rank higher.
- On `/pages`, generated pages and page-engine opportunities rank higher.

## 10. UX Details

## 10.1 Empty State

If no results:

- Show "No results for `<query>`".
- Suggest removing filters.
- Suggest related searches.
- Offer useful creation action when relevant:
  - Discover prospects.
  - Generate page.
  - Run audit.
  - Invite team member.

## 10.2 Loading State

Requirements:

- First local suggestions show immediately.
- API results show skeleton rows.
- Do not block typing.
- Preserve input focus.
- Never flash empty state while loading.

## 10.3 Error State

Requirements:

- Show non-alarming inline message.
- Offer retry.
- Keep recent/local results visible if possible.
- Mutating quick actions must show toast errors.

## 10.4 Recent and Suggested

Before typing, show:

- Recently opened objects.
- Recent searches.
- Suggested next actions.
- Saved searches.
- Currently active jobs.

## 10.5 Result Anatomy

Each result should include:

- Icon
- Type label
- Title
- Subtitle or excerpt
- Status badge
- Relevant metrics
- Matched term highlight
- Primary action
- Secondary action where safe

Example:

```text
[Link icon] productled.com
Backlink prospect · Product Growth · DA 74 · Impact 91 · Status: New
Action: Open outreach
```

## 11. Functional Requirements

### F1: Command Palette

Users can open global search with `Cmd+K` / `Ctrl+K`.

Acceptance:

- Works on all app routes.
- Keyboard navigation works.
- Mobile uses full-screen sheet.
- Result click closes palette and navigates.

### F2: Unified Search API

Add:

```text
GET /api/v1/search?q=&type=&limit=&offset=&sort=
```

Returns:

```ts
{
  results: SearchResult[];
  total: number;
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
  interpretedQuery?: SearchInterpretation;
}
```

Acceptance:

- Searches across all enabled entity types.
- Results are tenant-scoped.
- Supports pagination.
- Returns facets.
- Does not fallback silently for 4xx.

### F3: Search Result Actions

Search results can expose safe quick actions.

Acceptance:

- Non-destructive actions run from palette.
- Destructive actions open confirmation.
- Permission-denied actions are hidden or disabled with reason.
- Actions refresh affected UI state.

### F4: Natural Language Interpretation

Search maps common natural language phrases to filters.

Acceptance:

- "stale pages" maps to content/tracked pages with stale freshness.
- "critical alerts" maps to alert severity.
- "high authority prospects" maps to DA threshold.
- "ready to publish" maps to generated page status.

### F5: Saved Searches

Users can save useful searches.

Acceptance:

- Save current query and filters.
- Rename saved search.
- Delete saved search.
- Saved searches appear before typing and on search page.

### F6: Search Analytics

Track product-quality events.

Events:

- `search_opened`
- `search_query_changed`
- `search_result_clicked`
- `search_action_invoked`
- `search_zero_results`
- `search_saved`

Acceptance:

- No sensitive query content is logged in production unless explicitly allowed.
- Event includes result type and rank.
- Event includes workspace and role, not raw secrets.

## 12. API Types

Add to `@geoseo/types`:

```ts
export type SearchEntityType =
  | "prospect"
  | "outreach"
  | "tracked-page"
  | "alert"
  | "content"
  | "brand"
  | "setting"
  | "page-opportunity"
  | "generated-page"
  | "lead"
  | "job"
  | "audit"
  | "command";

export interface SearchResultAction {
  id: string;
  label: string;
  kind: "navigate" | "mutation" | "copy" | "download";
  href?: string;
  mutation?: {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    body?: unknown;
  };
  destructive?: boolean;
}

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  excerpt?: string;
  href?: string;
  icon?: string;
  status?: string;
  badges?: string[];
  metrics?: Array<{ label: string; value: string | number }>;
  score: number;
  updatedAt?: ISODate;
  actions: SearchResultAction[];
}

export interface SearchFacet {
  type: SearchEntityType;
  label: string;
  count: number;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  query: string;
  reason?: string;
}

export interface SearchInterpretation {
  raw: string;
  terms: string[];
  filters: Array<{ key: string; operator: string; value: string | number | boolean }>;
  intent?: "navigate" | "analyze" | "act" | "export" | "create";
}
```

## 13. Data Model

For production search, maintain a normalized search document table or index.

```ts
interface SearchDocument {
  id: string;
  workspaceId: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  subtitle?: string;
  body?: string;
  keywords: string[];
  tags: string[];
  status?: string;
  metrics: Record<string, string | number | boolean>;
  href: string;
  updatedAt: ISODate;
  visibility: {
    roles: string[];
  };
}
```

Demo mode can build this index in memory from current mock/API stores.

Production options:

- Postgres full-text search for first production release.
- pgvector semantic search for richer natural language later.
- Dedicated search provider only if scale demands it.

## 14. Frontend Architecture

Components:

- `GlobalSearchProvider`
- `CommandPalette`
- `SearchInput`
- `SearchResultsList`
- `SearchResultRow`
- `SearchFacets`
- `SavedSearches`
- `SearchEmptyState`
- `SearchActionMenu`

Hooks:

- `useGlobalSearch`
- `useRecentSearches`
- `useSavedSearches`
- `useSearchKeyboard`

Client behavior:

- Debounce API queries by 120 to 180 ms.
- Cancel stale requests.
- Keep prior results while new query loads.
- Use local recent results immediately.
- Use URL state on `/search`.

## 15. Security Requirements

Search is high-risk because it crosses entities.

Requirements:

- All results must be scoped by workspace.
- All results must be filtered by role permissions.
- Do not index secrets, tokens, API keys, raw auth headers, or private environment values.
- Do not expose hidden integration credentials.
- Avoid returning full outreach bodies unless user has permission.
- Avoid returning lead PII to roles that should not see leads.
- Audit sensitive search actions, especially export and delete actions.
- Rate-limit search endpoint.
- Validate query length and filter syntax.
- Cap result limit.

Production defaults:

- Max query length: 256 characters.
- Max limit: 50.
- Default limit: 10 in palette, 25 on search page.
- Minimum debounce: 120 ms.
- Rate limit: per user/workspace/IP.

## 16. Performance Requirements

Frontend:

- Palette opens under 100 ms.
- No heavy search libraries in the initial app shell unless necessary.
- Lazy-load advanced search page components.
- Result rows use stable height.
- Virtualize result list only when needed.

Backend:

- Use indexed fields for entity type, workspace, updated time, status.
- Cache top suggestions per workspace.
- Use pagination for all results.
- Avoid scanning every table synchronously in production.
- Demo mode may aggregate in memory.

## 17. Visual Design Requirements

Search should feel premium and sharp.

Design:

- Floating command surface with strong focus ring and soft shadow.
- White panel on cool gray overlay.
- Violet accent for active result and highlights.
- Black primary action hint.
- Hairline dividers.
- Compact but readable rows.
- Type badges with consistent iconography.
- Search term highlights should be subtle, not neon.

States:

- Initial state: recent and suggested.
- Loading: skeleton rows.
- Empty: helpful rewrite suggestions.
- Error: inline retry.
- Action success: toast plus row update.

Mobile:

- Full-height sheet.
- Input fixed at top.
- Results scroll independently.
- Touch targets at least 44 px.

## 18. Accessibility Requirements

- `Cmd+K` / `Ctrl+K` announced in visible help where appropriate.
- Dialog has accessible title and description.
- Search input has clear accessible label.
- Results use `role="listbox"` or an accessible command menu pattern.
- Active result is announced.
- Keyboard navigation works.
- Escape closes.
- Focus returns to trigger.
- Icon-only actions have labels.
- Reduced motion disables nonessential animation.

## 19. Analytics and Evaluation

Create a search quality benchmark file with representative queries.

Example benchmark queries:

- `productled.com`
- `critical alerts`
- `stale pages`
- `ready to publish`
- `high DA SaaS prospects`
- `Maya`
- `webflow integration`
- `failed jobs`
- `leads from comparison pages`
- `AI visibility`

Evaluate:

- Top result relevance.
- Result group relevance.
- Zero-result rate.
- Time to first result.
- Action completion.

## 20. Milestones

### Phase 1 — Premium Demo Search

Deliver:

- Command palette.
- Unified mock-backed search endpoint.
- Search across prospects, pages, alerts, settings, content, leads, jobs.
- Recent searches.
- Suggested actions.
- Basic filters.
- Keyboard navigation.

Acceptance:

- `Cmd+K` works on every route.
- Topbar search uses global search.
- No cross-workspace concerns in demo mode.
- Search feels instant on seed data.

### Phase 2 — Search Actions and Saved Views

Deliver:

- Quick actions from results.
- Saved searches.
- Dedicated `/search` page.
- CSV export for filtered result sets.
- Search analytics events.

Acceptance:

- Users can act without leaving search for safe actions.
- Saved searches appear in command palette.
- Search page supports filters and pagination.

### Phase 3 — Production Search Foundation

Deliver:

- Tenant-scoped repository-backed index.
- RBAC enforcement.
- Full-text search.
- Rate limiting.
- Audit logging.
- Search quality benchmark suite.

Acceptance:

- No result leaks across workspaces or roles.
- Search p95 meets performance targets.
- Benchmark relevance exceeds threshold.

### Phase 4 — Semantic and AI-Assisted Search

Deliver:

- Natural language parser adapter.
- Optional pgvector semantic ranking.
- "Explain this result" or "Why did this match?"
- Smart query rewrite suggestions.

Acceptance:

- Natural language queries map to visible filters.
- Semantic search improves benchmark score without reducing precision.

## 21. Implementation Notes

Immediate code changes:

1. Replace topbar route-only search with global search trigger.
2. Add `SearchEntityType`, `SearchResult`, `SearchFacet`, and related types.
3. Add `SearchController` and `SearchService`.
4. Build demo search index from current mock/API stores.
5. Add `api.search()` and search action clients.
6. Add `CommandPalette` to app layout.
7. Add `/search` route.
8. Add saved/recent search local state for demo mode.
9. Add keyboard shortcut handling.
10. Add Browser QA for desktop and mobile.

## 22. Acceptance Checklist

Functional:

- Search opens with `Cmd+K`.
- Search opens from topbar.
- Search works on mobile.
- Results appear grouped by type.
- Results navigate correctly.
- Actions work and show success/error.
- Empty state gives useful suggestions.
- Saved searches work.
- Recent searches work.

Performance:

- Palette opens under 100 ms.
- Results render under 150 ms in demo mode.
- API p95 under 300 ms in demo mode.
- No layout shift.

Security:

- No secrets searchable.
- Results are workspace-scoped.
- Actions obey role permissions.
- Query length capped.
- Endpoint rate-limited in production mode.

Quality:

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm build` passes cleanly.
- Browser QA passes on `/`, `/opportunities`, `/performance`, `/alerts`, `/content`, `/pages`, `/leads`, `/settings`, and `/search`.

