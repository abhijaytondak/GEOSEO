import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { LeadNotificationChannel } from "@geoseo/types";
import { LeadNotificationStore } from "./lead-notification.service";
import { LeadScoreStore } from "./lead-score.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const CHANNELS: LeadNotificationChannel[] = ["in_app", "email", "slack", "webhook"];

const RuleSchema = {
  name: v.string({ min: 1, max: 120 }),
  enabled: v.optional(v.boolean()),
  channels: v.optional(v.arrayOf(v.enumOf(CHANNELS))),
  minScore: v.optional(v.number({ min: 0, max: 100 })),
  statuses: v.optional(v.arrayOf(v.string({ max: 40 }))),
  pages: v.optional(v.arrayOf(v.string({ max: 128 }))),
  ownerOnly: v.optional(v.boolean()),
  quietHours: v.optional(v.object()),
};
const RulePatchSchema = { ...RuleSchema, name: v.optional(v.string({ min: 1, max: 120 })) };

// Separate base path — `/leads/notification-rules` would collide with /leads/:id.
@ApiTags("leads")
@Controller("lead-notification-rules")
export class LeadNotificationRulesController {
  constructor(
    @Inject(LeadNotificationStore) private readonly store: LeadNotificationStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  list() {
    return { rules: this.store.listRules() };
  }

  @Post()
  create(@Body(validateBody(RuleSchema)) body: { name: string }) {
    const rule = this.store.createRule(body);
    this.audit.record("create", "settings", rule.id);
    return { rule };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(validateBody(RulePatchSchema)) body: Record<string, unknown>) {
    return { rule: this.store.updateRule(id, body) };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const result = this.store.deleteRule(id);
    this.audit.record("delete", "settings", id);
    return result;
  }
}

@ApiTags("leads")
@Controller("leads")
export class LeadNotifyController {
  constructor(
    @Inject(LeadNotificationStore) private readonly store: LeadNotificationStore,
    @Inject(LeadScoreStore) private readonly scores: LeadScoreStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get(":id/notifications")
  list(@Param("id") id: string) {
    return { notifications: this.store.notificationsFor(id) };
  }

  /** Evaluate notification rules against a lead and record deliveries. */
  @Post(":id/notify")
  notify(@Req() req: TenantRequest, @Param("id") id: string) {
    const lead = this.pageEngine.getLead(resolveTenantId(req), id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const result = this.store.notify(lead, this.scores.get(id));
    if (result.delivered.length) this.audit.record("notification", "lead", id);
    return result;
  }
}
