import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { LeadStatus, PageBlueprint, PageEdit } from "@geoseo/types";
import { ApiTags } from "@nestjs/swagger";
import { PageEngineStore } from "./page-engine.service";
import { SettingsStore } from "./settings.service";
import { BrandMemoryStore } from "./brand.service";
import { ContentMonitorService } from "./content-monitor.service";
import { DigestService } from "./digest.service";
import { CmsPublishStore, renderHtml, renderMarkdown, renderStandaloneHtml } from "./cms-publish.service";
import { Public } from "../common/public.decorator";
import { resolveTenantId, type TenantRequest } from "../common/tenant";
import { validateBody, v } from "../common/validation";
import { BlueprintUpdateSchema, PageEditSchema, IntegrationWriteSchema, LeadStatusUpdateSchema } from "../common/schemas";
import { isDisposableEmail, refererAllowed } from "../common/public-ingest";
import { resolveMode } from "../common/mode";

// Public lead capture: required well-formed email, length caps, + a `website`
// honeypot (real visitors never fill it). Unknown keys are stripped.
const LeadCaptureSchema = {
  email: v.email({ max: 254 }),
  name: v.optional(v.string({ max: 160 })),
  company: v.optional(v.string({ max: 200 })),
  message: v.optional(v.string({ max: 4000 })),
  slug: v.optional(v.string({ max: 320 })),
  pageId: v.optional(v.string({ max: 64 })),
  sourceUrl: v.optional(v.string({ max: 2048 })),
  utm: v.optional(v.string({ max: 512 })),
  website: v.optional(v.string({ max: 200 })), // honeypot
};

/* ----------------------------------------------- keyword opportunities */
@ApiTags("page-engine")
@Controller("opportunities")
export class OpportunitiesController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get()
  list(@Req() req: TenantRequest) {
    return { opportunities: this.store.listOpportunities(resolveTenantId(req)) };
  }

  @Get(":id")
  get(@Req() req: TenantRequest, @Param("id") id: string) {
    const o = this.store.getOpportunity(resolveTenantId(req), id);
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/approve")
  approve(@Req() req: TenantRequest, @Param("id") id: string) {
    const o = this.store.setOpportunityStatus(resolveTenantId(req), id, "approved");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/reject")
  reject(@Req() req: TenantRequest, @Param("id") id: string) {
    const o = this.store.setOpportunityStatus(resolveTenantId(req), id, "rejected");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/defer")
  defer(@Req() req: TenantRequest, @Param("id") id: string) {
    const o = this.store.setOpportunityStatus(resolveTenantId(req), id, "deferred");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post("discover")
  async discover(@Req() req: TenantRequest, @Body() body: { seeds?: string[]; intent?: string }) {
    const t = resolveTenantId(req);
    const seeds = Array.isArray(body?.seeds) ? body.seeds.filter((s) => typeof s === "string") : [];
    if (seeds.length === 0) throw new BadRequestException("seeds[] is required");
    const created = await this.store.discover(t, { seeds, intent: body.intent as never });
    return { created, opportunities: this.store.listOpportunities(t), source: this.store.researchSource() };
  }

  /** Background discovery — returns a job handle immediately; poll the GET below.
   *  Use this from the UI: LLM-backed discovery exceeds the web BFF request budget. */
  @Post("discover-async")
  startDiscover(@Req() req: TenantRequest, @Body() body: { seeds?: string[]; intent?: string }) {
    const seeds = Array.isArray(body?.seeds) ? body.seeds.filter((s) => typeof s === "string") : [];
    if (seeds.length === 0) throw new BadRequestException("seeds[] is required");
    return this.store.startDiscover(resolveTenantId(req), { seeds, intent: body.intent as never });
  }

  @Get("discover-async/:jobId")
  discoverStatus(@Param("jobId") jobId: string) {
    const job = this.store.getDiscoverJob(jobId);
    if (!job) throw new NotFoundException(`Discover job ${jobId} not found`);
    return job;
  }
}

/* ----------------------------------------------- blueprints */
@ApiTags("page-engine")
@Controller("page-blueprints")
export class BlueprintsController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get()
  list(@Req() req: TenantRequest) {
    return { blueprints: this.store.listBlueprints(resolveTenantId(req)) };
  }

  @Post()
  create(@Req() req: TenantRequest, @Body() body: { opportunityId?: string }) {
    if (!body?.opportunityId) throw new BadRequestException("opportunityId is required");
    const bp = this.store.generateBlueprint(resolveTenantId(req), body.opportunityId);
    if (!bp) throw new NotFoundException(`Opportunity ${body.opportunityId} not found`);
    return bp;
  }

  @Get(":id")
  get(@Req() req: TenantRequest, @Param("id") id: string) {
    const b = this.store.getBlueprint(resolveTenantId(req), id);
    if (!b) throw new NotFoundException(`Blueprint ${id} not found`);
    return b;
  }

  @Put(":id")
  update(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(BlueprintUpdateSchema)) body: Partial<PageBlueprint>) {
    const b = this.store.updateBlueprint(resolveTenantId(req), id, body ?? {});
    if (!b) throw new NotFoundException(`Blueprint ${id} not found`);
    return b;
  }

  @Post(":id/approve")
  approve(@Req() req: TenantRequest, @Param("id") id: string) {
    const b = this.store.approveBlueprint(resolveTenantId(req), id);
    if (!b) throw new NotFoundException(`Blueprint ${id} not found`);
    return b;
  }
}

/* ----------------------------------------------- generated pages */
@ApiTags("page-engine")
@Controller("pages")
export class PagesController {
  constructor(
    @Inject(PageEngineStore) private readonly store: PageEngineStore,
    @Inject(CmsPublishStore) private readonly cms: CmsPublishStore,
  ) {}

  @Get()
  list(@Req() req: TenantRequest) {
    return { pages: this.store.listPages(resolveTenantId(req)) };
  }

  @Post("generate")
  async generate(
    @Req() req: TenantRequest,
    @Body()
    body: {
      opportunityId?: string;
      content?: {
        metaTitle: string;
        metaDescription: string;
        heroCopy: string;
        sections: { heading: string; body: string }[];
        faqs: { q: string; a: string }[];
      };
    },
  ) {
    if (!body?.opportunityId) throw new BadRequestException("opportunityId is required");
    const valid =
      body.content &&
      typeof body.content.metaTitle === "string" &&
      Array.isArray(body.content.sections);
    const page = await this.store.generatePage(resolveTenantId(req), body.opportunityId, valid ? body.content : undefined);
    if (!page) throw new NotFoundException(`Opportunity ${body.opportunityId} not found`);
    return page;
  }

  /** Growth Plan "Initiate": draft N opportunities in the background, return a job handle. */
  @Post("generate-batch")
  generateBatch(@Req() req: TenantRequest, @Body() body: { opportunityIds?: string[] }) {
    const ids = Array.isArray(body?.opportunityIds) ? body.opportunityIds.filter((x) => typeof x === "string") : [];
    if (!ids.length) throw new BadRequestException("opportunityIds[] is required");
    return { job: this.store.startBatchGeneration(resolveTenantId(req), ids) };
  }

  /** Poll progress for an Initiate batch. */
  @Get("generate-batch/:jobId")
  batchStatus(@Param("jobId") jobId: string) {
    const job = this.store.getBatchJob(jobId);
    if (!job) throw new NotFoundException(`Batch job ${jobId} not found`);
    return { job };
  }

  @Get(":id")
  get(@Req() req: TenantRequest, @Param("id") id: string) {
    const p = this.store.getPage(resolveTenantId(req), id);
    if (!p) throw new NotFoundException(`Page ${id} not found`);
    return p;
  }

  @Post(":id/approve")
  approve(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(this.store.transitionPage(resolveTenantId(req), id, "approved"), id);
  }

  @Post(":id/submit")
  submit(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(this.store.transitionPage(resolveTenantId(req), id, "in-review"), id);
  }

  @Post(":id/publish")
  async publish(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    const blockers = this.store.publishBlockers(t, id);
    if (blockers.length > 0) {
      throw new UnprocessableEntityException({
        message: "SEO validation failed — resolve before publishing",
        blockers,
      });
    }
    const page = this.must(this.store.transitionPage(t, id, "published"), id);
    // Push to the connected CMS when configured; otherwise keep the managed /feeds URL.
    const cms = await this.cms.publish(t, page, new Date().toISOString());
    return cms ? (this.store.attachCmsUrl(t, id, cms.externalUrl) ?? page) : page;
  }

  @Post(":id/unpublish")
  unpublish(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(this.store.unpublish(resolveTenantId(req), id), id);
  }

  @Post(":id/duplicate")
  duplicate(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(this.store.duplicate(resolveTenantId(req), id), id);
  }

  /** CMS publishing status + recorded pushes (PRD §8.3). */
  @Get("cms/status")
  async cmsStatus(@Req() req: TenantRequest) {
    return { provider: this.cms.provider, configured: this.cms.configured, published: await this.cms.list(resolveTenantId(req)) };
  }

  /** Non-mutating publish quality-gate check (Page-Engine PRD §12). */
  @Post(":id/validate")
  validate(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    if (!this.store.getPage(t, id)) throw new NotFoundException(`Page ${id} not found`);
    const blockers = this.store.publishBlockers(t, id);
    return { blockers, canPublish: blockers.length === 0 };
  }

  /**
   * Export a generated page for any platform that has no publish adapter —
   * hand-coded / static / Jamstack sites and Framer (Markdown → CMS import).
   * `format`: `html` (standalone doc, default) · `md` · `json` (raw page model).
   * Returns the rendered content + a suggested filename/content-type so the
   * caller can save or paste it; never mutates the page.
   */
  @Get(":id/export")
  exportPage(@Req() req: TenantRequest, @Param("id") id: string, @Query("format") format?: string) {
    const page = this.store.getPage(resolveTenantId(req), id);
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    const slug = page.slug.replace(/^\//, "") || page.id;
    const fmt = (format ?? "html").toLowerCase();
    if (fmt === "md" || fmt === "markdown") {
      return { format: "md", filename: `${slug}.md`, contentType: "text/markdown; charset=utf-8", content: renderMarkdown(page) };
    }
    if (fmt === "json") {
      return { format: "json", filename: `${slug}.json`, contentType: "application/json", content: JSON.stringify(page, null, 2) };
    }
    if (fmt === "fragment") {
      return { format: "fragment", filename: `${slug}.html`, contentType: "text/html; charset=utf-8", content: renderHtml(page) };
    }
    return { format: "html", filename: `${slug}.html`, contentType: "text/html; charset=utf-8", content: renderStandaloneHtml(page) };
  }

  /** Refresh: actually regenerate the page content via the LLM and restore published status.
   *  The old stub only set status="needs-refresh" without re-drafting — this closes that gap. */
  @Post(":id/refresh")
  async refresh(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(await this.store.refreshPage(resolveTenantId(req), id), id);
  }

  /** Toggle autopilot mode for a page. When enabled, stale-detection monitors will
   *  automatically re-draft the page rather than just flagging it. */
  @Patch(":id/autopilot")
  autopilot(@Req() req: TenantRequest, @Param("id") id: string, @Body() body: { enabled?: boolean }) {
    if (typeof body?.enabled !== "boolean") throw new BadRequestException("enabled (boolean) is required");
    return this.must(this.store.toggleAutopilot(resolveTenantId(req), id, body.enabled), id);
  }

  /** Auto-Updates core: actually RE-DRAFT the page via the LLM, preserving its URL. */
  @Post(":id/regenerate")
  async regenerate(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(await this.store.regeneratePage(resolveTenantId(req), id), id);
  }

  /** Async regenerate — the LLM re-draft (~30-80s) exceeds the BFF/host sync request
   *  budget, so start a job and poll. Use this from the UI. */
  @Post(":id/regenerate-async")
  startRegenerate(@Req() req: TenantRequest, @Param("id") id: string) {
    return { job: this.store.startRegenerate(resolveTenantId(req), id) };
  }

  @Get("regenerate-async/:jobId")
  regenerateStatus(@Req() req: TenantRequest, @Param("jobId") jobId: string) {
    const job = this.store.getRegenJob(jobId);
    if (!job) throw new NotFoundException(`Regenerate job ${jobId} not found`);
    // On completion, return the freshly re-drafted page too (saves a round-trip).
    const page = job.status === "completed" ? this.store.getPage(resolveTenantId(req), job.pageId) : undefined;
    return { job, page };
  }

  /** Keyword-aware rewrite — add target keywords, the LLM re-drafts weaving them in.
   *  Async (poll the GET below); shares the regen-job store. The review loop's core. */
  @Post(":id/rewrite-async")
  startRewrite(@Req() req: TenantRequest, @Param("id") id: string, @Body() body: { keywords?: string[] }) {
    const keywords = Array.isArray(body?.keywords) ? body.keywords.filter((k) => typeof k === "string") : [];
    return { job: this.store.startRewrite(resolveTenantId(req), id, keywords) };
  }

  @Get("rewrite-async/:jobId")
  rewriteStatus(@Req() req: TenantRequest, @Param("jobId") jobId: string) {
    const job = this.store.getRegenJob(jobId);
    if (!job) throw new NotFoundException(`Rewrite job ${jobId} not found`);
    const page = job.status === "completed" ? this.store.getPage(resolveTenantId(req), job.pageId) : undefined;
    return { job, page };
  }

  @Put(":id")
  update(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(PageEditSchema)) body: PageEdit) {
    return this.must(this.store.updatePage(resolveTenantId(req), id, body ?? {}), id);
  }

  @Get(":id/versions")
  versions(@Req() req: TenantRequest, @Param("id") id: string) {
    return { versions: this.store.listVersions(resolveTenantId(req), id) };
  }

  @Post(":id/rollback/:versionId")
  rollback(@Req() req: TenantRequest, @Param("id") id: string, @Param("versionId") versionId: string) {
    const p = this.store.rollbackPage(resolveTenantId(req), id, versionId);
    if (!p) throw new NotFoundException(`Page ${id} or version ${versionId} not found`);
    return p;
  }

  private must<T>(value: T | undefined, id: string): T {
    if (!value) throw new NotFoundException(`Page ${id} not found`);
    return value;
  }
}

/* ----------------------------------------------- leads */
@ApiTags("page-engine")
@Controller("leads")
export class LeadsController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get()
  list(@Req() req: TenantRequest) {
    return { leads: this.store.listLeads(resolveTenantId(req)) };
  }

  @Get(":id")
  get(@Req() req: TenantRequest, @Param("id") id: string) {
    const l = this.store.getLead(resolveTenantId(req), id);
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  @Put(":id")
  update(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(LeadStatusUpdateSchema)) body: { status?: LeadStatus }) {
    if (!body?.status) throw new BadRequestException("status is required");
    const l = this.store.updateLeadStatus(resolveTenantId(req), id, body.status);
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  @Delete(":id")
  remove(@Req() req: TenantRequest, @Param("id") id: string) {
    if (!this.store.removeLead(resolveTenantId(req), id)) throw new NotFoundException(`Lead ${id} not found`);
    return { id, deleted: true };
  }
}

/* ----------------------------------------------- monitoring + recommendations */
@ApiTags("monitoring")
@Controller()
export class MonitoringController {
  constructor(
    @Inject(PageEngineStore) private readonly store: PageEngineStore,
    @Inject(ContentMonitorService) private readonly monitor: ContentMonitorService,
    @Inject(DigestService) private readonly digest: DigestService,
  ) {}

  @Get("recommendations/refresh")
  refreshRecs(@Req() req: TenantRequest) {
    return { recommendations: this.store.refreshRecommendations(resolveTenantId(req)) };
  }

  /** Manually trigger a content-health scan (rank-drop detection). Runs the same
   *  logic as the background 6-hour poll and returns how many pages were flagged. */
  @Post("monitoring/scan")
  async triggerScan() {
    const result = await this.monitor.scan("manual");
    return { ...result, message: result.flagged > 0 ? `${result.flagged} page(s) flagged for refresh` : "No new pages flagged" };
  }

  @Get("audit")
  audit(@Req() req: TenantRequest) {
    return { audit: this.store.listAudit(resolveTenantId(req)) };
  }

  @Get("monitoring/pages/:pageId")
  page(@Req() req: TenantRequest, @Param("pageId") pageId: string) {
    const t = resolveTenantId(req);
    const p = this.store.getPage(t, pageId);
    if (!p) throw new NotFoundException(`Page ${pageId} not found`);
    return { page: p, versions: this.store.listVersions(t, pageId) };
  }

  /** Manually trigger the monthly performance digest email. */
  @Post("monitoring/digest")
  async triggerDigest() {
    const result = await this.digest.sendNow();
    return { ...result, message: result.sent ? `Digest sent to ${result.to}` : "RESEND_API_KEY or NOTIFY_EMAIL not configured — digest not sent" };
  }
}

/* ----------------------------------------------- publishing (PRD §10.2) */
@ApiTags("publishing")
@Controller("publishing")
export class PublishingController {
  constructor(
    @Inject(PageEngineStore) private readonly store: PageEngineStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
  ) {}

  @Get("integrations")
  integrations() {
    return { integrations: this.settings.get().integrations };
  }

  @Post("integrations")
  upsert(@Body(validateBody(IntegrationWriteSchema)) body: { id?: string; status?: string; label?: string; description?: string }) {
    if (!body?.id) throw new BadRequestException("id is required");
    return this.settings.updateIntegration(body.id, body as never);
  }

  @Post("test")
  test() {
    const path = this.settings.get().profile.defaultPublishPath ?? "/feeds";
    return { ok: true, destination: "managed-subdirectory", path };
  }

  @Post("sitemap/sync")
  sitemap() {
    return { synced: true, urls: this.store.listPublishedPages().length, sitemap: "/sitemap.xml" };
  }

  @Post("llms/sync")
  llms() {
    return { synced: true, entries: this.store.listPublishedPages().length, llmsTxt: "/llms.txt" };
  }
}

/* ----------------------------------------------- public surfaces (no auth) */
@ApiTags("public")
@Controller("public")
export class PublicController {
  constructor(
    @Inject(PageEngineStore) private readonly store: PageEngineStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
  ) {}

  @Public()
  @Get("pages")
  pages() {
    return { pages: this.store.listPublishedPages() };
  }

  @Public()
  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    const p = this.store.getPublishedBySlug(slug);
    if (!p) throw new NotFoundException(`Published page ${slug} not found`);
    return p;
  }

  /** llms.txt — AI-model-readable index of all published pages. Spec: https://llmstxt.org */
  @Public()
  @Get("llms.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  @Header("Cache-Control", "public, max-age=3600")
  llmsTxt() {
    const pages = this.store.listPublishedPages();
    const profile = this.settings.get().profile;
    const b = this.brand.current();
    const siteBase = `https://${profile.domain?.replace(/^https?:\/\//, "") ?? "example.com"}`;
    const name = b?.company?.trim() || profile.workspaceName || "Our Site";
    const desc = b?.valueProp?.trim() || `AI-optimised pages from ${name}`;
    const lines: string[] = [
      `# ${name}`,
      "",
      `> ${desc}`,
      "",
      "## Published Pages",
      "",
      ...pages.map((p) => {
        const url = p.publishedUrl ?? `${siteBase}/feeds${p.slug}`;
        return `- [${p.metaTitle || p.title}](${url}): ${p.metaDescription || ""}`;
      }),
    ];
    return lines.join("\n");
  }

  /** sitemap.xml — standard XML sitemap for all published pages. */
  @Public()
  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  @Header("Cache-Control", "public, max-age=3600")
  sitemapXml() {
    const pages = this.store.listPublishedPages();
    const domain = this.settings.get().profile.domain?.replace(/^https?:\/\//, "") ?? "example.com";
    const base = `https://${domain}`;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const urls = pages
      .map((p) => {
        const loc = esc(p.publishedUrl ?? `${base}/feeds${p.slug}`);
        const mod = (p.updatedAt || p.createdAt || "").split("T")[0];
        return `  <url><loc>${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.8</priority></url>`;
      })
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }

  /**
   * Framer-compatible JSON feed. Point Framer's CMS "Fetch" data source here to pull
   * all published pages into a Framer CMS collection automatically.
   * URL: GET /api/v1/public/framer-feed
   */
  @Public()
  @Get("framer-feed")
  framerFeed() {
    const pages = this.store.listPublishedPages();
    const domain = this.settings.get().profile.domain?.replace(/^https?:\/\//, "") ?? "example.com";
    const base = `https://${domain}`;
    return pages.map((p) => ({
      id: p.id,
      name: p.metaTitle || p.title,
      slug: p.slug.replace(/^\//, ""),
      excerpt: p.metaDescription ?? "",
      content: p.heroCopy ?? "",
      heroImageUrl: p.heroImageUrl ?? "",
      pageType: p.pageType,
      targetKeywords: p.targetKeywords.join(", "),
      publishedAt: p.publishedAt ?? p.createdAt,
      url: p.publishedUrl ?? `${base}/feeds${p.slug}`,
    }));
  }

  @Public()
  @Post("leads")
  capture(
    @Body(validateBody(LeadCaptureSchema))
    body: {
      email: string;
      name?: string;
      company?: string;
      message?: string;
      slug?: string;
      pageId?: string;
      sourceUrl?: string;
      utm?: string;
      website?: string;
    },
  ) {
    // Honeypot — a real visitor never fills the hidden `website` field.
    if (body.website && body.website.trim()) throw new BadRequestException("Invalid submission");
    if (isDisposableEmail(body.email)) throw new BadRequestException("Disposable email addresses are not allowed");
    // Production anti-abuse: source host must be allow-listed when configured (demo stays permissive).
    if (resolveMode() !== "demo" && !refererAllowed(body.sourceUrl, this.settings.get().profile.allowedDomains)) {
      throw new BadRequestException("Submissions are not accepted from this domain");
    }
    const lead = this.store.addLead({
      name: body.name ?? "",
      email: body.email,
      company: body.company,
      message: body.message,
      pageId: body.pageId,
      slug: body.slug,
      sourceUrl: body.sourceUrl,
      utm: body.utm,
    });
    return { lead };
  }
}
