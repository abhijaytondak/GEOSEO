# Dashboard SaaS — UI Reference

Distilled from Dribbble collection `AbhijayRajput/dashboard` (14 shots), tuned for an
**analytics / data-heavy** SaaS dashboard. Light-first, one bold accent, data-dense.

Source screenshots: `/tmp/dribbble_analysis/01-finerdx.png … 14-restaurant.png`
Anchor references: **04 Shopeers** (cleanest analytics skeleton) · **11 Aigentic** (aurora-banner premium flourish).

---

## House style (the non-negotiables)

1. **Light-first, single accent.** Cool-gray canvas, white cards, one saturated accent for data + CTAs.
2. **Hairline borders over shadows.** `1px #ECECEF` does the separation work; shadows are whisper-soft.
3. **Skeleton:** left sidebar (232px) → KPI strip (3–4 cards) → chart grid → tables/lists.
4. **KPI cards** = tiny uppercase label → big number → delta chip (`↑8.2%` green / `↓` red).
5. **Chart variety in one view** = area + bar + donut + gauge reads as "serious analytics."
6. **Signature flourish:** a low-saturation gradient "aurora" banner behind the dashboard header.
7. **Primary CTA = black pill** (`#14161A`) for max contrast against the low-sat UI.

---

## Pattern taxonomy

| Cluster | Shots | Identifiers |
|---|---|---|
| Clean light analytics (dominant DNA) | 01, 04, 05, 06 | Near-white page, sidebar, KPI row, mixed charts, hairline white cards |
| Decorative-banner dashboards | 07, 11, 12, 14 | Soft gradient aurora banner inside the dashboard header |
| Data-table heavy / ops | 08–10, 12, 13 | Dense sortable tables, status pills, pagination, avatar stacks |
| Premium dark | 13 | Near-black canvas, glassy cards, General Sans, isometric mockups |
| Marketing / gradient-forward | 02, 03 | Iridescent 3D art, bold black headline, gradient KPI hero |

---

## Component library (codeable specs)

### Sidebar nav — ref 04 / 11
- ~232px, white, full height. Icon (20px, 1.75 stroke) + 14px label.
- Active item: accent-tinted fill (`accent @ 8%`) + accent icon + optional 3px left bar.
- Idle: muted gray. Group headers: 11px uppercase muted.
- Pinned dark promo/upgrade card at the bottom (04, 14).

### KPI stat card — ref 04
- White · radius 16 · hairline border · 20px pad.
- Structure: 11px uppercase label → 30px/600 number → delta chip + "vs last month" muted.
- Delta chip: pill, `color @ 10%` bg, solid `color` text, leading arrow.
- Optional corner sparkline / mini-bar. Row of 3–4.

### Charts — the strength is variety
- **Area/line:** gradient fill `accent 18% → 0`, 2px smooth stroke, dotted grid, hover dot. (01,04,06,14)
- **Bars:** grouped/stacked, 4px rounded tops, 2–3 hue palette. (05)
- **Donut:** thin 12px ring, bold center value (`$399`, `68%`). (07,04,13)
- **Radial gauge:** gradient stroke amber→red or single accent. (01,03,04)
- **Choropleth** for geo revenue (03); **calendar heatmap** amber (06).

### Data table — ref 12 / 13
- Sunken header row, 11px uppercase muted headers.
- 14px rows, ~44px height, hairline dividers.
- Status pills, avatar+name cell, right-aligned numerics, pagination footer.

### Status pill / badge
- Radius 999 (or 6) · `color @ 12%` bg · solid `color` text · 12px/500 · optional 6px leading dot.

### Buttons
- Primary: black pill `#14161A`, white text, 10×20 pad, 13–14px/600.
- Secondary: white + hairline border. Accent-fill variant for active product color.
- Icon button: 32px square, ghost, hover → `#F5F6F8`.

### Avatar stack
- 28px circles, 2px white ring, −8px overlap, `+N` muted chip at end.

### Decorative header banner (signature)
- 120–160px soft gradient/aurora strip behind the title row: sky (07), green aurora (11), green wash (14).
- Low saturation; sits under greeting + date-range picker.

---

## Recurring devices
1. Sidebar + KPI row + chart grid skeleton — 11/14.
2. Big-number + delta-chip KPI cards — near-universal.
3. Gradient-fill area chart as hero viz — 01,04,06,14.
4. Hairline borders over shadows — every light shot.
5. Status pills + avatar stacks — 08,10,12,13,14.
6. Soft decorative gradient banner — 07,11,12,14.
7. Black pill primary CTA — 01,04.

---

## Takeaways
- Commit to light-first + one accent (01/04/05/11).
- Lead with a 3–4 KPI strip above the fold (04).
- Vary chart vocabulary in one view (01).
- Borders, not shadows, define cards (all light shots).
- Steal the aurora banner as the differentiator (11).
- Black pill for primary actions (01,04).
- Tables = sunken header + uppercase micro-labels + tint pills (12,13).
- Dark tier (if ever) = General Sans + glassy surfaces (13).

Tokens implementing all of the above: see `tokens.css` and `tailwind.tokens.js` in this folder.
