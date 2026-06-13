import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import type { SeoDataProvider, ProspectStatus, ProspectUpdate } from "@geoseo/types";
import { SEO_PROVIDER } from "../seo/seo.module";
import { paginate } from "../common/pagination";
import { OpportunitiesStore } from "./opportunities.service";
import { JobsStore } from "./jobs.service";

@ApiTags("backlinks")
@Controller("backlink/opportunities")
export class BacklinkController {
  constructor(
    @Inject(SEO_PROVIDER) private readonly seo: SeoDataProvider,
    @Inject(OpportunitiesStore) private readonly opportunities: OpportunitiesStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
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

  @Get(":id")
  async detail(@Param("id") id: string) {
    const prospect = this.opportunities.list(await this.seo.getProspects()).find((p) => p.id === id);
    if (!prospect) throw new NotFoundException(`No backlink opportunity '${id}'`);
    return prospect;
  }

  @Post("discover")
  discover() {
    return { opportunity: this.opportunities.discover(), job: this.jobs.create("discover") };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: ProspectUpdate) {
    const prospect = this.opportunities.update(id, body, await this.seo.getProspects());
    return { opportunity: prospect };
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    return this.opportunities.archive(id, await this.seo.getProspects());
  }
}
