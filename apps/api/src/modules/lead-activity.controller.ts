import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { LeadActivityType } from "@geoseo/types";
import { LeadActivityStore } from "./lead-activity.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";

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
  list(@Param("id") id: string) {
    return { activity: this.activity.list(id) };
  }

  @Post(":id/activity")
  add(@Param("id") id: string, @Body(validateBody(AddActivitySchema)) body: { type: LeadActivityType; body: string }) {
    const entry = this.activity.add(id, body.type, body.body);
    this.audit.record("update", "lead", id);
    return { activity: entry };
  }
}
