import { Controller, Get, Inject, NotFoundException, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadScoreStore, computeLeadScore } from "./lead-score.service";
import { LeadJourneyStore } from "./lead-journey.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

@ApiTags("leads")
@Controller("leads")
export class LeadScoreController {
  constructor(
    @Inject(LeadScoreStore) private readonly scores: LeadScoreStore,
    @Inject(LeadJourneyStore) private readonly journey: LeadJourneyStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  /** Stored score, or computed on the fly the first time (Leads PRD Gap 7). */
  @Get(":id/score")
  async get(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    const cached = await this.scores.get(t, id);
    if (cached) return { score: cached };
    const lead = this.pageEngine.getLead(t, id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = await this.scores.set(t, id, computeLeadScore(lead, (await this.journey.journeyForLead(t, id)).summary));
    return { score };
  }

  @Post(":id/recalculate-score")
  async recalculate(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    const lead = this.pageEngine.getLead(t, id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = await this.scores.set(t, id, computeLeadScore(lead, (await this.journey.journeyForLead(t, id)).summary));
    this.audit.record("update", "lead", id);
    return { score };
  }
}
