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
  get(@Req() req: TenantRequest, @Param("id") id: string) {
    const cached = this.scores.get(id);
    if (cached) return { score: cached };
    const lead = this.pageEngine.getLead(resolveTenantId(req), id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = this.scores.set(id, computeLeadScore(lead, this.journey.journeyForLead(id).summary));
    return { score };
  }

  @Post(":id/recalculate-score")
  recalculate(@Req() req: TenantRequest, @Param("id") id: string) {
    const lead = this.pageEngine.getLead(resolveTenantId(req), id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = this.scores.set(id, computeLeadScore(lead, this.journey.journeyForLead(id).summary));
    this.audit.record("update", "lead", id);
    return { score };
  }
}
