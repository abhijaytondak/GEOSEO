# PRD — Gushwork-class Platform (GEOSEO target spec)

Comprehensive source-of-truth for the full platform GEOSEO is building toward:
an AI-powered inbound lead-generation engine — a swarm of specialized agents on a
shared **Brand Memory** that turns a website into a predictable, AI-search-visible
pipeline. Benchmark: Gushwork.ai. This is the *destination*; `ROADMAP.md` sequences
how we get there from today's prototype.

> Status legend used throughout: ✅ built · 🟡 partial · ⛔ not started · 🔑 needs keys/integration

---

## 1. Vision
Be discoverable where buyers search — AI search (ChatGPT, Claude, Gemini, Perplexity)
*and* Google — and convert that discovery into qualified leads via autonomous agents.
Replaces the manual SEO + content tool stack and the need for a large in-house team.
Target value: qualified pipeline within ~90–150 days.

## 2. Architecture — 10 engines on shared Brand Memory
| Engine | Function | GEOSEO today |
|---|---|---|
| Brand Memory | single source of business truth | 🟡 static mock `brand` |
| Research | buyer-intent + query discovery | ⛔ |
| Strategy | competitive gap → content blueprint | ⛔ |
| Content | AI content + page generation | ⛔ |
| Publishing | AI-first CMS, schema, internal links | ⛔ |
| Authority/Backlinking | citations + outreach + link inventory | ✅ opportunities + outreach drafts |
| Optimization/Refresh | perf monitoring → auto-rewrite | 🟡 alerts only |
| Lead | capture + qualification + scoring | ⛔ |
| Analytics | traffic + AI-visibility reporting | ✅ performance + AI-visibility dashboards |
| Paid Boost | paid campaign automation | ⛔ |

## 3. Brand Memory Engine
Central knowledge base every agent reads first. Captures: business description/category,
services/products, locations/markets, customer segments, proof points/differentiators,
brand voice/tone, competitors. **Versioned store with change history + audit.** Auto-updates
from onboarding forms, document/website crawls. Used as the first context block in every prompt.

## 4. Buyer Intent Research Engine
Crawl search-suggestion + intent APIs across Google + AI engines; identify real buyer phrases;
rank by relevance × expected lead value; group by funnel stage (TOFU/MOFU/BOFU). 🔑 (DataForSEO + AI-search scraping)

## 5. Strategy & Competitive Blueprinting
Analyze SERPs + AI answers per query; reverse-engineer ranking pages; map competitor topics/gaps
with **gap scoring**; output topic clusters, page taxonomy, internal-linking plan. **Continuous
competitor change detection** (not one-shot): new FAQs, schema changes, backlink-portfolio shifts → trigger strategy adjustments. Stored in a versioned strategy DB.

## 6. Content Creation & Page Generation
Page types: service landing, informational guides, long-tail FAQ, resource hubs. Brand-voice adherence,
semantic keyword coverage, on-page SEO (H1/H2, metadata), structured markup (schema/FAQ/JSON-LD),
design/layout + brand-CSS injection. Output: publish-ready HTML + variants for testing. 🔑 (Claude)

## 7. Content Accuracy & Human Review
Multi-agent validation; **human review loop** to prevent hallucinations; approval states
(Draft → Reviewed → Published); ambiguity flagging; domain-expertise capture; feedback loop that
updates Brand Memory.

## 8. Publishing & AI-First CMS
Publish to a **dedicated subdirectory** (e.g. `/feeds`) to avoid overloading the main site.
Per-page: metadata, schema, FAQ markup, internal-linking automation, **`llms.txt`** AI-crawl rules,
sitemap generation. CMS connectors (WordPress/Webflow/custom), publishing queue, per-page health monitors.
**Content stays with / is exportable by the customer on churn.**

## 9. Authority & Backlinking System
Acquire citations from trusted domains (directories, niche blogs, roundups, AI knowledge bases);
contextual anchors; quality-first. **Backlink scoring, outreach automation, link-inventory tracking,
live-vs-lost status, per-tier count guarantees (10/20/40).**

## 10. Content Refresh & Optimization
Triggers: ranking drop, low CTR, AI-answer-feedback change, competitor shift. Actions: light rewrite,
add subtopics, update internal links. Threshold logic, historical comparison, audit trail + rollback, auto-refresh jobs.

## 11. Lead Capture & Qualification
Per-page form capture; **spam/bot filtering**; lead scoring; segmentation (urgency/intent tags);
source attribution. Dashboard: new leads, quality scoring, source.

## 12. Lead Dashboard, Conversion & Engagement
Lead volume over time, quality breakdown, source attribution. **Buyer Journey Tracking** (premium):
first-touch → conversion, touchpoints-before-lead, time-to-convert, funnel viz, engagement heatmaps.
Conversion: automated follow-ups, engagement templates, internal alerts, recommended action per lead, CRM sync (HubSpot/Salesforce). 🔑

## 13. AI Search Visibility Reporting
Distinct from SEO metrics: AI answer citation frequency, **share of voice** in AI answers, coverage of
target questions, AI-vs-traditional contribution to lead flow. 🟡 (have SOV dashboard on mock data)

## 14. Paid Boost / Acquisition
Supplement organic while content matures: budget config, campaign automation, messaging optimization,
paid-channel integrations. 🔑

## 15. Integrations & Marketplace
CRM, CMS, analytics, webhooks/Zapier-style. Optional **free utility tools** (brand-name/paragraph
generators, AI-search grader) as top-of-funnel onboarding magnets.

## 16. Data & Systems Architecture
Single Brand Memory store · event feed for updates · versioned content outputs · **vector store for
embeddings** (pgvector) · multi-tenant DB · per-tenant isolation.

## 17. Reporting & SLAs
Tiered scheduled reports (monthly/weekly/quarterly QBRs), exportable PDF/CSV, custom analytics view
builder. Pipeline milestones: first qualified leads ~90–150 days; 5–10/month by month 4.

## 18. KPIs
Leads/month 5–15 (90–150d) · 10–40 quality backlinks/tier · organic visibility lift · measurable AI-citation growth · ≥30% dashboard engagement.

## 19. Security & Compliance
RBAC (admin/marketer/analyst) · encryption · GDPR/DPDP · audit logging · content-retention/export policy.

## 20. Deployment & Scaling
Cloud-native, multi-tenant, autoscaling, monitoring + error tracking (Sentry), CI/CD.

## 21. Onboarding & ROI
White-glove onboarding with human review; interactive onboarding UI; **lead/revenue ROI estimator**;
tier feature matrix aligned to pricing (Launch / Grow / Scale).

---
*The execution sequence + per-sprint status lives in `ROADMAP.md`.*
