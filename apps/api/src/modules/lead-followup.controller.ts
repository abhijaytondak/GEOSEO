import { Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadFollowupStore } from "./lead-followup.service";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

@ApiTags("leads")
@Controller("leads")
export class LeadFollowupController {
  constructor(@Inject(LeadFollowupStore) private readonly followup: LeadFollowupStore) {}

  @Get(":id/followup")
  latest(@Param("id") id: string) {
    return { draft: this.followup.latest(id) };
  }

  @Post(":id/followup")
  async generate(@Req() req: TenantRequest, @Param("id") id: string) {
    const draft = await this.followup.generate(resolveTenantId(req), id, new Date().toISOString());
    return { draft };
  }
}
