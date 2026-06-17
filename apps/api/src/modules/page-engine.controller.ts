import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { LeadStatus, PageBlueprint, PageEdit } from "@geoseo/types";
import { ApiTags } from "@nestjs/swagger";
import { PageEngineStore } from "./page-engine.service";
import { SettingsStore } from "./settings.service";
import { CmsPublishStore } from "./cms-publish.service";
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
    const cms = await this.cms.publish(page, new Date().toISOString());
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
  cmsStatus() {
    return { provider: this.cms.provider, configured: this.cms.configured, published: this.cms.list() };
  }

  /** Non-mutating publish quality-gate check (Page-Engine PRD §12). */
  @Post(":id/validate")
  validate(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    if (!this.store.getPage(t, id)) throw new NotFoundException(`Page ${id} not found`);
    const blockers = this.store.publishBlockers(t, id);
    return { blockers, canPublish: blockers.length === 0 };
  }

  @Post(":id/refresh")
  refresh(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.must(this.store.transitionPage(resolveTenantId(req), id, "needs-refresh"), id);
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
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get("recommendations/refresh")
  refreshRecs(@Req() req: TenantRequest) {
    return { recommendations: this.store.refreshRecommendations(resolveTenantId(req)) };
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
