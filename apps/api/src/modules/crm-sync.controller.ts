import { Controller, Get, Inject, NotFoundException, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CrmSyncStore } from "./crm-sync.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

@ApiTags("leads")
@Controller("leads")
export class CrmSyncController {
  constructor(
    @Inject(CrmSyncStore) private readonly crm: CrmSyncStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get(":id/crm-sync")
  async status(@Req() req: TenantRequest, @Param("id") id: string) {
    return { provider: this.crm.provider, result: await this.crm.get(resolveTenantId(req), id) };
  }

  /** Upsert the lead into the configured CRM (HubSpot when keyed; else skipped). */
  @Post(":id/crm-sync")
  async sync(@Req() req: TenantRequest, @Param("id") id: string) {
    const t = resolveTenantId(req);
    const lead = this.pageEngine.getLead(t, id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const result = await this.crm.sync(t, lead, new Date().toISOString());
    if (result.status === "synced") this.audit.record("integration", "lead", id);
    return { result, provider: this.crm.provider };
  }

  @Post(":id/crm-sync/retry")
  async retry(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.sync(req, id);
  }
}
