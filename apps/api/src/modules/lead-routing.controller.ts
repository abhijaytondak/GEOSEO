import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadRoutingStore, type LeadRoutingRule } from "./lead-routing.service";
import { PageEngineStore } from "./page-engine.service";
import { LeadAssignmentStore } from "./lead-assignment.service";

type RuleInput = Omit<LeadRoutingRule, "id">;

@ApiTags("lead-routing")
@Controller("lead-routing")
export class LeadRoutingController {
  constructor(
    @Inject(LeadRoutingStore) private readonly routing: LeadRoutingStore,
    @Inject(PageEngineStore) private readonly pages: PageEngineStore,
    @Inject(LeadAssignmentStore) private readonly assignments: LeadAssignmentStore,
  ) {}

  @Get("rules")
  rules() {
    return { rules: this.routing.list() };
  }

  @Post("rules")
  create(@Body() body: RuleInput) {
    if (!body?.name?.trim() || !body?.ownerId?.trim()) throw new BadRequestException("name and ownerId are required");
    return { rule: this.routing.create({ ...body, enabled: body.enabled ?? true }) };
  }

  @Patch("rules/:id")
  update(@Param("id") id: string, @Body() body: Partial<RuleInput>) {
    const rule = this.routing.update(id, body);
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return { rule };
  }

  @Delete("rules/:id")
  remove(@Param("id") id: string) {
    this.routing.remove(id);
    return { ok: true };
  }

  /** Apply rules to every currently-unassigned lead (PRD routing — backfill). */
  @Post("apply")
  apply() {
    const assigned = new Set(this.assignments.all().map((a) => a.leadId));
    let routed = 0;
    for (const lead of this.pages.listLeads()) {
      if (assigned.has(lead.id)) continue;
      const ownerId = this.routing.routeOwner(lead);
      if (ownerId) {
        this.assignments.assign(lead.id, ownerId, "routing");
        routed += 1;
      }
    }
    return { routed };
  }
}
