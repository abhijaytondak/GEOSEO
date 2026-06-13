# PRD — Backlink Opportunities UI/UX

Screen:

```text
Backlinks
Backlink Opportunities
High-authority, topically relevant prospects ranked by impact — ready for outreach.
```

Backlink Opportunities is where GEOSEO turns authority strategy into action.
It should help users discover the right prospects, understand why they matter,
prioritize outreach, manage prospect state, and move from opportunity to draft
without friction.

This page must feel like a premium sales/SEO operations queue: focused, fast,
ranked by impact, and easy to act on.

---

## 1. Goal

Create a best-in-class prospecting and outreach workspace for backlink acquisition.

The user should be able to:

- See the best backlink prospects immediately.
- Understand why each prospect is recommended.
- Filter and sort by quality, relevance, status, and tags.
- Edit prospect metadata.
- Open or save outreach drafts.
- Archive, reject, or advance prospects.
- Export useful data.
- Discover more prospects.

## 2. Product Promise

This page should not feel like a static table. It should feel like an intelligent
backlink acquisition pipeline.

The page should answer:

- Which opportunities are worth my time?
- Why are they relevant?
- What is the next action?
- Who should I contact?
- What outreach should I send?
- What progress have we made?

## 3. Target Users

### Founder / Owner

Needs confidence that GEOSEO is finding credible backlink opportunities.

Key needs:

- See quality and expected impact.
- Export or report progress.
- Understand pipeline health.

### Marketer / Growth Operator

Needs to work the queue every day.

Key needs:

- Filter prospects.
- Update status.
- Edit contact info.
- Open outreach drafts.
- Copy emails/messages.
- Archive low-fit results.

### Agency User

Needs high-volume workflow and reporting.

Key needs:

- Bulk actions.
- Client-ready export.
- Notes/tags.
- Clear status history.

## 4. First Viewport Requirements

The first viewport must include:

- Page identity: `Backlinks / Backlink Opportunities`.
- Value statement.
- Primary actions:
  - `Discover more`
  - `Export`
- KPI strip:
  - total prospects
  - high-impact prospects
  - average authority
  - combined reach
- Search/filter toolbar.
- The first few ranked prospects.

The user should not need to scroll to understand the queue.

## 5. Page Structure

Recommended layout:

```text
Header
  Backlinks / Backlink Opportunities
  Page description
  Export
  Discover more

Pipeline Summary
  Prospects
  High-impact
  Avg authority
  Combined reach
  Contacted / replied / acquired

Toolbar
  Search
  Status filters
  Sort controls
  Advanced filters
  Bulk actions

Prospect Workspace
  Desktop: table with sticky action zone
  Mobile: stacked prospect cards

Details / Outreach Drawer
  Prospect details
  Scoring explanation
  Metadata edit
  Outreach variants
  Activity/notes

Footer / Empty States
  Suggested discovery seeds
  Import/export affordances
```

## 6. Header Actions

## 6.1 Discover More

Behavior:

- Starts a prospect discovery job.
- Adds or surfaces new prospects.
- Opens job drawer or progress toast.
- Highlights new prospects after completion.

States:

- Idle
- Discovering
- Completed
- Failed

Acceptance:

- Newly discovered prospects appear in the list.
- Newly discovered prospects can open outreach drafts immediately.
- User sees what changed after discovery.

## 6.2 Export

Behavior:

- Exports current filtered list.
- Starts an export job if needed.
- Downloads CSV in demo mode.
- Includes applied filters in filename or metadata.

CSV fields:

- domain
- URL
- DA
- relevance score
- impact score
- traffic estimate
- industry
- tags
- status
- contact email
- notes
- last interaction
- rationale

Acceptance:

- Click export creates a real downloadable file.
- Toast confirms row count.
- Empty export is handled gracefully.

## 7. Pipeline Summary

Summary cards should help users understand pipeline health.

Required metrics:

- Total prospects.
- High-impact prospects.
- Average domain authority.
- Combined reach.
- Contacted.
- Replied.
- Acquired.
- Rejected/archived.

Visual rules:

- Use compact metric cards.
- Use tabular numerals.
- Avoid oversized decorative cards.
- Include small trend or status hint where helpful.

Interaction:

- Clicking a metric applies the relevant filter.

Acceptance:

- Summary cards are connected to the queue, not decorative.

## 8. Toolbar UX

## 8.1 Search

Search across:

- domain
- URL
- industry
- tags
- contact email
- notes
- rationale

Behavior:

- Instant client filtering for loaded results.
- Server-backed query once production list grows.
- Empty state includes reset action.

## 8.2 Status Filters

Statuses:

- All
- New
- Contacted
- Replied
- Acquired
- Rejected
- Archived

Requirements:

- Filters show counts.
- Active filter is visually obvious.
- Mobile filters scroll horizontally.

## 8.3 Sort Controls

Sort by:

- Impact
- Domain authority
- Relevance
- Traffic
- Last interaction
- Status

Requirements:

- Sort direction toggle.
- Current sort clearly labeled.
- Default sort: impact descending.

## 8.4 Advanced Filters

Filters:

- Minimum DA
- Minimum relevance
- Minimum impact
- Industry
- Tags
- Has contact email
- No notes
- Recently discovered
- Needs outreach

Behavior:

- Advanced filters open in popover/drawer.
- Applied filters become removable chips.
- Reset all button is always available.

## 8.5 Bulk Actions

Enabled when rows are selected.

Actions:

- Change status.
- Add tag.
- Export selected.
- Archive selected.
- Assign owner later.

Rules:

- Destructive bulk actions require confirmation.
- Bulk actions show count.

## 9. Prospect List

## 9.1 Desktop Table

Columns:

- Selection checkbox
- Prospect
- DA
- Relevance
- Impact
- Traffic
- Status
- Last interaction
- Actions

Prospect cell:

- domain
- industry
- top tags
- rationale preview

Action zone:

- Open site
- Copy email
- Change status
- Outreach
- Edit
- Archive

Requirements:

- Sticky action column or action zone remains easy to reach.
- Table supports horizontal overflow if needed, but mobile should use cards.
- Rows have hover/focus states.
- Keyboard row navigation should be possible.

## 9.2 Mobile Cards

Mobile card fields:

- domain
- status badge
- DA / relevance / impact
- industry and tags
- rationale
- primary action: Outreach
- secondary actions: Copy email, Edit, Archive

Requirements:

- Touch targets at least 44 px.
- No clipped text.
- Cards are scannable.
- Status controls are not tiny.

## 10. Prospect Detail Drawer

Opening a prospect should show a detail drawer.

Sections:

- Summary
- Score breakdown
- Contact
- Tags and notes
- Activity history
- Outreach drafts
- Related pages/topics

## 10.1 Summary

Show:

- domain
- URL
- industry
- status
- DA
- relevance
- impact
- traffic estimate
- rationale

## 10.2 Score Breakdown

Explain impact score:

- authority contribution
- topical relevance
- traffic estimate
- competitor gap
- contact confidence

Example:

```text
High impact because the domain has strong authority, overlaps with AI SEO topics,
and competitors have earned links from similar publications.
```

## 10.3 Metadata Editing

Editable fields:

- status
- contact email
- tags
- notes
- last interaction

Requirements:

- Save button with idle/saving/saved/error states.
- Optimistic update with rollback.
- Validation for email.
- Notes support multiline text.

Acceptance:

- User can edit contact, tags, notes, and status.
- Refresh preserves state in current storage mode.

## 10.4 Activity History

Events:

- discovered
- status changed
- draft opened
- draft saved
- email copied
- archived
- rejected
- acquired

Acceptance:

- User can understand what happened with a prospect.

## 11. Outreach Drawer

The outreach experience can be part of the detail drawer or a nested tab.

Requirements:

- Load drafts for every valid prospect, including newly discovered prospects.
- Show draft variants.
- Edit subject and body.
- Save draft.
- Copy subject.
- Copy body.
- Open mailto.
- Show Brand Memory source.
- Show missing contact warning if no email exists.

States:

- Drafting/loading.
- Loaded.
- Save success.
- Save failure.
- No contact email.
- Prospect archived.

Acceptance:

- Discover prospect -> open outreach -> save draft works end-to-end.

## 12. Status Workflow

Statuses:

```text
new -> contacted -> replied -> acquired
new -> rejected
any active -> archived
archived -> restore
```

Rules:

- Status changes should be explicit, not only cyclic.
- "Reject" and "Archive" are different:
  - reject means bad fit
  - archive means hide/remove from active queue
- Acquired should update Authority HQ backlink momentum.

Acceptance:

- User can set a specific status directly.
- Status history is recorded.

## 13. Empty States

## 13.1 No Prospects Yet

Message:

```text
Discover your first backlink opportunities by adding seed topics or running an audit.
```

Actions:

- Discover prospects.
- Run audit.
- Add seed topics.

## 13.2 No Filter Matches

Message:

```text
No prospects match these filters.
```

Actions:

- Reset filters.
- Discover more.
- Save search later.

## 13.3 No Contact Email

Message:

```text
No contact email yet. Add one manually or mark this prospect for research.
```

Actions:

- Add email.
- Copy domain.
- Mark needs research.

## 14. Loading and Error States

Loading:

- Skeleton KPI cards.
- Skeleton toolbar.
- Skeleton rows/cards.
- Drawer skeleton for drafts.

Error:

- Inline retry.
- Toast for mutation failure.
- Preserve last known data when possible.
- Never show raw stack traces.

Acceptance:

- Slow API does not produce layout jump.
- Failed mutation rolls back optimistic state.

## 15. Micro-Interactions

Add:

- Row hover lift or highlight.
- Status badge transition.
- Copy email checkmark.
- Save draft success state.
- Discover job progress.
- New prospect highlight pulse.
- Drawer slide transition.
- Bulk action bar slide in.

Rules:

- Honor `prefers-reduced-motion`.
- Keep motion subtle and useful.

## 16. Visual Design

Keep:

- Light-first analytics SaaS.
- White panels.
- Cool gray canvas.
- Violet accent.
- Black primary CTA.
- Hairline borders.

Improve:

- Stronger active filters.
- More legible status badges.
- Better score bars.
- Consistent icon buttons with tooltips.
- Better distinction between active, rejected, and archived prospects.

Avoid:

- Crowded action columns.
- Hidden destructive actions without confirmation.
- Overly decorative gradients.
- Table-only mobile UX.

## 17. Search Integration

Global search should find prospects by:

- domain
- tag
- industry
- status
- contact email
- note

Command examples:

- "high impact prospects"
- "new SaaS prospects"
- "contacted but no reply"
- "archive productled.com"
- "draft outreach for martechseries"

Search result actions:

- Open prospect.
- Open outreach.
- Copy email.
- Change status.

## 18. Reporting

Add a report/export path.

Report summary:

- total prospects
- high-impact prospects
- contacted/replied/acquired counts
- top industries
- best opportunities
- archived/rejected count
- next recommended actions

Acceptance:

- User can export a credible CSV for sales/demo.
- Later: generate executive summary.

## 19. Permissions and Security

Role behavior:

- Owner/admin: all actions.
- Marketer: discover, edit, outreach, status, export.
- Analyst: read and export only if allowed.

Security requirements:

- Prospect exports are audited in production.
- Email/contact fields are not exposed to unauthorized roles.
- Destructive actions require confirmation.
- Query/filter inputs are validated.
- No secrets or API keys appear in notes or exports.

## 20. API/Data Requirements

Existing endpoints:

```text
GET /api/v1/backlink/opportunities
POST /api/v1/backlink/opportunities/discover
PATCH /api/v1/backlink/opportunities/:id
DELETE /api/v1/backlink/opportunities/:id
GET /api/v1/outreach/templates?prospectId=
PUT /api/v1/outreach/templates/:id
POST /api/v1/jobs
```

Recommended additions:

```text
POST /api/v1/backlink/opportunities/export
POST /api/v1/backlink/opportunities/bulk
POST /api/v1/backlink/opportunities/:id/restore
GET /api/v1/backlink/opportunities/:id/activity
POST /api/v1/backlink/opportunities/:id/activity
```

Types:

```ts
interface ProspectActivity {
  id: string;
  prospectId: string;
  kind:
    | "discovered"
    | "status-changed"
    | "draft-opened"
    | "draft-saved"
    | "email-copied"
    | "archived"
    | "rejected"
    | "acquired"
    | "note-added";
  message: string;
  actor: string;
  at: ISODate;
}

interface ProspectExport {
  id: string;
  filename: string;
  rowCount: number;
  downloadUrl?: string;
  csv?: string;
}
```

## 21. Performance Requirements

Targets:

- Page interactive quickly on seed data.
- Filtering under 50 ms for demo-sized lists.
- API search/filter under 300 ms p95 in demo.
- Drawer opens under 150 ms after data is available.
- No layout shift from loading to loaded rows.

Implementation:

- Memoize filtered/sorted list.
- Debounce search if server-backed.
- Paginate server list in production.
- Avoid importing large mock fixtures into heavy client components.
- Use responsive card layout instead of forcing huge tables on mobile.

## 22. Accessibility

Requirements:

- Table headers are semantic.
- Row actions have accessible names.
- Drawer has title and focus trap.
- Confirmation dialogs are keyboard accessible.
- Status is not communicated by color only.
- Focus visible on all controls.
- Bulk action selection is screen-reader understandable.
- Reduced motion respected.

## 23. Acceptance Criteria

Functional:

- Discover more creates/surfaces a prospect.
- Newly discovered prospect can open outreach.
- Export downloads real CSV.
- Search/filter/sort work.
- Status can be set directly.
- Contact, tags, notes can be edited.
- Archive/reject/restore behavior is clear.
- Empty/loading/error states exist.

UX:

- User can identify top opportunities in under 10 seconds.
- User can open an outreach draft in under 3 clicks.
- User can update a prospect without losing context.
- Mobile view is usable and not table-dependent.

Visual:

- Looks premium and consistent with Authority HQ.
- Badges, score bars, actions, and panels are normalized.
- No clipped text at 375 px.

Security:

- Role permissions respected.
- Destructive actions confirmed.
- Export is auditable in production.

Performance:

- No sluggish filters on demo data.
- No layout jump from skeletons.
- No unnecessary client bundle bloat.

## 24. Implementation Checklist

Phase 1:

- Fix discovered prospect outreach lookup.
- Add prospect detail/edit drawer.
- Add direct status picker.
- Add contact/tags/notes editing.
- Add CSV export.
- Add new-prospect highlight after discovery.

Phase 2:

- Add mobile card list.
- Add advanced filters.
- Add bulk actions.
- Add confirmation dialogs.
- Add activity history.

Phase 3:

- Add prospect export endpoint.
- Add restore archived prospect.
- Add saved filters/search views.
- Add reporting summary.
- Add role-aware action gating.

