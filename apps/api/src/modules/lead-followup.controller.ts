import { Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LeadFollowupStore } from "./lead-followup.service";

@ApiTags("leads")
@Controller("leads")
export class LeadFollowupController {
  constructor(@Inject(LeadFollowupStore) private readonly followup: LeadFollowupStore) {}

  @Get(":id/followup")
  latest(@Param("id") id: string) {
    return { draft: this.followup.latest(id) };
  }

  @Post(":id/followup")
  async generate(@Param("id") id: string) {
    const draft = await this.followup.generate(id, new Date().toISOString());
    return { draft };
  }
}
