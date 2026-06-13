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
import type { LeadStatus, PageEdit } from "@geoseo/types";
import { ApiTags } from "@nestjs/swagger";
import { PageEngineStore } from "./page-engine.service";
import { Public } from "../common/public.decorator";

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
  discover(@Body() body: { seeds?: string[]; intent?: string }) {
    const seeds = Array.isArray(body?.seeds) ? body.seeds.filter((s) => typeof s === "string") : [];
    if (seeds.length === 0) throw new BadRequestException("seeds[] is required");
    const created = this.store.discover({ seeds, intent: body.intent as never });
    return { created, opportunities: this.store.listOpportunities() };
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
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

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
  publish(@Param("id") id: string) {
    const blockers = this.store.publishBlockers(id);
    if (blockers.length > 0) {
      throw new UnprocessableEntityException({
        message: "SEO validation failed — resolve before publishing",
        blockers,
      });
    }
    return this.must(this.store.transitionPage(id, "published"), id);
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

/* ----------------------------------------------- public surfaces (no auth) */
@ApiTags("public")
@Controller("public")
export class PublicController {
  constructor(@Inject(PageEngineStore) private readonly store: PageEngineStore) {}

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
    @Body()
    body: {
      name?: string;
      email?: string;
      company?: string;
      message?: string;
      slug?: string;
      pageId?: string;
      sourceUrl?: string;
      utm?: string;
    },
  ) {
    if (!body?.email?.trim()) throw new BadRequestException("email is required");
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
