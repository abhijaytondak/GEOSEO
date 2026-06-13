import { Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadScoreStore, computeLeadScore } from "./lead-score.service";
import { LeadJourneyStore } from "./lead-journey.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";

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
  get(@Param("id") id: string) {
    const cached = this.scores.get(id);
    if (cached) return { score: cached };
    const lead = this.pageEngine.getLead(id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = this.scores.set(id, computeLeadScore(lead, this.journey.journeyForLead(id).summary));
    return { score };
  }

  @Post(":id/recalculate-score")
  recalculate(@Param("id") id: string) {
    const lead = this.pageEngine.getLead(id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const score = this.scores.set(id, computeLeadScore(lead, this.journey.journeyForLead(id).summary));
    this.audit.record("update", "lead", id);
    return { score };
  }
}
