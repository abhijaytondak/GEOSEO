# PRD — Backlinking & Continuous SEO Optimization Engine

GEOSEO's flagship module: automated domain-authority growth, backlink acquisition,
real-time performance monitoring, and content optimization — surfaced in a
world-class SaaS dashboard. Benchmark/surpass Gushwork's Backlinking + Optimization Agents.

---

## Phase 1 — MVP
**Objective:** users see real SEO authority + performance results fast, without manual backlink work.

### Functional requirements
1. **Backlink Opportunity Discovery** — scan web for relevant high-authority sites by niche/topic; rank by DA + relevance; dashboard list with "View Details" / "Outreach Template". *AC: ≥20 valid prospects/campaign with quality scoring; real-time updates as content evolves.*
2. **AI-Generated Outreach Templates** — personalized per prospect, variables filled from **Brand Memory** (company, URL, topic, value prop). Variant types: **cold · follow-up · value-offer · content-swap**. *AC: 2–3 variants/prospect; in-browser editable with live preview.*
3. **Performance Monitoring Dashboard (Lite)** — backlinks acquired vs opportunities; ranking/impressions trends; visibility-dip + broken-link alerts; AI-search visibility signals. *Viz: trend-line graphs, KPI cards, click-drilldown.*
4. **Optimization Alerts** — triggers: ranking drop ≥5%, traffic decrease, lost/broken backlinks, AI-search underperformance, content de-indexed. Channels: in-app banners + email digest. *AC: threshold-based auto-triggers; each links to a recommended quick-action ("Refresh content", "Re-outreach", "Add links").*

### UX principles
Clarity over clutter · action-driven insight cards ("3 pages lost rank — click to optimize", "15 backlink opportunities ready") · guided navigation (tooltips, micro-tutorials) · meaningful visual confidence (motion only where it informs).

### Key MVP dashboards
- **Authority HQ (landing):** backlink progress bar · live domain health score · alerts panel ("3 Pages Need Attention").
- **Backlink Opportunities:** impact-ranked list · quick actions (copy email, open site, send) · tags (Industry, DA, past interactions).
- **Performance Trends:** ranking trend graphs · impressions + clicks over time · AI-search visibility signals.

### MVP KPIs
≥20 backlink opportunities/user/week · ≥10% outreach template open rate · +10% ranking on tracked pages over 8 weeks · ≥30% monthly dashboard engagement.

### MVP test checklist
Prospect relevance eval · outreach template personalization accuracy · dashboard responsiveness (mobile + desktop).

---

## Phase 2 — Full Product
1. **Automated Backlink Acquisition & Tracking** — auto-submission via API/partner network (directories, listicles); auto-track link status (**live / removed / nofollow / dofollow**) + **backlink health score**; convert prospects into scheduled outreach tasks. *AC: ≥30 quality backlinks/month; live-vs-lost tracking dashboard.*
2. **Internal Linking Intelligence** — suggest + one-click/rule-based apply internal links (semantic relevance + authority flow); **anchor-text rules + checks**; improve crawl depth + topic authority.
3. **AI-Driven Content Refresh** — detect stale/underperforming pages; auto-trigger rewrites/structure fixes from search trends. *AC: measurable lift; audit trail + rollback.*
4. **Predictive Insights & Playbooks** — forecast ranking shifts; suggest highest-impact next actions; playbooks (boost new pages, fix underperformers).
5. **Role-Based Dashboard Views** — Owners (revenue/lead impact) · Marketers (ranking/SEO funnel) · Technical (crawl issues, internal linking).

### Full UX vision — "dashboard that feels alive"
Intelligent/coaching · goal-oriented (progress to outcomes) · insightful not overwhelming · confident UI with purposeful motion. Wow moments: real-time backlink-opportunity leaderboard with **drag-to-prioritize** · "Optimization Flair" animated KPI jumps · auto-recommendation cards ("Fix these 4 pages this week") · one-click AI fix suggestions · built-in SEO-signal explanations · deep-dive graphical views (**crawl maps, authority flows**) · **multi-domain rollups**.

---

## Roadmap
| Stage | Deliverables | Time |
|---|---|---|
| MVP | Backlink discovery, templates, performance dashboard, alerts | 6–8 wks |
| Expansion | Automated backlinking, internal linking | 8–10 wks |
| Optimization | AI refresh, predictive insights, playbooks | 10–12 wks |
| UX polish | Next-level interactions + guided workflows | Continuous |

---

## Decisions (locked 2026-06-12)
- **SEO data source: DataForSEO** — single pay-as-you-go vendor for backlinks, DA-style ranks, SERP/keyword rankings. All provider calls behind a `SeoDataProvider` interface so it's swappable.
- **Brand Memory: standalone** — GEOSEO owns a lightweight brand-profile model (company, URL, topics, value prop) behind a `BrandProfileSource` adapter, so the existing `~/brand-memory` product can plug in later without refactor.
- **Build order: UI prototype first** — scaffold monorepo, build the 3 MVP dashboards (Authority HQ, Backlink Opportunities, Performance Trends) high-fidelity on **typed mock data**, lock the "wow" look, then wire the real backend.
- **Outreach: draft only** for MVP — generate/edit/copy templates in-browser; no send infra.
