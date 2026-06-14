import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { SolutionReadiness, SolutionCapability } from "@geoseo/types";

/**
 * Truthful solution-readiness report (Solution Parity PRD §13 Phase 1). Hand-curated
 * to match what's actually built so sales/marketing copy can't overclaim. Update the
 * capability statuses as features ship.
 */
const completeness = (caps: SolutionCapability[]): number =>
  Math.round((caps.reduce((a, c) => a + (c.status === "built" ? 1 : c.status === "partial" ? 0.5 : 0), 0) / caps.length) * 100);

const AI_SEARCH: SolutionCapability[] = [
  { label: "Brand Memory", status: "partial", note: "Editable/versioned + structured product/persona/proof library, wired into page-generation context (composeBrandContext); pgvector semantic recall pending." },
  { label: "Buyer-intent research", status: "gap", note: "DataForSEO keyword-research seam wired + verified (env-gated DATAFORSEO_LOGIN/PASSWORD); discover() flips from seed-derived to real volume/difficulty/CPC the moment creds are set. No live data without a key yet." },
  { label: "SERP / AI-answer analysis", status: "gap" },
  { label: "Strategy blueprint", status: "partial" },
  { label: "Page generation", status: "partial" },
  { label: "Native theme matching", status: "partial", note: "Scan + confirm UI + preview + published /feeds pages now render in the confirmed theme tokens; component-level fidelity score + CMS-published rendering pending." },
  { label: "Publish to /feeds + sitemap + llms.txt", status: "partial" },
  { label: "CMS publishing adapters", status: "gap" },
  { label: "Backlinks / citations", status: "partial", note: "Opportunities + outreach exist; real acquisition pending." },
  { label: "AI bot crawl analytics", status: "built", note: "Auto-captured on /feeds (GPTBot/Perplexity/Claude/Google-Extended) + per-bot breakdown." },
  { label: "AI mention / citation tracking", status: "partial", note: "Mention store + heuristic check built; real per-engine provider pending." },
  { label: "Lead attribution from AI search", status: "partial", note: "Journey + source attribution exist." },
];

const LEAD_CONVERSION: SolutionCapability[] = [
  { label: "Lead capture (public pages)", status: "built" },
  { label: "Leads dashboard", status: "built" },
  { label: "Lead detail drawer", status: "built", note: "Overview / journey / activity / follow-up, screenshot-verified." },
  { label: "Explainable lead scoring", status: "built", note: "fit/intent/engagement/spam-risk + reasons." },
  { label: "Visitor journey tracking", status: "built", note: "Public events → timeline + summary." },
  { label: "Notes & activity timeline", status: "built" },
  { label: "Owner assignment", status: "built", note: "assign / bulk-assign / workload." },
  { label: "Spam & duplicate filtering", status: "partial", note: "Basic regex/email + duplicate labels." },
  { label: "Lead form config", status: "built", note: "Per-workspace/page form builder API + defaults." },
  { label: "Routing rules", status: "built", note: "Field/operator rules + first-match owner assignment + apply-to-unassigned." },
  { label: "Notifications", status: "partial", note: "Rules + evaluation + in-app delivery log; email/Slack/webhook providers stubbed." },
  { label: "AI SDR follow-up", status: "built", note: "Per-lead draft from Brand Memory + context (DeepSeek; template fallback); copy / mailto." },
  { label: "Meeting booking", status: "gap" },
  { label: "Website-wide conversion audit", status: "built", note: "SSRF-guarded page audit → score/grade + 7 findings with fixes." },
  { label: "CRM sync", status: "partial", note: "Placeholder sync action; no real provider/retry/mapping." },
];

const PAID_BOOST: SolutionCapability[] = [
  { label: "Campaign data model", status: "gap" },
  { label: "Campaign builder", status: "gap" },
  { label: "Ad creative generation", status: "gap" },
  { label: "Paid landing pages", status: "gap", note: "Page Engine could help; no paid workflow." },
  { label: "Ad-platform integration (Google/Meta)", status: "gap" },
  { label: "Budget & pacing", status: "gap" },
  { label: "Paid/organic ROI reporting", status: "gap" },
];

const READINESS: SolutionReadiness[] = [
  {
    id: "ai-search",
    name: "AI Search Engine",
    status: "partial",
    completeness: completeness(AI_SEARCH),
    summary: "Strong building blocks for AI-search-ready page creation + lead capture. Not yet autonomous AI-search lead generation (research, AI-citation tracking, authority acquisition still incomplete).",
    primaryQuestion: "Are we turning buyer searches into qualified leads?",
    capabilities: AI_SEARCH,
    safeClaims: [
      "Create and publish AI-search-ready buyer-intent pages (beta workflow).",
      "Capture leads from generated pages.",
      "Track rankings, impressions, clicks, and AI-visibility signals (prototype).",
      "Manage Brand Memory as content/outreach context.",
    ],
    avoidClaims: [
      "Generates qualified leads from AI search fully autonomously.",
      "Tracks real ChatGPT/Perplexity/Gemini/Claude citations.",
      "Builds real backlinks and citations automatically.",
    ],
  },
  {
    id: "lead-conversion",
    name: "Lead Conversion Engine",
    status: "partial",
    completeness: completeness(LEAD_CONVERSION),
    summary: "Capture → score → triage → assign → follow-up notes are live with an explainable detail drawer. Website-wide conversion audit, form/routing, automated follow-up, and real CRM sync are still missing.",
    primaryQuestion: "Are visitors turning into qualified conversations?",
    capabilities: LEAD_CONVERSION,
    safeClaims: [
      "Capture, score, and triage leads from generated pages.",
      "Explain why each lead matters (fit/intent/engagement).",
      "See each lead's visitor journey and log activity.",
      "Assign owners and export leads.",
    ],
    avoidClaims: [
      "Automatically calls, qualifies, and books every inbound lead.",
      "Improves a customer's entire website conversion path.",
    ],
  },
  {
    id: "paid-boost",
    name: "Paid Boost Engine",
    status: "planned",
    completeness: completeness(PAID_BOOST),
    summary: "Roadmap/flow concept only — no campaign builder, ad-platform integration, budget pacing, or paid ROI reporting. Position as a planned add-on, not available.",
    primaryQuestion: "Are paid campaigns generating qualified leads profitably?",
    capabilities: PAID_BOOST,
    safeClaims: ["Position Paid Boost as a planned add-on."],
    avoidClaims: [
      "Runs paid ad campaigns.",
      "Optimizes paid budgets.",
      "Delivers blended paid/organic ROI from real ad platforms.",
    ],
  },
];

@ApiTags("solutions")
@Controller("solutions")
export class SolutionsController {
  @Get("readiness")
  readiness() {
    return { solutions: READINESS };
  }
}
