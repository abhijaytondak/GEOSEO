import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { TeamMember, WorkspaceIntegration, WorkspaceSettings } from "@geoseo/types";
import { JobsStore } from "./jobs.service";
import { SettingsStore } from "./settings.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
  ) {}

  @Get()
  get() {
    return { settings: this.settings.get() };
  }

  @Put()
  update(@Body() body: Partial<WorkspaceSettings>) {
    return { settings: this.settings.update(body), job: this.jobs.create("settings-sync") };
  }

  @Patch("integrations/:id")
  updateIntegration(@Param("id") id: string, @Body() body: Partial<WorkspaceIntegration>) {
    return { integration: this.settings.updateIntegration(id, body), job: this.jobs.create("settings-sync") };
  }

  @Post("team")
  addTeamMember(@Body() body: Omit<TeamMember, "id">) {
    return { member: this.settings.addTeamMember(body), settings: this.settings.get() };
  }

  @Delete("team/:id")
  removeTeamMember(@Param("id") id: string) {
    return { ...this.settings.removeTeamMember(id), settings: this.settings.get() };
  }
}
