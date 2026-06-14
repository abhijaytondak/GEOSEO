import { Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CrmSyncStore } from "./crm-sync.service";
import { PageEngineStore } from "./page-engine.service";
import { AuditStore } from "./audit.service";

@ApiTags("leads")
@Controller("leads")
export class CrmSyncController {
  constructor(
    @Inject(CrmSyncStore) private readonly crm: CrmSyncStore,
    @Inject(PageEngineStore) private readonly pageEngine: PageEngineStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get(":id/crm-sync")
  status(@Param("id") id: string) {
    return { provider: this.crm.provider, result: this.crm.get(id) };
  }

  /** Upsert the lead into the configured CRM (HubSpot when keyed; else skipped). */
  @Post(":id/crm-sync")
  async sync(@Param("id") id: string) {
    const lead = this.pageEngine.getLead(id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const result = await this.crm.sync(lead, new Date().toISOString());
    if (result.status === "synced") this.audit.record("integration", "lead", id);
    return { result, provider: this.crm.provider };
  }

  @Post(":id/crm-sync/retry")
  async retry(@Param("id") id: string) {
    return this.sync(id);
  }
}
