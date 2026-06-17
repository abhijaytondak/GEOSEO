import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { LeadActivityType } from "@geoseo/types";
import { LeadActivityStore } from "./lead-activity.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const ACTIVITY_TYPES: LeadActivityType[] = [
  "note",
  "call",
  "email",
  "meeting",
  "status_change",
  "assignment",
  "crm_sync",
  "notification",
  "spam_override",
  "delete",
  "export",
];

const AddActivitySchema = {
  type: v.enumOf(ACTIVITY_TYPES),
  body: v.string({ min: 1, max: 4000 }),
};

@ApiTags("leads")
@Controller("leads")
export class LeadActivityController {
  constructor(
    @Inject(LeadActivityStore) private readonly activity: LeadActivityStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get(":id/activity")
  async list(@Req() req: TenantRequest, @Param("id") id: string) {
    return { activity: await this.activity.list(resolveTenantId(req), id) };
  }

  @Post(":id/activity")
  async add(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(AddActivitySchema)) body: { type: LeadActivityType; body: string }) {
    const entry = await this.activity.add(resolveTenantId(req), id, body.type, body.body);
    this.audit.record("update", "lead", id);
    return { activity: entry };
  }
}
