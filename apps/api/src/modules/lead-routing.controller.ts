import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadRoutingStore, type LeadRoutingRule } from "./lead-routing.service";
import { PageEngineStore } from "./page-engine.service";
import { LeadAssignmentStore } from "./lead-assignment.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

type RuleInput = Omit<LeadRoutingRule, "id">;

const FIELDS = ["score", "company", "spamStatus", "pageTitle"] as const;
const OPERATORS = ["gte", "lte", "eq", "contains"] as const;

const CreateRuleSchema = {
  name: v.string({ min: 1, max: 120 }),
  enabled: v.optional(v.boolean()),
  field: v.enumOf(FIELDS),
  operator: v.enumOf(OPERATORS),
  value: v.string({ max: 200 }),
  ownerId: v.string({ min: 1, max: 120 }),
};

const UpdateRuleSchema = {
  name: v.optional(v.string({ min: 1, max: 120 })),
  enabled: v.optional(v.boolean()),
  field: v.optional(v.enumOf(FIELDS)),
  operator: v.optional(v.enumOf(OPERATORS)),
  value: v.optional(v.string({ max: 200 })),
  ownerId: v.optional(v.string({ min: 1, max: 120 })),
};

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
  create(@Body(validateBody(CreateRuleSchema)) body: RuleInput) {
    return { rule: this.routing.create({ ...body, enabled: body.enabled ?? true }) };
  }

  @Patch("rules/:id")
  update(@Param("id") id: string, @Body(validateBody(UpdateRuleSchema)) body: Partial<RuleInput>) {
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
  apply(@Req() req: TenantRequest) {
    const assigned = new Set(this.assignments.all().map((a) => a.leadId));
    let routed = 0;
    for (const lead of this.pages.listLeads(resolveTenantId(req))) {
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
