import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadAssignmentStore } from "./lead-assignment.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

const AssignSchema = { ownerId: v.string({ min: 1, max: 128 }) };
const BulkAssignSchema = { ids: v.arrayOf(v.string({ min: 1 })), ownerId: v.string({ min: 1, max: 128 }) };

// Routes use ≥2 segments or distinct literals so they never collide with the
// page-engine LeadsController's `GET/PUT/DELETE /leads/:id`.
@ApiTags("leads")
@Controller("leads")
export class LeadAssignmentController {
  constructor(
    @Inject(LeadAssignmentStore) private readonly assignments: LeadAssignmentStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get("assign/workload")
  async workload(@Req() req: TenantRequest) {
    const t = resolveTenantId(req);
    return { workload: await this.assignments.workload(t), assignments: await this.assignments.all(t) };
  }

  @Post(":id/assign")
  async assign(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody(AssignSchema)) body: { ownerId: string }) {
    const assignment = await this.assignments.assign(resolveTenantId(req), id, body.ownerId);
    this.audit.record("update", "lead", id);
    return { assignment };
  }

  @Post("bulk-assign")
  async bulkAssign(@Req() req: TenantRequest, @Body(validateBody(BulkAssignSchema)) body: { ids: string[]; ownerId: string }) {
    const assignments = await this.assignments.bulkAssign(resolveTenantId(req), body.ids, body.ownerId);
    assignments.forEach((a) => this.audit.record("update", "lead", a.leadId));
    return { assignments };
  }
}
