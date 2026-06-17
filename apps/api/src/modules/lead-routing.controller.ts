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
  async rules(@Req() req: TenantRequest) {
    return { rules: await this.routing.list(resolveTenantId(req)) };
  }

  @Post("rules")
  async create(@Req() req: TenantRequest, @Body(validateBody(CreateRuleSchema)) body: RuleInput) {
    return { rule: await this.routing.create(resolveTenantId(req), { ...body, enabled: body.enabled ?? true }) };
  }

  @Patch("rules/:id")
  async update(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(UpdateRuleSchema)) body: Partial<RuleInput>) {
    const rule = await this.routing.update(resolveTenantId(req), id, body);
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return { rule };
  }

  @Delete("rules/:id")
  async remove(@Req() req: TenantRequest, @Param("id") id: string) {
    await this.routing.remove(resolveTenantId(req), id);
    return { ok: true };
  }

  /** Apply rules to every currently-unassigned lead (PRD routing — backfill). */
  @Post("apply")
  async apply(@Req() req: TenantRequest) {
    const t = resolveTenantId(req);
    const assigned = new Set((await this.assignments.all(t)).map((a) => a.leadId));
    let routed = 0;
    for (const lead of this.pages.listLeads(t)) {
      if (assigned.has(lead.id)) continue;
      const ownerId = await this.routing.routeOwner(t, lead);
      if (ownerId) {
        await this.assignments.assign(t, lead.id, ownerId, "routing");
        routed += 1;
      }
    }
    return { routed };
  }
}
