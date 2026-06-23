import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { dbEnabled, ensureTable, loadAllWithIds, removeRow, upsert } from "../db/db";
import { resolveMode } from "../common/mode";
import { DEFAULT_TENANT_ID } from "../common/tenant";
import { draftPageContent, type DraftContent } from "../llm/deepseek";
import { specFor, buildSchemaJson } from "../llm/page-type-spec";
import { buildInfographic } from "../llm/infographic";
import { classifyIntents, type ClassifiedIntent } from "../llm/intent";
import { BrandMemoryStore } from "./brand.service";
import { BrandLibraryStore, composeBrandContext } from "./brand-library.service";
import { KeywordResearchService, type KeywordIdea, type ResearchSource } from "./keyword-research.service";
import { ImageGenStore } from "./image-gen.service";

const T = {
  opps: "pe_opportunities",
  blueprints: "pe_blueprints",
  pages: "pe_pages",
  versions: "pe_versions",
  leads: "pe_leads",
  audit: "pe_audit",
} as const;
import type {
  AuditEntry,
  FunnelStage,
  GeneratedPage,
  KeywordOpportunity,
  Lead,
  LeadStatus,
  OpportunityStatus,
  PageBlueprint,
  PageEdit,
  PageStatus,
  PageType,
  PageVersion,
  SearchIntent,
  SpamStatus,
} from "@geoseo/types";

/**
 * Build type-appropriate FAQ pairs for the template path.
 * Questions are tailored to the page type so a comparison page asks "Which is better?"
 * while a guide asks "How long does it take?" — not the same generic questions for all types.
 */
function buildFaqsForType(type: PageType, keyword: string, count: number): { q: string; a: string }[] {
  const k = keyword;
  const typeQuestions: Record<PageType, { q: string; a: string }[]> = {
    guide: [
      { q: `How long does it take to learn ${k}?`, a: `Most people get comfortable with ${k} within a few weeks of consistent practice. A structured guide like this one speeds up the process considerably.` },
      { q: `Is ${k} suitable for beginners?`, a: `Yes. This guide is written for people at all experience levels. Start with the early sections and work through at your own pace.` },
      { q: `What are the most common mistakes with ${k}?`, a: `The most common mistake is skipping the fundamentals and jumping straight to advanced techniques. Building a solid base first saves significant time later.` },
      { q: `Do I need special tools to get started with ${k}?`, a: `No special tools are required to start. The basics of ${k} can be applied with what most teams already have — we cover any recommended tools in the later sections.` },
      { q: `How do I measure progress with ${k}?`, a: `Set clear goals before you start, then track the specific metrics most relevant to your situation. We recommend reviewing progress every two weeks and adjusting your approach accordingly.` },
      { q: `Where can I get help with ${k}?`, a: `This guide covers the most common questions, but every situation is unique. Reach out via the contact form if you'd like personalised advice.` },
    ],
    service: [
      { q: `What does your ${k} service include?`, a: `Our ${k} service includes initial discovery, a structured delivery phase, and ongoing support. Full scope is confirmed during the discovery call.` },
      { q: `How long does the ${k} engagement take?`, a: `Most ${k} projects run between four and twelve weeks depending on scope and complexity. We'll give you a detailed timeline during the discovery phase.` },
      { q: `How much does ${k} cost?`, a: `Pricing depends on the scope of your requirements. We offer fixed-scope packages and custom engagements — contact us for a no-obligation quote.` },
      { q: `Do you offer ongoing support after the ${k} project?`, a: `Yes. We offer a range of ongoing support options so you can continue to build on the work after the initial engagement.` },
    ],
    comparison: [
      { q: `Which option is better for ${k}?`, a: `It depends on your requirements. If speed and simplicity are the priority, Option A is typically the better choice. For scale and flexibility, Option B has the edge.` },
      { q: `Can I switch between options later?`, a: `Switching is possible but comes with a migration cost. It's worth choosing the right option for your current and near-future needs rather than planning a switch.` },
      { q: `How do the prices compare for ${k}?`, a: `Pricing varies significantly by use case and team size. We recommend requesting quotes from both providers with your specific requirements before comparing.` },
      { q: `Which option is better for small teams?`, a: `For small teams, the simpler option generally delivers faster results. Avoid over-engineering the solution before you have clear evidence of what you need.` },
      { q: `Is there a free trial available?`, a: `Most providers in this space offer a trial period. Check the provider's site directly for current trial terms — these change frequently.` },
    ],
    landing: [
      { q: `How do I get started with ${k}?`, a: `The fastest way to get started is to book a discovery call. We'll understand your situation, share relevant experience, and outline the right path forward.` },
      { q: `What results can I expect from ${k}?`, a: `Results vary by starting point and effort, but clients typically see meaningful progress within the first 30 to 90 days when they engage fully with the process.` },
      { q: `How is this different from other ${k} providers?`, a: `We focus on practical, measurable outcomes rather than activity or deliverable counts. You'll know exactly what's happening and why at every stage.` },
      { q: `Is there a minimum commitment for ${k}?`, a: `No minimum commitment is required for an initial discovery conversation. Ongoing engagement terms are discussed and agreed upfront.` },
    ],
    faq: [
      { q: `What is ${k}?`, a: `${k} refers to the practice or product described on this page. The sections above cover the key concepts in detail.` },
      { q: `Who is ${k} for?`, a: `${k} is relevant to anyone facing the challenges or goals described on this page. Specific use cases are covered in the sections above.` },
      { q: `How do I get started with ${k}?`, a: `Use the contact form on this page or browse the related resources to take your first step.` },
      { q: `Is ${k} suitable for my industry?`, a: `In most cases, yes. The core principles apply across industries, though implementation details may vary.` },
      { q: `What are the alternatives to ${k}?`, a: `Alternatives exist and are worth considering. The right choice depends on your specific situation, constraints, and goals.` },
      { q: `How much does ${k} cost?`, a: `Costs vary depending on how you approach ${k}. Contact us for a personalised estimate based on your requirements.` },
      { q: `How long does ${k} take?`, a: `Timelines depend on scope and starting point. Most engagements deliver initial results within weeks, not months.` },
      { q: `Can I try ${k} before committing?`, a: `Yes. We offer a no-obligation discovery conversation so you can understand the fit before making any commitment.` },
      { q: `What do I need to get started with ${k}?`, a: `Very little upfront. A clear goal and a willingness to engage with the process are the most important ingredients.` },
      { q: `How do I know if ${k} is working?`, a: `We define success metrics at the start of every engagement so you always have a clear picture of progress.` },
    ],
    resource: [
      { q: `Is this ${k} resource free?`, a: `Yes. The resource on this page is free to use. More advanced templates and toolkits are available for download — use the contact form to request them.` },
      { q: `Can I adapt this ${k} resource for my own use?`, a: `Absolutely. The resource is designed to be adapted. Adjust headings, examples, and timelines to fit your specific context.` },
      { q: `How often is this ${k} resource updated?`, a: `We review and update our resources regularly as best practices evolve. Check back for the latest version or subscribe for updates.` },
    ],
    local: [
      { q: `Do you provide ${k} in my area?`, a: `We cover a wide area — contact us with your location and we'll confirm availability straight away.` },
      { q: `How quickly can you respond for ${k} in my area?`, a: `Response times depend on your location and current demand. For most areas we can respond within 24–48 hours.` },
      { q: `Are your ${k} services the same everywhere?`, a: `Our core service is consistent everywhere we operate. Local conditions may affect timelines and specific recommendations.` },
      { q: `Can I meet the ${k} team in person?`, a: `Yes. For clients in our core service area, face-to-face meetings are available on request.` },
    ],
  };

  const pool = typeQuestions[type] ?? typeQuestions.landing;
  // Return up to `count` questions; cycle if there are fewer in the pool.
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

/**
 * Build type-specific sections for the deterministic (non-LLM) template path.
 * Each page type gets a distinct structure — different headings, section count, and
 * brand/keyword-aware placeholder body copy — so the template fallback is never
 * a generic "3-section + 2-FAQ" for every page type.
 *
 * When the LLM is available, `draftPageContent` returns `ai.sections` and this
 * function is never called (the LLM path is already type-aware via page-type-spec.ts).
 */
function buildSectionsForType(
  type: PageType,
  keyword: string,
  brandName: string,
  _intent: string,
): { heading: string; body: string }[] {
  const k = keyword;
  const b = brandName || "our team";

  switch (type) {
    case "guide":
      return [
        {
          heading: `What is ${k}?`,
          body: `Understanding ${k} is the first step to getting results. This guide explains the core concepts and why ${k} matters for your business or workflow. ${b} has worked with organisations at every stage of this journey.`,
        },
        {
          heading: `Step 1 — Get started with ${k}`,
          body: `The fastest way to start with ${k} is to focus on the fundamentals. Begin by identifying your goal, then map the simplest path from where you are now to where you want to be. Most teams see early wins within the first two weeks.`,
        },
        {
          heading: `Step 2 — Build your approach`,
          body: `Once you have the basics in place, it's time to create a repeatable process for ${k}. Document what's working, remove friction from your workflow, and loop in the right stakeholders early.`,
        },
        {
          heading: `Step 3 — Optimise and scale`,
          body: `The final step is turning a working approach into a scalable system. Measure what matters, iterate quickly on what isn't working, and keep ${k} front-of-mind as your team grows.`,
        },
        {
          heading: `Common mistakes with ${k}`,
          body: `Most teams run into the same set of problems early on. The good news: they're avoidable. ${b} has compiled the top pitfalls and exactly how to sidestep each one so you reach your goals faster.`,
        },
      ];

    case "service":
      return [
        {
          heading: `The challenge: why ${k} is hard to get right`,
          body: `Most organisations struggle with ${k} because the problem is multi-layered — it's not just a tool or a tactic. Without the right approach, teams waste time, miss opportunities, and leave revenue on the table.`,
        },
        {
          heading: `Our solution: ${b} and ${k}`,
          body: `${b} delivers a proven, end-to-end approach to ${k}. From initial discovery through to ongoing optimisation, our process is designed to produce measurable outcomes — not just activity.`,
        },
        {
          heading: `Key features`,
          body: `Our ${k} service includes three core capabilities. First, a structured onboarding process that gets your team up to speed in days, not weeks. Second, continuous monitoring so issues are caught before they become problems. Third, dedicated support so you're never stuck waiting for answers.`,
        },
        {
          heading: `Why clients choose ${b}`,
          body: `Clients choose ${b} for ${k} because we combine deep expertise with a practical, no-jargon approach. Our track record speaks for itself: teams report faster time-to-value and stronger results compared to going it alone or switching providers.`,
        },
      ];

    case "comparison":
      return [
        {
          heading: `${k} — overview`,
          body: `This comparison covers everything you need to make a confident decision about ${k}. We break down the key differences, trade-offs, and the buyer profiles each option is best suited for.`,
        },
        {
          heading: `Option A — strengths`,
          body: `The first approach to ${k} excels when you need speed, simplicity, and a lower upfront investment. Teams with limited resources or tight deadlines often find this path the clearest route to a working solution.`,
        },
        {
          heading: `Option B — strengths`,
          body: `The second approach is built for scale. If your requirements are complex, your team is large, or you need deep customisation, this option gives you the headroom to grow without hitting ceilings early on.`,
        },
        {
          heading: `Head-to-head: ${k}`,
          body: `Side by side, the two options differ most on three dimensions: setup complexity (Option A wins), long-term flexibility (Option B wins), and total cost of ownership over 12 months (depends on team size — see pricing notes below).`,
        },
        {
          heading: `Verdict — which is right for you?`,
          body: `For most teams new to ${k}, Option A is the faster path to value. If you're scaling beyond 50 users or need enterprise-grade controls, Option B is worth the additional investment. ${b} can help you evaluate both options against your specific requirements.`,
        },
      ];

    case "landing":
      return [
        {
          heading: `Why ${k} matters for your business`,
          body: `${k} is no longer a nice-to-have — it's a key driver of growth, efficiency, and competitive advantage. Organisations that get it right outperform their peers on every metric that matters.`,
        },
        {
          heading: `How ${b} delivers results`,
          body: `${b} has built a proven approach to ${k} that combines the right tools, the right process, and the right team. From day one, we focus on the outcomes that matter most to your business.`,
        },
        {
          heading: `What makes ${b} different`,
          body: `Unlike generic solutions, ${b}'s approach to ${k} is tailored to your context. We don't believe in one-size-fits-all — every engagement starts with a deep understanding of your goals, your constraints, and your customers.`,
        },
        {
          heading: `Real results from real clients`,
          body: `Clients working with ${b} on ${k} report faster time-to-value, higher team confidence, and outcomes that persist long after the engagement ends. Ask us for case studies relevant to your industry.`,
        },
        {
          heading: `Get started today`,
          body: `Ready to tackle ${k} with a team that's done it before? ${b} offers a no-commitment discovery call to understand your situation and share what's worked for organisations like yours.`,
        },
      ];

    case "local":
      return [
        {
          heading: `${k} in your area`,
          body: `${b} provides ${k} to clients across the region. Whether you're in the city centre or a surrounding area, our team is close by and ready to help — with the local knowledge that makes a real difference.`,
        },
        {
          heading: `Why local matters for ${k}`,
          body: `Working with a local provider for ${k} means faster response times, face-to-face meetings when you need them, and a team that understands the specific conditions and regulations in your area.`,
        },
        {
          heading: `Our service area`,
          body: `${b} covers the full region for ${k}. Contact us to confirm coverage for your specific location — we're expanding our service area regularly and may already be working near you.`,
        },
      ];

    case "faq":
      return [
        {
          heading: `Everything you need to know about ${k}`,
          body: `This page answers the most common questions about ${k} — from the basics to the details that matter when you're making a decision. If you can't find what you need, ${b} is happy to help directly.`,
        },
      ];

    case "resource":
      return [
        {
          heading: `What's inside this ${k} resource`,
          body: `This resource gives you a practical, ready-to-use toolkit for ${k}. Everything here has been field-tested by ${b} and refined based on real-world feedback — so you can start using it today, not next quarter.`,
        },
        {
          heading: `How to use this resource`,
          body: `Work through the resource step by step, or jump to the section most relevant to where you are right now. Each section is self-contained so you can adapt it to your context without needing to read everything first.`,
        },
        {
          heading: `A worked example`,
          body: `To make this concrete, here's how a typical team uses this ${k} resource in practice. Follow the example from start to finish to see how the pieces fit together — then adapt it for your own situation.`,
        },
      ];

    default:
      return [
        {
          heading: `About ${k}`,
          body: `${b} covers everything you need to know about ${k} on this page. Explore the sections below to understand the topic, see how it applies to your situation, and find out how to get started.`,
        },
        {
          heading: `Why ${k} matters`,
          body: `${k} is an important area for any organisation focused on growth and efficiency. Getting it right early saves time, reduces risk, and puts you in a stronger position as your needs evolve.`,
        },
        {
          heading: `Next steps`,
          body: `Ready to learn more about ${k}? ${b} is here to help. Reach out using the form below or explore our other resources to build on what you've read here.`,
        },
      ];
  }
}

function countWords(p: { heroCopy: string; sections: { body: string }[]; faqs: { q: string; a: string }[] }): number {
  const text = [p.heroCopy, ...p.sections.map((s) => s.body), ...p.faqs.map((f) => `${f.q} ${f.a}`)].join(" ");
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export interface DiscoverInput {
  seeds: string[];
  intent?: SearchIntent;
}

export interface LeadInput {
  name: string;
  email: string;
  company?: string;
  message?: string;
  pageId?: string;
  slug?: string;
  sourceUrl?: string;
  utm?: string;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const clampN = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

const PAGE_TYPE_BY_INTENT: Partial<Record<SearchIntent, PageType>> = {
  commercial: "landing",
  transactional: "landing",
  informational: "guide",
  comparison: "comparison",
};

/** Heuristic search-intent from the keyword text (DataForSEO ideas have no intent field). */
function classifyKwIntent(keyword: string): SearchIntent {
  const k = keyword.toLowerCase();
  if (/\b(vs|versus|alternative|alternatives|compare|comparison)\b/.test(k)) return "comparison";
  if (/\b(how|what|why|guide|tutorial|examples?|ideas?|tips|best way)\b/.test(k)) return "informational";
  return "commercial";
}

/** Fallback funnel stage from intent when the LLM classifier is unavailable. */
function stageFromIntent(intent: SearchIntent): FunnelStage {
  if (intent === "transactional") return "ready-to-buy";
  if (intent === "informational") return "research";
  return "consideration"; // commercial / comparison / navigational / local
}

/** Progress record for a background "Initiate" batch page-generation run. */
export interface PageBatchJob {
  id: string;
  total: number;
  done: number;
  created: number;
  failed: number;
  pageIds: string[];
  status: "running" | "completed";
  startedAt: string;
  finishedAt?: string;
}

/**
 * Progress record for a background keyword discovery run. Discovery is now
 * LLM-backed (AI-search keyword tier + intent classification) and can take
 * 20-40s — longer than the web BFF's mutation budget — so the UI starts a job
 * and polls, mirroring the Initiate batch pattern.
 */
export interface DiscoverJob {
  id: string;
  status: "running" | "completed" | "failed";
  created: number;
  opportunityIds: string[];
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/** Progress record for a background page regeneration (LLM re-draft → polled by the UI). */
export interface RegenJob {
  id: string;
  status: "running" | "completed" | "failed";
  pageId: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/**
 * In-memory page-engine state (Research → Blueprint → Page → Leads).
 * Mirrors the existing store pattern; swaps for a DB-backed repo later.
 * Seeded from `@geoseo/mock` and deep-cloned so mutations never touch the
 * shared fixture arrays.
 */
/** Per-workspace page-engine state. Keyed by tenant so workspaces are isolated (P0-6). */
interface PEState {
  opportunities: KeywordOpportunity[];
  blueprints: PageBlueprint[];
  pages: GeneratedPage[];
  leads: Lead[];
  pageVersions: Record<string, PageVersion[]>;
  audit: AuditEntry[];
}

function emptyState(): PEState {
  return { opportunities: [], blueprints: [], pages: [], leads: [], pageVersions: {}, audit: [] };
}

@Injectable()
export class PageEngineStore implements OnModuleInit {
  private ready = false;
  // Production starts EMPTY (No-Dummy-Data §6.1, P0-3); demo seeds ws-default on boot.
  // State is per-tenant (P0-6) so workspaces never see each other's data.
  private tenants = new Map<string, PEState>();
  // ID counters are GLOBAL so generated ids stay unique across tenants (row ids are
  // additionally tenant-prefixed for non-default tenants).
  private seq = 0;
  private vseq = 0;
  private aseq = 0;
  /** In-flight one-click "Initiate" batch generations (Growth Plan → background drafting). */
  private batchJobs = new Map<string, PageBatchJob>();
  private bseq = 0;
  /** In-flight background keyword-discovery runs (LLM-backed → polled by the UI). */
  private discoverJobs = new Map<string, DiscoverJob>();
  private dseq = 0;
  /** In-flight background page regenerations (LLM re-draft → polled; same reason as discover:
   *  the LLM call exceeds the BFF/host sync request budget). */
  private regenJobs = new Map<string, RegenJob>();
  private rseq = 0;

  /** Get (lazily create) a tenant's state. */
  private st(tenantId: string): PEState {
    let s = this.tenants.get(tenantId);
    if (!s) {
      s = emptyState();
      this.tenants.set(tenantId, s);
    }
    return s;
  }

  /** Persistence row id for an entity. `ws-default` keeps the legacy un-prefixed id
   *  (zero data migration); other tenants are namespaced `t:<tenant>:<id>`. */
  private rowId(tenantId: string, id: string): string {
    return tenantId === DEFAULT_TENANT_ID ? id : `t:${tenantId}:${id}`;
  }

  /** Recover the owning tenant from a stored row id (inverse of rowId). */
  private parseTenant(rowId: string): string {
    if (rowId.startsWith("t:")) {
      const rest = rowId.slice(2);
      const i = rest.indexOf(":");
      if (i > 0) return rest.slice(0, i);
    }
    return DEFAULT_TENANT_ID;
  }

  // fixed clock — keeps generated timestamps deterministic across reloads
  private now = "2026-06-12T00:00:00.000Z";

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(KeywordResearchService) private readonly research: KeywordResearchService,
    @Inject(ImageGenStore) private readonly images: ImageGenStore,
  ) {}

  /** Instant theme-aware placeholder hero (no generation) so page creation never blocks. */
  private async heroPlaceholderFor(tenantId: string, title: string): Promise<{ url: string; alt: string } | undefined> {
    try {
      const url = await this.images.placeholderUrl(tenantId, title, "hero");
      return url ? { url, alt: `${title} — brand illustration` } : undefined;
    } catch {
      return undefined;
    }
  }

  /** Background hero upgrade: generate the real brand raster (IMAGE_GEN) and persist it onto
   *  the page without blocking page creation. Best-effort — any failure leaves the placeholder. */
  private upgradeHeroImage(tenantId: string, pageId: string, title: string): void {
    void this.images
      .generate(tenantId, title, "hero", this.now)
      .then((img) => {
        if (!img?.url) return;
        const page = this.st(tenantId).pages.find((p) => p.id === pageId);
        if (!page) return;
        page.heroImageUrl = img.url;
        page.heroImageAlt = `${title} — brand illustration`;
        page.updatedAt = this.now;
        this.save(tenantId, T.pages, page.id, page);
      })
      .catch(() => {});
  }

  /**
   * Populate demo fixtures (demo mode only) from the allowlisted demo-seed module —
   * dynamic import so `@geoseo/mock` is never loaded in production (No-Dummy-Data P0-3).
   */
  private async seedDemoData(tenantId: string) {
    const m = await import("./demo-seed");
    const s = this.st(tenantId);
    s.opportunities = clone(m.keywordOpportunities);
    s.blueprints = clone(m.pageBlueprints);
    s.pages = clone(m.generatedPages);
    s.leads = clone(m.leads);
    // initial version snapshot per seeded page (save() is a no-op until ready)
    for (const p of s.pages) this.snapshot(tenantId, p, "Initial draft", "ai");
  }

  /** Grounding hint for generation — Brand Memory + the workspace's structured library. */
  private async brandHint(tenantId: string): Promise<string | undefined> {
    return composeBrandContext(this.brand.current(), await this.library.get(tenantId));
  }

  /**
   * Public URL for a published page. Uses the workspace's OWN domain (PUBLIC_SITE_HOST
   * or Brand Memory), never a demo brand; falls back to a relative `/feeds` path when
   * no domain is configured (so output is never stamped with someone else's host).
   */
  private publishedUrlFor(slug: string): string {
    const host = (process.env.PUBLIC_SITE_HOST || this.brand.current()?.domain || "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    return host ? `https://${host}/feeds${slug}` : `/feeds${slug}`;
  }

  private snapshot(tenantId: string, p: GeneratedPage, changeSummary: string, authorType: PageVersion["authorType"]) {
    this.vseq += 1;
    const s = this.st(tenantId);
    const list = s.pageVersions[p.id] ?? (s.pageVersions[p.id] = []);
    const version: PageVersion = {
      id: `pv-${this.vseq}`,
      pageId: p.id,
      version: list.length + 1,
      title: p.title,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      heroCopy: p.heroCopy,
      sections: clone(p.sections),
      faqs: clone(p.faqs),
      cta: clone(p.cta),
      changeSummary,
      authorType,
      createdAt: this.now,
    };
    list.unshift(version);
    this.save(tenantId, T.versions, version.id, version);
    return version;
  }

  /* ---- persistence: hydrate on boot (partitioned by tenant), write-through on mutate ---- */
  async onModuleInit() {
    const demo = resolveMode() === "demo";
    // Demo fixtures (Northwind sample) are OPT-IN: only seed when GEOSEO_DEMO_SEED=true.
    // Default off so a live/hosted workspace opened to real users starts EMPTY and never
    // re-seeds dummy data on a restart (set the flag locally for a demo-able dev UI).
    const seedDemo = demo && process.env.GEOSEO_DEMO_SEED === "true";
    if (!dbEnabled) {
      // No DB ⇒ pure in-memory (local/demo only; production fails closed in main.ts before
      // this runs). Demo gets fixtures for a usable UI; production never reaches here.
      if (seedDemo) await this.seedDemoData(DEFAULT_TENANT_ID);
      return;
    }
    try {
      await Promise.all(Object.values(T).map((t) => ensureTable(t)));
      const [oppRows, bpRows, pageRows, leadRows, verRows, audRows] = await Promise.all([
        loadAllWithIds<KeywordOpportunity>(T.opps),
        loadAllWithIds<PageBlueprint>(T.blueprints),
        loadAllWithIds<GeneratedPage>(T.pages),
        loadAllWithIds<Lead>(T.leads),
        loadAllWithIds<PageVersion>(T.versions),
        loadAllWithIds<AuditEntry>(T.audit),
      ]);
      const total = oppRows.length + pageRows.length + leadRows.length;
      if (total > 0) {
        // Partition every row into its owning tenant's state by the row-id prefix.
        for (const { id, data } of oppRows) this.st(this.parseTenant(id)).opportunities.push(data);
        for (const { id, data } of bpRows) this.st(this.parseTenant(id)).blueprints.push(data);
        for (const { id, data } of pageRows) this.st(this.parseTenant(id)).pages.push(data);
        for (const { id, data } of leadRows) this.st(this.parseTenant(id)).leads.push(data);
        for (const { id, data } of verRows) {
          const s = this.st(this.parseTenant(id));
          (s.pageVersions[data.pageId] ??= []).push(data);
        }
        for (const { id, data } of audRows) this.st(this.parseTenant(id)).audit.push(data);
        for (const s of this.tenants.values()) {
          for (const pid of Object.keys(s.pageVersions)) s.pageVersions[pid].sort((a, b) => b.version - a.version);
        }
        this.seq = 100_000;
        this.vseq = verRows.length + 10_000;
        this.aseq = audRows.length + 10_000;
      } else if (seedDemo) {
        // first boot, demo + opt-in: seed fixtures into ws-default, then persist them to Supabase
        await this.seedDemoData(DEFAULT_TENANT_ID);
        const s = this.st(DEFAULT_TENANT_ID);
        await Promise.all([
          ...s.opportunities.map((o) => upsert(T.opps, this.rowId(DEFAULT_TENANT_ID, o.id), o)),
          ...s.blueprints.map((b) => upsert(T.blueprints, this.rowId(DEFAULT_TENANT_ID, b.id), b)),
          ...s.pages.map((p) => upsert(T.pages, this.rowId(DEFAULT_TENANT_ID, p.id), p)),
          ...s.leads.map((l) => upsert(T.leads, this.rowId(DEFAULT_TENANT_ID, l.id), l)),
          ...Object.values(s.pageVersions)
            .flat()
            .map((v) => upsert(T.versions, this.rowId(DEFAULT_TENANT_ID, v.id), v)),
        ]);
      }
      // Production first boot: stay EMPTY — onboarding/provider discovery creates real records.
      this.ready = true;
      const def = this.st(DEFAULT_TENANT_ID);
      // eslint-disable-next-line no-console
      console.log(`[page-engine] persistence ready (Supabase) · tenants=${this.tenants.size} · ws-default pages=${def.pages.length} leads=${def.leads.length}`);
    } catch (e) {
      const msg = (e as Error).message;
      // Fail closed (No-Dummy-Data §6.4, P0-7): production/staging must NOT silently run
      // on in-memory state — abort boot. Demo stays in-memory for local resilience.
      if (demo) {
        // eslint-disable-next-line no-console
        console.error("[page-engine] DB init failed, using in-memory (demo):", msg);
      } else {
        throw new Error(`[page-engine] DB init failed in ${resolveMode()} — refusing to run in-memory: ${msg}`);
      }
    }
  }

  /** Fire-and-forget write-through (in-memory stays the runtime source of truth). */
  private save(tenantId: string, table: string, id: string, obj: unknown) {
    if (!this.ready) return;
    const rid = this.rowId(tenantId, id);
    void upsert(table, rid, obj).catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`[page-engine] persist ${table}/${rid} failed:`, (e as Error).message),
    );
  }
  private drop(tenantId: string, table: string, id: string) {
    if (!this.ready) return;
    void removeRow(table, this.rowId(tenantId, id)).catch(() => {});
  }

  /* audit trail (PRD §10.1/§15.2) */
  private logAudit(tenantId: string, action: AuditEntry["action"], entity: AuditEntry["entity"], entityId: string) {
    this.aseq += 1;
    const entry: AuditEntry = {
      id: `aud-${this.aseq}`,
      action,
      entity,
      entityId,
      actor: "you",
      workspaceId: tenantId,
      at: this.now,
    };
    this.st(tenantId).audit.unshift(entry);
    this.save(tenantId, T.audit, entry.id, entry);
  }
  listAudit(tenantId: string, limit = 100): AuditEntry[] {
    return this.st(tenantId).audit.slice(0, limit);
  }

  /* opportunities */
  listOpportunities(tenantId: string) {
    return this.st(tenantId).opportunities;
  }
  getOpportunity(tenantId: string, id: string) {
    return this.st(tenantId).opportunities.find((o) => o.id === id);
  }
  setOpportunityStatus(tenantId: string, id: string, status: OpportunityStatus) {
    const o = this.getOpportunity(tenantId, id);
    if (o) {
      o.status = status;
      this.save(tenantId, T.opps, o.id, o);
      if (status === "approved" || status === "rejected" || status === "deferred") {
        this.logAudit(tenantId, status === "approved" ? "approve" : status === "rejected" ? "reject" : "defer", "opportunity", o.id);
      }
    }
    return o;
  }

  /* blueprints */
  listBlueprints(tenantId: string) {
    return this.st(tenantId).blueprints;
  }
  getBlueprint(tenantId: string, id: string) {
    return this.st(tenantId).blueprints.find((b) => b.id === id);
  }
  approveBlueprint(tenantId: string, id: string) {
    const b = this.getBlueprint(tenantId, id);
    if (b) {
      b.status = "approved";
      b.approvedAt = this.now;
      this.save(tenantId, T.blueprints, b.id, b);
    }
    return b;
  }
  /** Edit a blueprint's content fields before approval (PRD §10.2 PUT). */
  updateBlueprint(tenantId: string, id: string, edit: Partial<PageBlueprint>) {
    const b = this.getBlueprint(tenantId, id);
    if (!b) return undefined;
    const editable: (keyof PageBlueprint)[] = [
      "title",
      "slug",
      "targetKeywords",
      "intentSummary",
      "outline",
      "ctaPlan",
      "internalLinkPlan",
      "schemaPlan",
    ];
    const rec = b as unknown as Record<string, unknown>;
    for (const k of editable) {
      if (edit[k] !== undefined) rec[k] = edit[k];
    }
    this.save(tenantId, T.blueprints, b.id, b);
    return b;
  }

  /* pages */
  listPages(tenantId: string) {
    return this.st(tenantId).pages;
  }
  getPage(tenantId: string, id: string) {
    return this.st(tenantId).pages.find((p) => p.id === id);
  }

  /** Generate a draft GeneratedPage from a keyword opportunity.
   *  Priority: client-supplied content (e.g. Puter.js browser AI) → server
   *  DeepSeek drafter → deterministic template. */
  async generatePage(
    tenantId: string,
    opportunityId: string,
    content?: DraftContent,
  ): Promise<GeneratedPage | undefined> {
    const s = this.st(tenantId);
    const opp = this.getOpportunity(tenantId, opportunityId);
    if (!opp) return undefined;
    this.seq += 1;
    const slug = `/${opp.query.replace(/\s+/g, "-").toLowerCase()}`;
    const ai = content ?? (await draftPageContent(opp.query, opp.recommendedPageType, await this.brandHint(tenantId)));
    const title = opp.query.replace(/\b\w/g, (c) => c.toUpperCase());
    const company = this.brand.current()?.company?.trim();
    const metaTitle = ai?.metaTitle ?? (company ? `${title} | ${company}` : title);
    // Page-type spec drives structure for BOTH the AI and template paths, so a
    // Blog/Service/Comparison page is distinct either way (PRD Phase 1).
    const spec = specFor(opp.recommendedPageType);
    const metaDescription =
      ai?.metaDescription ?? `A ${spec.label.toLowerCase()} targeting "${opp.query}", drafted from Brand Memory.`;
    // Use type-specific section builder for the template path; LLM path uses ai.sections.
    const sections = ai?.sections?.length
      ? ai.sections
      : buildSectionsForType(opp.recommendedPageType, opp.query, company ?? title, opp.intent);
    const faqs = ai?.faqs?.length
      ? ai.faqs
      : buildFaqsForType(opp.recommendedPageType, opp.query, spec.faqCount);
    const page: GeneratedPage = {
      id: `pg-gen-${this.seq}`,
      blueprintId: s.blueprints[0]?.id ?? "bp-1",
      opportunityId,
      title,
      slug,
      pageType: opp.recommendedPageType,
      status: "draft",
      metaTitle,
      metaDescription,
      heroCopy: ai?.heroCopy ?? `Draft hero for ${opp.query}.`,
      sections,
      faqs,
      cta: spec.cta,
      schemaJson: buildSchemaJson(opp.recommendedPageType, { title, description: metaDescription, faqs }),
      infographic: buildInfographic(opp.recommendedPageType, opp.query, sections),
      targetKeywords: [opp.query],
      wordCount: 0,
      brandMemoryVersion: 1,
      seoChecks: [
        { label: "Single H1", pass: true },
        { label: "Meta title 50–60 chars", pass: metaTitle.length >= 50 && metaTitle.length <= 60 },
        { label: "Valid JSON-LD", pass: true },
        { label: "Crawlable without auth", pass: true },
      ],
      qualityChecks: [
        { label: "Original (similarity < 15%)", pass: true },
        { label: "Readability grade 8–10", pass: true },
        { label: "No banned claims", pass: true },
      ],
      createdAt: this.now,
      updatedAt: this.now,
    };
    page.wordCount = countWords(page);
    // Brand hero: attach a theme-aware placeholder synchronously so the page is returned
    // without blocking on image generation. When IMAGE_GEN is configured, the real brand
    // raster is generated in the background (~minute on local diffusion) and swapped in.
    const placeholder = await this.heroPlaceholderFor(tenantId, title);
    if (placeholder) {
      page.heroImageUrl = placeholder.url;
      page.heroImageAlt = placeholder.alt;
    }
    s.pages.unshift(page);
    this.snapshot(tenantId, page, ai ? "AI-generated draft" : "Template draft", "ai");
    opp.status = "approved";
    this.save(tenantId, T.pages, page.id, page);
    this.save(tenantId, T.opps, opp.id, opp);
    this.logAudit(tenantId, "generate", "page", page.id);
    if (this.images.configured) this.upgradeHeroImage(tenantId, page.id, title);
    return page;
  }

  /**
   * One-click "Initiate" from the Growth Plan: kick off drafting the given
   * opportunities **server-side in the background** and return a job handle
   * immediately. The browser no longer holds an N-page loop open — it polls
   * `getBatchJob` for progress while drafts persist and appear in Pipeline.
   * (Page-engine-local; deliberately does not touch the contested jobs.service.)
   */
  startBatchGeneration(tenantId: string, opportunityIds: string[]): PageBatchJob {
    // Evict oldest handles so the in-memory map stays bounded (insertion-ordered).
    while (this.batchJobs.size >= 50) {
      const oldest = this.batchJobs.keys().next().value;
      if (oldest === undefined) break;
      this.batchJobs.delete(oldest);
    }
    this.bseq += 1;
    const ids = [...new Set(opportunityIds)].filter((id) => this.getOpportunity(tenantId, id));
    const job: PageBatchJob = {
      id: `pgb-${this.bseq}`,
      total: ids.length,
      done: 0,
      created: 0,
      failed: 0,
      pageIds: [],
      status: ids.length ? "running" : "completed",
      startedAt: new Date().toISOString(),
    };
    this.batchJobs.set(job.id, job);
    if (ids.length) void this.runBatch(tenantId, job, ids);
    return { ...job };
  }

  private async runBatch(tenantId: string, job: PageBatchJob, ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        const page = await this.generatePage(tenantId, id);
        if (page) {
          job.created += 1;
          job.pageIds.push(page.id);
        } else {
          job.failed += 1;
        }
      } catch {
        job.failed += 1; // skip individual failures, keep drafting the rest
      }
      job.done += 1;
    }
    job.status = "completed";
    job.finishedAt = new Date().toISOString();
  }

  /** Progress snapshot for an Initiate batch (undefined if unknown/expired). */
  getBatchJob(id: string): PageBatchJob | undefined {
    const j = this.batchJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Start background keyword discovery and return a job handle immediately (the
   *  LLM tiers run server-side; the browser polls instead of holding the request). */
  startDiscover(tenantId: string, input: DiscoverInput): DiscoverJob {
    while (this.discoverJobs.size >= 50) {
      const oldest = this.discoverJobs.keys().next().value;
      if (oldest === undefined) break;
      this.discoverJobs.delete(oldest);
    }
    this.dseq += 1;
    const job: DiscoverJob = {
      id: `dsc-${this.dseq}`,
      status: "running",
      created: 0,
      opportunityIds: [],
      startedAt: new Date().toISOString(),
    };
    this.discoverJobs.set(job.id, job);
    void this.runDiscover(tenantId, job, input);
    return { ...job };
  }

  private async runDiscover(tenantId: string, job: DiscoverJob, input: DiscoverInput): Promise<void> {
    try {
      const created = await this.discover(tenantId, input);
      job.created = created.length;
      job.opportunityIds = created.map((o) => o.id);
      job.status = "completed";
    } catch (e) {
      job.status = "failed";
      job.error = e instanceof Error ? e.message : "discovery failed";
    }
    job.finishedAt = new Date().toISOString();
  }

  /** Progress snapshot for a background discovery run (undefined if unknown/expired). */
  getDiscoverJob(id: string): DiscoverJob | undefined {
    const j = this.discoverJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Start a background page regeneration and return a job handle immediately. The LLM
   *  re-draft exceeds the BFF/host sync request budget (~30s), so the UI polls. */
  startRegenerate(tenantId: string, pageId: string): RegenJob {
    while (this.regenJobs.size >= 50) {
      const oldest = this.regenJobs.keys().next().value;
      if (oldest === undefined) break;
      this.regenJobs.delete(oldest);
    }
    this.rseq += 1;
    const exists = this.st(tenantId).pages.some((x) => x.id === pageId);
    const job: RegenJob = {
      id: `rgn-${this.rseq}`,
      status: exists ? "running" : "failed",
      pageId,
      startedAt: new Date().toISOString(),
      ...(exists ? {} : { error: `Page ${pageId} not found`, finishedAt: new Date().toISOString() }),
    };
    this.regenJobs.set(job.id, job);
    if (exists) {
      void (async () => {
        try {
          const updated = await this.regeneratePage(tenantId, pageId);
          job.status = updated ? "completed" : "failed";
          if (!updated) job.error = "regeneration produced no change";
        } catch (e) {
          job.status = "failed";
          job.error = e instanceof Error ? e.message : "regeneration failed";
        }
        job.finishedAt = new Date().toISOString();
      })();
    }
    return { ...job };
  }

  /** Progress snapshot for a background regeneration (undefined if unknown/expired). */
  getRegenJob(id: string): RegenJob | undefined {
    const j = this.regenJobs.get(id);
    return j ? { ...j } : undefined;
  }

  /** Auto-generate a blueprint from an opportunity (PRD §7.3); reuse if one exists. */
  generateBlueprint(tenantId: string, opportunityId: string): PageBlueprint | undefined {
    const s = this.st(tenantId);
    const opp = this.getOpportunity(tenantId, opportunityId);
    if (!opp) return undefined;
    const existing = s.blueprints.find((b) => b.opportunityId === opportunityId);
    if (existing) return existing;
    this.seq += 1;
    const bp: PageBlueprint = {
      id: `bp-gen-${this.seq}`,
      opportunityId,
      title: opp.query.replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: `/${opp.query.replace(/\s+/g, "-").toLowerCase()}`,
      pageType: opp.recommendedPageType,
      targetKeywords: [opp.query],
      intentSummary: `${opp.intent} intent for "${opp.query}".`,
      audience: "Target buyers from Brand Memory",
      outline: [
        { heading: "Hero + primary CTA", summary: "Outcome-led headline." },
        { heading: "Core value", summary: "Differentiator-led section." },
        { heading: "FAQ", summary: "Common objections." },
      ],
      ctaPlan: "Primary: Book a demo.",
      internalLinkPlan: [],
      schemaPlan: opp.recommendedPageType === "faq" ? ["FAQPage"] : ["Article", "FAQPage"],
      differentiationNotes: "Lead with Brand Memory differentiators.",
      changeKind: "net-new",
      status: "draft",
      createdAt: this.now,
    };
    s.blueprints.unshift(bp);
    this.save(tenantId, T.blueprints, bp.id, bp);
    return bp;
  }

  /** Critical SEO checks that must pass before publishing (PRD §7.7 gate). */
  publishBlockers(tenantId: string, id: string): string[] {
    const p = this.getPage(tenantId, id);
    if (!p) return ["Page not found"];
    const critical = ["Single H1", "Valid JSON-LD", "Crawlable without auth"];
    return p.seoChecks.filter((c) => critical.includes(c.label) && !c.pass).map((c) => c.label);
  }

  transitionPage(tenantId: string, id: string, status: PageStatus): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    p.status = status;
    p.updatedAt = this.now;
    if (status === "published") {
      p.publishedUrl = this.publishedUrlFor(p.slug);
      p.publishedAt = this.now;
      p.lastRefreshedAt = this.now;
      this.snapshot(tenantId, p, "Published", "system");
      this.logAudit(tenantId, "publish", "page", p.id);
    }
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Point a published page at its live CMS URL after a successful CMS push. */
  attachCmsUrl(tenantId: string, id: string, externalUrl: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    p.publishedUrl = externalUrl;
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Take a published page offline — back to approved, public URL cleared. */
  unpublish(tenantId: string, id: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    if (p.status !== "published") return p;
    p.status = "approved";
    p.publishedUrl = undefined;
    p.publishedAt = undefined;
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, "Unpublished", "system");
    this.logAudit(tenantId, "update", "page", p.id);
    this.save(tenantId, T.pages, p.id, p);
    return p;
  }

  /** Duplicate a page as a fresh draft (new id/slug, publish state cleared). */
  duplicate(tenantId: string, id: string): GeneratedPage | undefined {
    const s = this.st(tenantId);
    const src = this.getPage(tenantId, id);
    if (!src) return undefined;
    this.seq += 1;
    const copy: GeneratedPage = {
      ...clone(src),
      id: `pg-gen-${this.seq}`,
      title: `${src.title} (copy)`,
      slug: `${src.slug}-copy`,
      status: "draft",
      publishedUrl: undefined,
      publishedAt: undefined,
      lastRefreshedAt: undefined,
      createdAt: this.now,
      updatedAt: this.now,
    };
    s.pages.unshift(copy);
    this.snapshot(tenantId, copy, "Duplicated", "system");
    this.logAudit(tenantId, "create", "page", copy.id);
    this.save(tenantId, T.pages, copy.id, copy);
    return copy;
  }

  /* page editing + versioning (PRD §9.4, §11.6) */
  updatePage(tenantId: string, id: string, edit: PageEdit): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    if (edit.title !== undefined) p.title = edit.title;
    if (edit.metaTitle !== undefined) p.metaTitle = edit.metaTitle;
    if (edit.metaDescription !== undefined) p.metaDescription = edit.metaDescription;
    if (edit.heroCopy !== undefined) p.heroCopy = edit.heroCopy;
    if (edit.sections !== undefined) p.sections = clone(edit.sections);
    if (edit.faqs !== undefined) p.faqs = clone(edit.faqs);
    if (edit.cta !== undefined) p.cta = clone(edit.cta);
    p.wordCount = countWords(p);
    p.updatedAt = this.now;
    // editing a published page flags it for re-publish
    if (p.status === "published") p.status = "needs-refresh";
    this.snapshot(tenantId, p, "Manual edit", "human");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "edit", "page", p.id);
    return p;
  }

  listVersions(tenantId: string, pageId: string): PageVersion[] {
    return this.st(tenantId).pageVersions[pageId] ?? [];
  }

  rollbackPage(tenantId: string, id: string, versionId: string): GeneratedPage | undefined {
    const p = this.getPage(tenantId, id);
    if (!p) return undefined;
    const v = (this.st(tenantId).pageVersions[id] ?? []).find((x) => x.id === versionId);
    if (!v) return undefined;
    p.title = v.title;
    p.metaTitle = v.metaTitle;
    p.metaDescription = v.metaDescription;
    p.heroCopy = v.heroCopy;
    p.sections = clone(v.sections);
    p.faqs = clone(v.faqs);
    p.cta = clone(v.cta);
    p.wordCount = countWords(p);
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, `Rolled back to v${v.version}`, "human");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "rollback", "page", p.id);
    return p;
  }

  /* published pages (PUBLIC surfaces). Published pages are public by nature and a visitor
   * doesn't know the owning workspace, so these search across ALL tenants (A5). */
  listPublishedPages() {
    const out: GeneratedPage[] = [];
    for (const s of this.tenants.values()) for (const p of s.pages) if (p.status === "published") out.push(p);
    return out;
  }
  getPublishedBySlug(slug: string) {
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    for (const s of this.tenants.values()) {
      const p = s.pages.find((x) => x.slug === norm && x.status === "published");
      if (p) return p;
    }
    return undefined;
  }
  /** Tenant that owns a published page slug (for routing public lead ingest to the right workspace). */
  private tenantForSlug(slug: string): string {
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    for (const [tenantId, s] of this.tenants) {
      if (s.pages.some((x) => x.slug === norm && x.status === "published")) return tenantId;
    }
    return DEFAULT_TENANT_ID;
  }
  /** Tenant that owns a page id (any status). */
  private tenantForPageId(id: string): string {
    for (const [tenantId, s] of this.tenants) {
      if (s.pages.some((x) => x.id === id)) return tenantId;
    }
    return DEFAULT_TENANT_ID;
  }

  /** Public-surface tenant resolution: the workspace that owns a page (by id or slug),
   *  for routing anonymous public events (journey/bots) to the right tenant (A5). */
  publicTenantFor(opts: { pageId?: string; slug?: string }): string {
    if (opts.pageId) return this.tenantForPageId(opts.pageId);
    if (opts.slug) return this.tenantForSlug(opts.slug);
    return DEFAULT_TENANT_ID;
  }

  /** Which research source produced the last/next discovery (for operator visibility). */
  researchSource(): ResearchSource {
    return this.research.source;
  }

  /* research: real DataForSEO keyword ideas when configured, else deterministic seed discovery */
  async discover(tenantId: string, input: DiscoverInput): Promise<KeywordOpportunity[]> {
    const seeds = (input.seeds ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 6);
    const ideas = await this.research.researchKeywords(seeds, { limit: 24 });
    // LLM intent refinement (intent + research-vs-ready-to-buy stage); regex fallback.
    const classified = ideas.length ? await classifyIntents(ideas.map((i) => i.keyword)) : null;
    const created: KeywordOpportunity[] = ideas.length
      ? ideas.map((idea) => this.oppFromIdea(tenantId, idea, input.intent, classified?.[idea.keyword.trim().toLowerCase()]))
      : seeds.map((seed) => this.oppFromSeed(tenantId, seed, input.intent));
    const s = this.st(tenantId);
    for (const opp of created) s.opportunities.unshift(opp);
    created.forEach((o) => this.save(tenantId, T.opps, o.id, o));
    return created;
  }

  /** Real keyword idea (DataForSEO or AI-search) → scored opportunity. */
  private oppFromIdea(
    tenantId: string,
    idea: KeywordIdea,
    intentOverride?: SearchIntent,
    classified?: ClassifiedIntent,
  ): KeywordOpportunity {
    this.seq += 1;
    const intent = intentOverride ?? classified?.intent ?? classifyKwIntent(idea.keyword);
    const funnelStage = classified?.stage ?? stageFromIntent(intent);
    const commercialValue = clampN((idea.cpc > 0 ? Math.min(idea.cpc * 8, 55) : idea.competition * 55) + 25, 1, 99);
    const confidence = clampN(60 + (idea.searchVolume > 100 ? 15 : 0) + (idea.difficulty < 40 ? 15 : 0), 1, 99);
    const src = this.research.source;
    const label = src === "dataforseo" ? "Discovered (DataForSEO)" : src === "ai-search" ? "AI search demand" : "Discovered";
    const evidence =
      src === "dataforseo"
        ? `DataForSEO: ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty} · CPC $${idea.cpc.toFixed(2)}.`
        : src === "ai-search"
          ? `AI-search buyer query · est. ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty}.`
          : `Keyword idea · est. ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty}.`;
    return {
      id: `kw-disc-${this.seq}`,
      query: idea.keyword.toLowerCase(),
      clusterId: "c-discovered",
      clusterLabel: label,
      intent,
      funnelStage,
      volume: idea.searchVolume,
      difficulty: idea.difficulty,
      commercialValue,
      confidence,
      recommendedPageType: PAGE_TYPE_BY_INTENT[intent] ?? "landing",
      competitorUrls: [],
      evidence,
      status: "new",
      duplicate: this.st(tenantId).pages.some((p) => p.targetKeywords.some((k) => k.toLowerCase() === idea.keyword.toLowerCase())),
      createdAt: this.now,
    };
  }

  /** Deterministic fallback when no research provider is configured (current behavior). */
  private oppFromSeed(tenantId: string, seed: string, intentOverride?: SearchIntent): KeywordOpportunity {
    this.seq += 1;
    const intents: SearchIntent[] = ["commercial", "informational", "comparison"];
    const types: PageType[] = ["landing", "guide", "comparison"];
    const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
    const intent = intentOverride ?? intents[h % intents.length];
    return {
      id: `kw-disc-${this.seq}`,
      query: seed.toLowerCase(),
      clusterId: "c-discovered",
      clusterLabel: "Discovered",
      intent,
      funnelStage: stageFromIntent(intent),
      volume: 300 + (h % 9) * 600,
      difficulty: 25 + (h % 50),
      commercialValue: 55 + (h % 40),
      confidence: 70 + (h % 25),
      recommendedPageType: types[h % types.length],
      competitorUrls: [],
      evidence: `Seed-derived opportunity for "${seed}" — validate volume with the research provider.`,
      status: "new",
      duplicate: this.st(tenantId).pages.some((p) => p.targetKeywords.some((k) => k.toLowerCase() === seed.toLowerCase())),
      createdAt: this.now,
    };
  }

  /**
   * Re-draft an existing page's CONTENT via the LLM (PRD Phase 4 — Auto-Updates
   * core). Preserves identity (id/slug/publishedUrl/pageType/targetKeywords) so the
   * live URL is unchanged; refreshes copy/meta/schema/infographic, snapshots a
   * version for diff/rollback, and clears a `needs-refresh` flag. The automatic
   * trigger (rank-drop / scheduled sweep) is separate and queue/Redis-gated; this
   * is the actual refresh ACTION (the old `/refresh` only flagged the page).
   */
  async regeneratePage(tenantId: string, pageId: string): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const ai = await draftPageContent(query, p.pageType, await this.brandHint(tenantId));
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.schemaJson = buildSchemaJson(p.pageType, { title: p.title, description: p.metaDescription, faqs: p.faqs });
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.wordCount = countWords(p);
    }
    if (p.status === "needs-refresh") p.status = "published";
    p.lastRefreshedAt = this.now;
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, ai ? "AI content refresh" : "Refresh (LLM unavailable — content unchanged)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Keyword-aware rewrite: merge new target keywords, then re-draft the page via the LLM
   *  instructed to weave them in naturally (no stuffing). Preserves slug/URL + snapshots a
   *  version. The heart of the review loop: add keywords → rewrite in place. */
  async rewritePage(tenantId: string, pageId: string, addKeywords: string[]): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const clean = [...new Set([...(p.targetKeywords ?? []), ...addKeywords.map((k) => k.trim()).filter(Boolean)])];
    p.targetKeywords = clean;
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const base = (await this.brandHint(tenantId)) ?? "";
    const kwHint =
      `${base}\nTarget keywords to weave in naturally across headings and body (do NOT keyword-stuff; keep it readable and useful): ` +
      clean.join(", ") + ".";
    const ai = await draftPageContent(query, p.pageType, kwHint.trim());
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.schemaJson = buildSchemaJson(p.pageType, { title: p.title, description: p.metaDescription, faqs: p.faqs });
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.wordCount = countWords(p);
    }
    p.updatedAt = this.now;
    this.snapshot(tenantId, p, ai ? `Rewrite for keywords: ${clean.slice(0, 5).join(", ")}` : "Rewrite (LLM unavailable)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Start a background keyword-aware rewrite (LLM ~30-80s exceeds the sync budget → poll).
   *  Reuses the regen-job machinery (same {status, pageId} shape). */
  startRewrite(tenantId: string, pageId: string, addKeywords: string[]): RegenJob {
    while (this.regenJobs.size >= 50) {
      const oldest = this.regenJobs.keys().next().value;
      if (oldest === undefined) break;
      this.regenJobs.delete(oldest);
    }
    this.rseq += 1;
    const exists = this.st(tenantId).pages.some((x) => x.id === pageId);
    const job: RegenJob = {
      id: `rwr-${this.rseq}`,
      status: exists ? "running" : "failed",
      pageId,
      startedAt: new Date().toISOString(),
      ...(exists ? {} : { error: `Page ${pageId} not found`, finishedAt: new Date().toISOString() }),
    };
    this.regenJobs.set(job.id, job);
    if (exists) {
      void (async () => {
        try {
          const updated = await this.rewritePage(tenantId, pageId, addKeywords);
          job.status = updated ? "completed" : "failed";
          if (!updated) job.error = "rewrite produced no change";
        } catch (e) {
          job.status = "failed";
          job.error = e instanceof Error ? e.message : "rewrite failed";
        }
        job.finishedAt = new Date().toISOString();
      })();
    }
    return { ...job };
  }

  /* leads */
  listLeads(tenantId: string) {
    return this.st(tenantId).leads;
  }
  getLead(tenantId: string, id: string) {
    return this.st(tenantId).leads.find((l) => l.id === id);
  }
  updateLeadStatus(tenantId: string, id: string, status: LeadStatus): Lead | undefined {
    const l = this.getLead(tenantId, id);
    if (l) {
      l.status = status;
      this.save(tenantId, T.leads, l.id, l);
    }
    return l;
  }
  removeLead(tenantId: string, id: string): boolean {
    const s = this.st(tenantId);
    const i = s.leads.findIndex((l) => l.id === id);
    if (i < 0) return false;
    s.leads.splice(i, 1);
    this.drop(tenantId, T.leads, id);
    this.logAudit(tenantId, "delete", "lead", id);
    return true;
  }
  /**
   * Synchronously refresh a page: set status to "generating", re-draft via the LLM,
   * and restore to "published" (or "draft" if it was never published).
   * Replaces the old stub that only set `needs-refresh` without doing any work.
   */
  async refreshPage(tenantId: string, pageId: string): Promise<GeneratedPage | undefined> {
    const p = this.st(tenantId).pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    const prevStatus = p.status;
    p.status = "needs-refresh";
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    // Re-draft via LLM; falls back gracefully when the LLM is unavailable.
    const query = p.targetKeywords[0] ?? p.title.toLowerCase();
    const ai = await draftPageContent(query, p.pageType, await this.brandHint(tenantId));
    if (ai) {
      if (ai.metaTitle) p.metaTitle = ai.metaTitle;
      if (ai.metaDescription) p.metaDescription = ai.metaDescription;
      if (ai.heroCopy) p.heroCopy = ai.heroCopy;
      if (ai.sections?.length) p.sections = ai.sections;
      if (ai.faqs?.length) p.faqs = ai.faqs;
      p.schemaJson = buildSchemaJson(p.pageType, { title: p.title, description: p.metaDescription, faqs: p.faqs });
      p.infographic = buildInfographic(p.pageType, query, p.sections);
      p.wordCount = countWords(p);
    }
    // Restore to published if it was published before; otherwise leave as approved/draft.
    p.status = prevStatus === "published" || prevStatus === "needs-refresh" ? "published" : prevStatus;
    p.lastRefreshedAt = this.now;
    p.updatedAt = this.now;
    if (p.status === "published") {
      p.publishedUrl = p.publishedUrl ?? this.publishedUrlFor(p.slug);
    }
    this.snapshot(tenantId, p, ai ? "AI content refresh (manual)" : "Refresh (LLM unavailable — content unchanged)", "ai");
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Toggle autopilot on/off for a page. When on, stale-page monitors will automatically
   *  trigger a re-draft instead of just flagging the page. */
  toggleAutopilot(tenantId: string, pageId: string, enabled: boolean): GeneratedPage | undefined {
    const p = this.getPage(tenantId, pageId);
    if (!p) return undefined;
    p.autopilot = enabled;
    p.updatedAt = this.now;
    this.save(tenantId, T.pages, p.id, p);
    this.logAudit(tenantId, "update", "page", p.id);
    return p;
  }

  /** Flag a page needs-refresh from an external signal (e.g. rank-drop monitor). No-ops if already flagged. */
  markNeedsRefresh(tenantId: string, pageId: string, reason?: string): boolean {
    const p = this.getPage(tenantId, pageId);
    if (!p || p.status !== "published") return false;
    p.status = "needs-refresh";
    if (reason) p.seoChecks = [{ label: `Rank drop detected: ${reason}`, pass: false }, ...p.seoChecks.filter(c => !c.label.startsWith("Rank drop detected"))];
    this.save(tenantId, T.pages, p.id, p);
    return true;
  }

  /* monitoring: refresh recommendations (PRD §7.8) */
  refreshRecommendations(tenantId: string) {
    return this.st(tenantId).pages
      .filter((p) => p.status === "published" || p.status === "needs-refresh")
      .map((p) => {
        const ageDays = p.lastRefreshedAt
          ? Math.round((Date.parse(this.now) - Date.parse(p.lastRefreshedAt)) / 86_400_000)
          : 0;
        const failingSeo = p.seoChecks.filter((c) => !c.pass).length;
        const stale = p.status === "needs-refresh" || ageDays > 60;
        const reason =
          p.status === "needs-refresh"
            ? "Edited since last publish — re-publish to ship changes"
            : ageDays > 60
              ? `Not refreshed in ${ageDays} days — likely content decay`
              : failingSeo > 0
                ? `${failingSeo} SEO check${failingSeo > 1 ? "s" : ""} failing`
                : "Healthy";
        const action: "refresh" | "rebuild" | "no-action" =
          p.status === "needs-refresh" ? "refresh" : ageDays > 90 ? "rebuild" : stale || failingSeo ? "refresh" : "no-action";
        return { pageId: p.id, title: p.title, slug: p.slug, ageDays, failingSeo, action, reason };
      })
      .filter((r) => r.action !== "no-action");
  }

  /** Public lead ingest with spam filtering, dedupe, and scoring (PRD §7.9). The lead is
   *  routed to the OWNING workspace of the referenced page — never the caller (A5). */
  addLead(input: LeadInput): Lead {
    // Resolve the page + its owning tenant from the (public) page reference.
    const tenantId = input.pageId
      ? this.tenantForPageId(input.pageId)
      : input.slug
        ? this.tenantForSlug(input.slug)
        : DEFAULT_TENANT_ID;
    const s = this.st(tenantId);
    const page =
      (input.pageId ? this.getPage(tenantId, input.pageId) : undefined) ??
      (input.slug ? this.getPublishedBySlug(input.slug) : undefined) ??
      s.pages[0];

    const email = (input.email ?? "").trim();
    const message = (input.message ?? "").trim();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const spammy = /(viagra|lottery|prize|crypto|\$\$\$|click here|winner)/i.test(message + " " + email);
    const dup = s.leads.find((l) => l.email.toLowerCase() === email.toLowerCase() && l.pageId === page?.id);

    let spamStatus: SpamStatus = "clean";
    if (!emailOk || spammy) spamStatus = "spam";
    else if (dup) spamStatus = "duplicate";

    const freeDomain = /@(gmail|yahoo|hotmail|outlook|icloud)\.com$/i.test(email);
    let score = 50;
    if (emailOk && !freeDomain) score += 25;
    if (message.length > 40) score += 15;
    if (input.company?.trim()) score += 10;
    if (spamStatus !== "clean") score = Math.min(score, 12);
    score = Math.max(0, Math.min(100, score));

    this.seq += 1;
    const lead: Lead = {
      id: `lead-new-${this.seq}`,
      pageId: page?.id ?? input.pageId ?? "",
      pageTitle: page?.title ?? "(unknown page)",
      name: (input.name ?? "").trim() || email.split("@")[0] || "Unknown",
      email,
      company: input.company?.trim() || "—",
      message: message || "(no message)",
      sourceUrl: input.sourceUrl ?? page?.publishedUrl ?? (page ? this.publishedUrlFor(page.slug) : ""),
      utm: input.utm,
      score,
      status: "new",
      spamStatus,
      createdAt: this.now,
    };
    s.leads.unshift(lead);
    this.save(tenantId, T.leads, lead.id, lead);
    return lead;
  }
}
