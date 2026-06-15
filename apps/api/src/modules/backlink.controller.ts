import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, ProspectStatus, ProspectUpdate } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";
import { validateBody } from "../common/validation";
import { ProspectUpdateSchema, BulkProspectsSchema } from "../common/schemas";
import { OpportunitiesStore } from "./opportunities.service";
import { JobsStore } from "./jobs.service";
import { AuditStore } from "./audit.service";

@ApiTags("backlinks")
@Controller("backlink/opportunities")
export class BacklinkController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(OpportunitiesStore) private readonly opportunities: OpportunitiesStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "offset", required: false })
  @ApiQuery({ name: "minAuthority", required: false })
  @ApiQuery({ name: "niche", required: false })
  @ApiQuery({ name: "status", required: false })
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("minAuthority") minAuthority?: string,
    @Query("niche") niche?: string,
    @Query("status") status?: ProspectStatus,
  ) {
    let prospects = this.opportunities.list(await this.seo.getProspects());
    if (minAuthority) {
      const min = Number.parseInt(minAuthority, 10);
      prospects = prospects.filter((p) => p.domainAuthority >= min);
    }
    if (niche) {
      const q = niche.toLowerCase();
      prospects = prospects.filter((p) => p.industry.toLowerCase().includes(q));
    }
    if (status) prospects = prospects.filter((p) => p.status === status);
    // Highest impact first — the UI's primary ranking key.
    prospects = [...prospects].sort((a, b) => b.impactScore - a.impactScore);

    const { items, total, limit: l, offset: o } = paginate(prospects, limit, offset);
    return { opportunities: items, total, limit: l, offset: o };
  }

  /** Archived prospects only — powers the restore view (declared before :id so it isn't shadowed). */
  @Get("archived")
  async archived() {
    const prospects = this.opportunities.listArchived(await this.seo.getProspects());
    return { opportunities: prospects, total: prospects.length };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const prospect = this.opportunities.list(await this.seo.getProspects()).find((p) => p.id === id);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${id}'`);
    return prospect;
  }

  @Post("discover")
  discover() {
    const opportunity = this.opportunities.discover();
    this.audit.record("discover", "prospect", opportunity.id);
    return { opportunity, job: this.jobs.create("discover") };
  }

  @Post("bulk")
  async bulk(
    @Body(validateBody(BulkProspectsSchema))
    body: { ids: string[]; action: "archive" | "restore" | "status"; status?: ProspectStatus },
  ) {
    if (body.ids.length === 0) throw new BadRequestException("`ids` must be a non-empty array");
    // Cross-field rule the flat schema can't express.
    if (body.action === "status" && !body.status) {
      throw new BadRequestException("action 'status' requires a `status`");
    }
    const result = this.opportunities.bulk(body.ids, body.action, await this.seo.getProspects(), body.status);
    result.updated.forEach((id) => this.audit.record("bulk", "prospect", id));
    return result;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body(validateBody(ProspectUpdateSchema)) body: ProspectUpdate) {
    const prospect = this.opportunities.update(id, body, await this.seo.getProspects());
    this.audit.record("update", "prospect", id);
    return { opportunity: prospect };
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    const result = await this.opportunities.archive(id, await this.seo.getProspects());
    this.audit.record("archive", "prospect", id);
    return result;
  }

  @Post(":id/restore")
  restore(@Param("id") id: string) {
    const result = this.opportunities.restore(id);
    this.audit.record("restore", "prospect", id);
    return { opportunity: result };
  }
}
