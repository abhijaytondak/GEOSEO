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
  UnprocessableEntityException,
} from "@nestjs/common";
import type { LeadStatus, PageBlueprint, PageEdit } from "@geoseo/types";
import { ApiTags } from "@nestjs/swagger";
import { PageEngineStore } from "./page-engine.service";
import { SettingsStore } from "./settings.service";
import { CmsPublishStore } from "./cms-publish.service";
import { Public } from "../common/public.decorator";
import { validateBody, v } from "../common/validation";
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
  list() {
    return { opportunities: this.store.listOpportunities() };
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const o = this.store.getOpportunity(id);
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    const o = this.store.setOpportunityStatus(id, "approved");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/reject")
  reject(@Param("id") id: string) {
    const o = this.store.setOpportunityStatus(id, "rejected");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post(":id/defer")
  defer(@Param("id") id: string) {
    const o = this.store.setOpportunityStatus(id, "deferred");
    if (!o) throw new NotFoundException(`Opportunity ${id} not found`);
    return o;
  }

  @Post("discover")
  async discover(@Body() body: { seeds?: string[]; intent?: string }) {
    const seeds = Array.isArray(body?.seeds) ? body.seeds.filter((s) => typeof s === "string") : [];
    if (seeds.length === 0) throw new BadRequestException("seeds[] is required");
    const created = await this.store.discover({ seeds, intent: body.intent as never });
    return { created, opportunities: this.store.listOpportunities(), source: this.store.researchSource() };
  }
}

/* ----------------------------------------------- blueprints */
@ApiTags("page-engine")
@Controller("page-blueprints")
export class BlueprintsController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get()
  list() {
    return { blueprints: this.store.listBlueprints() };
  }

  @Post()
  create(@Body() body: { opportunityId?: string }) {
    if (!body?.opportunityId) throw new BadRequestException("opportunityId is required");
    const bp = this.store.generateBlueprint(body.opportunityId);
    if (!bp) throw new NotFoundException(`Opportunity ${body.opportunityId} not found`);
    return bp;
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const b = this.store.getBlueprint(id);
    if (!b) throw new NotFoundException(`Blueprint ${id} not found`);
    return b;
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: Partial<PageBlueprint>) {
    const b = this.store.updateBlueprint(id, body ?? {});
    if (!b) throw new NotFoundException(`Blueprint ${id} not found`);
    return b;
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    const b = this.store.approveBlueprint(id);
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
  list() {
    return { pages: this.store.listPages() };
  }

  @Post("generate")
  async generate(
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
    const page = await this.store.generatePage(body.opportunityId, valid ? body.content : undefined);
    if (!page) throw new NotFoundException(`Opportunity ${body.opportunityId} not found`);
    return page;
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const p = this.store.getPage(id);
    if (!p) throw new NotFoundException(`Page ${id} not found`);
    return p;
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.must(this.store.transitionPage(id, "approved"), id);
  }

  @Post(":id/submit")
  submit(@Param("id") id: string) {
    return this.must(this.store.transitionPage(id, "in-review"), id);
  }

  @Post(":id/publish")
  async publish(@Param("id") id: string) {
    const blockers = this.store.publishBlockers(id);
    if (blockers.length > 0) {
      throw new UnprocessableEntityException({
        message: "SEO validation failed — resolve before publishing",
        blockers,
      });
    }
    const page = this.must(this.store.transitionPage(id, "published"), id);
    // Push to the connected CMS when configured; otherwise keep the managed /feeds URL.
    const cms = await this.cms.publish(page, new Date().toISOString());
    return cms ? (this.store.attachCmsUrl(id, cms.externalUrl) ?? page) : page;
  }

  @Post(":id/unpublish")
  unpublish(@Param("id") id: string) {
    return this.must(this.store.unpublish(id), id);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string) {
    return this.must(this.store.duplicate(id), id);
  }

  /** CMS publishing status + recorded pushes (PRD §8.3). */
  @Get("cms/status")
  cmsStatus() {
    return { provider: this.cms.provider, configured: this.cms.configured, published: this.cms.list() };
  }

  /** Non-mutating publish quality-gate check (Page-Engine PRD §12). */
  @Post(":id/validate")
  validate(@Param("id") id: string) {
    if (!this.store.getPage(id)) throw new NotFoundException(`Page ${id} not found`);
    const blockers = this.store.publishBlockers(id);
    return { blockers, canPublish: blockers.length === 0 };
  }

  @Post(":id/refresh")
  refresh(@Param("id") id: string) {
    return this.must(this.store.transitionPage(id, "needs-refresh"), id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: PageEdit) {
    return this.must(this.store.updatePage(id, body ?? {}), id);
  }

  @Get(":id/versions")
  versions(@Param("id") id: string) {
    return { versions: this.store.listVersions(id) };
  }

  @Post(":id/rollback/:versionId")
  rollback(@Param("id") id: string, @Param("versionId") versionId: string) {
    const p = this.store.rollbackPage(id, versionId);
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
  list() {
    return { leads: this.store.listLeads() };
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const l = this.store.getLead(id);
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: { status?: LeadStatus }) {
    if (!body?.status) throw new BadRequestException("status is required");
    const l = this.store.updateLeadStatus(id, body.status);
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  @Post("export")
  export() {
    return { csv: this.store.exportLeadsCsv() };
  }

  @Post(":id/sync")
  sync(@Param("id") id: string) {
    const l = this.store.syncLead(id);
    if (!l) throw new NotFoundException(`Lead ${id} not found`);
    return l;
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    if (!this.store.removeLead(id)) throw new NotFoundException(`Lead ${id} not found`);
    return { id, deleted: true };
  }
}

/* ----------------------------------------------- monitoring + recommendations */
@ApiTags("monitoring")
@Controller()
export class MonitoringController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

  @Get("recommendations/refresh")
  refreshRecs() {
    return { recommendations: this.store.refreshRecommendations() };
  }

  @Get("audit")
  audit() {
    return { audit: this.store.listAudit() };
  }

  @Get("monitoring/pages/:pageId")
  page(@Param("pageId") pageId: string) {
    const p = this.store.getPage(pageId);
    if (!p) throw new NotFoundException(`Page ${pageId} not found`);
    return { page: p, versions: this.store.listVersions(pageId) };
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
  upsert(@Body() body: { id?: string; status?: string; label?: string; description?: string }) {
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
