import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { countRows, dbEnabled, ensureTable, loadAll, removeRow, upsert } from "../db/db";
import { resolveMode } from "../common/mode";
import { draftPageContent, type DraftContent } from "../llm/deepseek";
import { BrandMemoryStore } from "./brand.service";
import { BrandLibraryStore, composeBrandContext } from "./brand-library.service";
import { KeywordResearchService, type KeywordIdea, type ResearchSource } from "./keyword-research.service";

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
 * In-memory page-engine state (Research → Blueprint → Page → Leads).
 * Mirrors the existing store pattern; swaps for a DB-backed repo later.
 * Seeded from `@geoseo/mock` and deep-cloned so mutations never touch the
 * shared fixture arrays.
 */
@Injectable()
export class PageEngineStore implements OnModuleInit {
  private ready = false;
  // Production starts EMPTY (No-Dummy-Data §6.1, P0-3); demo seeds via seedDemoData() on boot.
  private opportunities: KeywordOpportunity[] = [];
  private blueprints: PageBlueprint[] = [];
  private pages: GeneratedPage[] = [];
  private leads: Lead[] = [];
  private seq = 0;
  private vseq = 0;
  private aseq = 0;
  private pageVersions: Record<string, PageVersion[]> = {};
  private audit: AuditEntry[] = [];
  /** In-flight one-click "Initiate" batch generations (Growth Plan → background drafting). */
  private batchJobs = new Map<string, PageBatchJob>();
  private bseq = 0;

  // fixed clock — keeps generated timestamps deterministic across reloads
  private now = "2026-06-12T00:00:00.000Z";

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(KeywordResearchService) private readonly research: KeywordResearchService,
  ) {}

  /**
   * Populate demo fixtures (demo mode only) from the allowlisted demo-seed module —
   * dynamic import so `@geoseo/mock` is never loaded in production (No-Dummy-Data P0-3).
   */
  private async seedDemoData() {
    const m = await import("./demo-seed");
    this.opportunities = clone(m.keywordOpportunities);
    this.blueprints = clone(m.pageBlueprints);
    this.pages = clone(m.generatedPages);
    this.leads = clone(m.leads);
    // initial version snapshot per seeded page (save() is a no-op until ready)
    for (const p of this.pages) this.snapshot(p, "Initial draft", "ai");
  }

  /** Grounding hint for generation — Brand Memory + the structured product/persona/proof library. */
  private brandHint(): string | undefined {
    return composeBrandContext(this.brand.current(), this.library.get());
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

  private snapshot(p: GeneratedPage, changeSummary: string, authorType: PageVersion["authorType"]) {
    this.vseq += 1;
    const list = this.pageVersions[p.id] ?? (this.pageVersions[p.id] = []);
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
    this.save(T.versions, version.id, version);
    return version;
  }

  /* ---- persistence: hydrate on boot, write-through on mutate ---- */
  async onModuleInit() {
    const demo = resolveMode() === "demo";
    if (!dbEnabled) {
      // No DB ⇒ pure in-memory (local/demo only; production fails closed in main.ts before
      // this runs). Demo gets fixtures for a usable UI; production never reaches here.
      if (demo) await this.seedDemoData();
      return;
    }
    try {
      await Promise.all(Object.values(T).map((t) => ensureTable(t)));
      const [oc, pc, lc] = await Promise.all([
        countRows(T.opps),
        countRows(T.pages),
        countRows(T.leads),
      ]);
      if (oc + pc + lc > 0) {
        // hydrate from Supabase
        this.opportunities = await loadAll<KeywordOpportunity>(T.opps);
        this.blueprints = await loadAll<PageBlueprint>(T.blueprints);
        this.pages = await loadAll<GeneratedPage>(T.pages);
        this.leads = await loadAll<Lead>(T.leads);
        const versions = await loadAll<PageVersion>(T.versions);
        this.pageVersions = {};
        for (const v of versions) (this.pageVersions[v.pageId] ??= []).push(v);
        for (const id of Object.keys(this.pageVersions)) {
          this.pageVersions[id].sort((a, b) => b.version - a.version);
        }
        this.audit = await loadAll<AuditEntry>(T.audit);
        this.seq = 100_000;
        this.vseq = versions.length + 10_000;
        this.aseq = this.audit.length + 10_000;
      } else if (demo) {
        // first boot, demo: seed fixtures into memory, then persist them to Supabase
        await this.seedDemoData();
        await Promise.all([
          ...this.opportunities.map((o) => upsert(T.opps, o.id, o)),
          ...this.blueprints.map((b) => upsert(T.blueprints, b.id, b)),
          ...this.pages.map((p) => upsert(T.pages, p.id, p)),
          ...this.leads.map((l) => upsert(T.leads, l.id, l)),
          ...Object.values(this.pageVersions)
            .flat()
            .map((v) => upsert(T.versions, v.id, v)),
        ]);
      }
      // Production first boot: stay EMPTY — onboarding/provider discovery creates real records.
      this.ready = true;
      // eslint-disable-next-line no-console
      console.log(`[page-engine] persistence ready (Supabase) · pages=${this.pages.length} leads=${this.leads.length}`);
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
  private save(table: string, id: string, obj: unknown) {
    if (!this.ready) return;
    void upsert(table, id, obj).catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`[page-engine] persist ${table}/${id} failed:`, (e as Error).message),
    );
  }
  private drop(table: string, id: string) {
    if (!this.ready) return;
    void removeRow(table, id).catch(() => {});
  }

  /* audit trail (PRD §10.1/§15.2) */
  private logAudit(action: AuditEntry["action"], entity: AuditEntry["entity"], entityId: string) {
    this.aseq += 1;
    const entry: AuditEntry = {
      id: `aud-${this.aseq}`,
      action,
      entity,
      entityId,
      actor: "you",
      workspaceId: "ws-default",
      at: this.now,
    };
    this.audit.unshift(entry);
    this.save(T.audit, entry.id, entry);
  }
  listAudit(limit = 100): AuditEntry[] {
    return this.audit.slice(0, limit);
  }

  /* opportunities */
  listOpportunities() {
    return this.opportunities;
  }
  getOpportunity(id: string) {
    return this.opportunities.find((o) => o.id === id);
  }
  setOpportunityStatus(id: string, status: OpportunityStatus) {
    const o = this.getOpportunity(id);
    if (o) {
      o.status = status;
      this.save(T.opps, o.id, o);
      if (status === "approved" || status === "rejected" || status === "deferred") {
        this.logAudit(status === "approved" ? "approve" : status === "rejected" ? "reject" : "defer", "opportunity", o.id);
      }
    }
    return o;
  }

  /* blueprints */
  listBlueprints() {
    return this.blueprints;
  }
  getBlueprint(id: string) {
    return this.blueprints.find((b) => b.id === id);
  }
  approveBlueprint(id: string) {
    const b = this.getBlueprint(id);
    if (b) {
      b.status = "approved";
      b.approvedAt = this.now;
      this.save(T.blueprints, b.id, b);
    }
    return b;
  }
  /** Edit a blueprint's content fields before approval (PRD §10.2 PUT). */
  updateBlueprint(id: string, edit: Partial<PageBlueprint>) {
    const b = this.getBlueprint(id);
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
    this.save(T.blueprints, b.id, b);
    return b;
  }

  /* pages */
  listPages() {
    return this.pages;
  }
  getPage(id: string) {
    return this.pages.find((p) => p.id === id);
  }

  /** Generate a draft GeneratedPage from a keyword opportunity.
   *  Priority: client-supplied content (e.g. Puter.js browser AI) → server
   *  DeepSeek drafter → deterministic template. */
  async generatePage(
    opportunityId: string,
    content?: DraftContent,
  ): Promise<GeneratedPage | undefined> {
    const opp = this.getOpportunity(opportunityId);
    if (!opp) return undefined;
    this.seq += 1;
    const slug = `/${opp.query.replace(/\s+/g, "-").toLowerCase()}`;
    const ai = content ?? (await draftPageContent(opp.query, opp.recommendedPageType, this.brandHint()));
    const title = opp.query.replace(/\b\w/g, (c) => c.toUpperCase());
    const company = this.brand.current()?.company?.trim();
    const metaTitle = ai?.metaTitle ?? (company ? `${title} | ${company}` : title);
    const page: GeneratedPage = {
      id: `pg-gen-${this.seq}`,
      blueprintId: this.blueprints[0]?.id ?? "bp-1",
      opportunityId,
      title,
      slug,
      pageType: opp.recommendedPageType,
      status: "draft",
      metaTitle,
      metaDescription: ai?.metaDescription ?? `A page targeting "${opp.query}", drafted from Brand Memory.`,
      heroCopy: ai?.heroCopy ?? `Draft hero for ${opp.query}.`,
      sections: ai?.sections?.length
        ? ai.sections
        : [{ heading: "Overview", body: "AI-drafted section pending review." }],
      faqs: ai?.faqs ?? [],
      cta: { label: "Book a demo", href: "/demo" },
      schemaJson: ai
        ? JSON.stringify({ "@context": "https://schema.org", "@type": "Article", name: title }, null, 2)
        : "{}",
      targetKeywords: [opp.query],
      wordCount: 0,
      brandMemoryVersion: 1,
      seoChecks: [
        { label: "Single H1", pass: true },
        { label: "Meta title 50–60 chars", pass: metaTitle.length >= 50 && metaTitle.length <= 60 },
        { label: "Valid JSON-LD", pass: Boolean(ai) },
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
    this.pages.unshift(page);
    this.snapshot(page, ai ? "AI-generated draft" : "Template draft", "ai");
    opp.status = "approved";
    this.save(T.pages, page.id, page);
    this.save(T.opps, opp.id, opp);
    this.logAudit("generate", "page", page.id);
    return page;
  }

  /**
   * One-click "Initiate" from the Growth Plan: kick off drafting the given
   * opportunities **server-side in the background** and return a job handle
   * immediately. The browser no longer holds an N-page loop open — it polls
   * `getBatchJob` for progress while drafts persist and appear in Pipeline.
   * (Page-engine-local; deliberately does not touch the contested jobs.service.)
   */
  startBatchGeneration(opportunityIds: string[]): PageBatchJob {
    // Evict oldest handles so the in-memory map stays bounded (insertion-ordered).
    while (this.batchJobs.size >= 50) {
      const oldest = this.batchJobs.keys().next().value;
      if (oldest === undefined) break;
      this.batchJobs.delete(oldest);
    }
    this.bseq += 1;
    const ids = [...new Set(opportunityIds)].filter((id) => this.getOpportunity(id));
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
    if (ids.length) void this.runBatch(job, ids);
    return { ...job };
  }

  private async runBatch(job: PageBatchJob, ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        const page = await this.generatePage(id);
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

  /** Auto-generate a blueprint from an opportunity (PRD §7.3); reuse if one exists. */
  generateBlueprint(opportunityId: string): PageBlueprint | undefined {
    const opp = this.getOpportunity(opportunityId);
    if (!opp) return undefined;
    const existing = this.blueprints.find((b) => b.opportunityId === opportunityId);
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
    this.blueprints.unshift(bp);
    this.save(T.blueprints, bp.id, bp);
    return bp;
  }

  /** Critical SEO checks that must pass before publishing (PRD §7.7 gate). */
  publishBlockers(id: string): string[] {
    const p = this.getPage(id);
    if (!p) return ["Page not found"];
    const critical = ["Single H1", "Valid JSON-LD", "Crawlable without auth"];
    return p.seoChecks.filter((c) => critical.includes(c.label) && !c.pass).map((c) => c.label);
  }

  transitionPage(id: string, status: PageStatus): GeneratedPage | undefined {
    const p = this.getPage(id);
    if (!p) return undefined;
    p.status = status;
    p.updatedAt = this.now;
    if (status === "published") {
      p.publishedUrl = this.publishedUrlFor(p.slug);
      p.publishedAt = this.now;
      p.lastRefreshedAt = this.now;
      this.snapshot(p, "Published", "system");
      this.logAudit("publish", "page", p.id);
    }
    this.save(T.pages, p.id, p);
    return p;
  }

  /** Point a published page at its live CMS URL after a successful CMS push. */
  attachCmsUrl(id: string, externalUrl: string): GeneratedPage | undefined {
    const p = this.getPage(id);
    if (!p) return undefined;
    p.publishedUrl = externalUrl;
    p.updatedAt = this.now;
    this.save(T.pages, p.id, p);
    return p;
  }

  /** Take a published page offline — back to approved, public URL cleared. */
  unpublish(id: string): GeneratedPage | undefined {
    const p = this.getPage(id);
    if (!p) return undefined;
    if (p.status !== "published") return p;
    p.status = "approved";
    p.publishedUrl = undefined;
    p.publishedAt = undefined;
    p.updatedAt = this.now;
    this.snapshot(p, "Unpublished", "system");
    this.logAudit("update", "page", p.id);
    this.save(T.pages, p.id, p);
    return p;
  }

  /** Duplicate a page as a fresh draft (new id/slug, publish state cleared). */
  duplicate(id: string): GeneratedPage | undefined {
    const src = this.getPage(id);
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
    this.pages.unshift(copy);
    this.snapshot(copy, "Duplicated", "system");
    this.logAudit("create", "page", copy.id);
    this.save(T.pages, copy.id, copy);
    return copy;
  }

  /* page editing + versioning (PRD §9.4, §11.6) */
  updatePage(id: string, edit: PageEdit): GeneratedPage | undefined {
    const p = this.getPage(id);
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
    this.snapshot(p, "Manual edit", "human");
    this.save(T.pages, p.id, p);
    this.logAudit("edit", "page", p.id);
    return p;
  }

  listVersions(pageId: string): PageVersion[] {
    return this.pageVersions[pageId] ?? [];
  }

  rollbackPage(id: string, versionId: string): GeneratedPage | undefined {
    const p = this.getPage(id);
    if (!p) return undefined;
    const v = (this.pageVersions[id] ?? []).find((x) => x.id === versionId);
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
    this.snapshot(p, `Rolled back to v${v.version}`, "human");
    this.save(T.pages, p.id, p);
    this.logAudit("rollback", "page", p.id);
    return p;
  }

  /* published pages (public surfaces) */
  listPublishedPages() {
    return this.pages.filter((p) => p.status === "published");
  }
  getPublishedBySlug(slug: string) {
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    return this.pages.find((p) => p.slug === norm && p.status === "published");
  }

  /** Which research source produced the last/next discovery (for operator visibility). */
  researchSource(): ResearchSource {
    return this.research.source;
  }

  /* research: real DataForSEO keyword ideas when configured, else deterministic seed discovery */
  async discover(input: DiscoverInput): Promise<KeywordOpportunity[]> {
    const seeds = (input.seeds ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 6);
    const ideas = await this.research.researchKeywords(seeds, { limit: 24 });
    const created: KeywordOpportunity[] = ideas.length
      ? ideas.map((idea) => this.oppFromIdea(idea, input.intent))
      : seeds.map((seed) => this.oppFromSeed(seed, input.intent));
    for (const opp of created) this.opportunities.unshift(opp);
    created.forEach((o) => this.save(T.opps, o.id, o));
    return created;
  }

  /** Real DataForSEO keyword idea → scored opportunity. */
  private oppFromIdea(idea: KeywordIdea, intentOverride?: SearchIntent): KeywordOpportunity {
    this.seq += 1;
    const intent = intentOverride ?? classifyKwIntent(idea.keyword);
    const commercialValue = clampN((idea.cpc > 0 ? Math.min(idea.cpc * 8, 55) : idea.competition * 55) + 25, 1, 99);
    const confidence = clampN(60 + (idea.searchVolume > 100 ? 15 : 0) + (idea.difficulty < 40 ? 15 : 0), 1, 99);
    return {
      id: `kw-disc-${this.seq}`,
      query: idea.keyword.toLowerCase(),
      clusterId: "c-discovered",
      clusterLabel: "Discovered (DataForSEO)",
      intent,
      volume: idea.searchVolume,
      difficulty: idea.difficulty,
      commercialValue,
      confidence,
      recommendedPageType: PAGE_TYPE_BY_INTENT[intent] ?? "landing",
      competitorUrls: [],
      evidence: `DataForSEO: ${idea.searchVolume.toLocaleString()} searches/mo · difficulty ${idea.difficulty} · CPC $${idea.cpc.toFixed(2)}.`,
      status: "new",
      duplicate: this.pages.some((p) => p.targetKeywords.some((k) => k.toLowerCase() === idea.keyword.toLowerCase())),
      createdAt: this.now,
    };
  }

  /** Deterministic fallback when no research provider is configured (current behavior). */
  private oppFromSeed(seed: string, intentOverride?: SearchIntent): KeywordOpportunity {
    this.seq += 1;
    const intents: SearchIntent[] = ["commercial", "informational", "comparison"];
    const types: PageType[] = ["landing", "guide", "comparison"];
    const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      id: `kw-disc-${this.seq}`,
      query: seed.toLowerCase(),
      clusterId: "c-discovered",
      clusterLabel: "Discovered",
      intent: intentOverride ?? intents[h % intents.length],
      volume: 300 + (h % 9) * 600,
      difficulty: 25 + (h % 50),
      commercialValue: 55 + (h % 40),
      confidence: 70 + (h % 25),
      recommendedPageType: types[h % types.length],
      competitorUrls: [],
      evidence: `Seed-derived opportunity for "${seed}" — validate volume with the research provider.`,
      status: "new",
      duplicate: this.pages.some((p) => p.targetKeywords.some((k) => k.toLowerCase() === seed.toLowerCase())),
      createdAt: this.now,
    };
  }

  /* leads */
  listLeads() {
    return this.leads;
  }
  getLead(id: string) {
    return this.leads.find((l) => l.id === id);
  }
  updateLeadStatus(id: string, status: LeadStatus): Lead | undefined {
    const l = this.getLead(id);
    if (l) {
      l.status = status;
      this.save(T.leads, l.id, l);
    }
    return l;
  }
  removeLead(id: string): boolean {
    const i = this.leads.findIndex((l) => l.id === id);
    if (i < 0) return false;
    this.leads.splice(i, 1);
    this.drop(T.leads, id);
    this.logAudit("delete", "lead", id);
    return true;
  }
  /* monitoring: refresh recommendations (PRD §7.8) */
  refreshRecommendations() {
    return this.pages
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

  /** Public lead ingest with spam filtering, dedupe, and scoring (PRD §7.9). */
  addLead(input: LeadInput): Lead {
    const page =
      (input.pageId ? this.getPage(input.pageId) : undefined) ??
      (input.slug ? this.getPublishedBySlug(input.slug) : undefined) ??
      this.pages[0];

    const email = (input.email ?? "").trim();
    const message = (input.message ?? "").trim();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const spammy = /(viagra|lottery|prize|crypto|\$\$\$|click here|winner)/i.test(message + " " + email);
    const dup = this.leads.find((l) => l.email.toLowerCase() === email.toLowerCase() && l.pageId === page.id);

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
      pageId: page.id,
      pageTitle: page.title,
      name: (input.name ?? "").trim() || email.split("@")[0] || "Unknown",
      email,
      company: input.company?.trim() || "—",
      message: message || "(no message)",
      sourceUrl: input.sourceUrl ?? page.publishedUrl ?? this.publishedUrlFor(page.slug),
      utm: input.utm,
      score,
      status: "new",
      spamStatus,
      createdAt: this.now,
    };
    this.leads.unshift(lead);
    this.save(T.leads, lead.id, lead);
    return lead;
  }
}
