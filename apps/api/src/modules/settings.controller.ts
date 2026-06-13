import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { TeamMember, WorkspaceIntegration, WorkspaceSettings } from "@geoseo/types";
import { JobsStore } from "./jobs.service";
import { SettingsStore } from "./settings.service";
import { AuditStore } from "./audit.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  get() {
    return { settings: this.settings.get() };
  }

  @Put()
  update(@Body() body: Partial<WorkspaceSettings>) {
    const settings = this.settings.update(body);
    this.audit.record("update", "settings", "workspace");
    return { settings, job: this.jobs.create("settings-sync") };
  }

  @Patch("integrations/:id")
  updateIntegration(@Param("id") id: string, @Body() body: Partial<WorkspaceIntegration>) {
    const integration = this.settings.updateIntegration(id, body);
    this.audit.record("integration", "settings", id);
    return { integration, job: this.jobs.create("settings-sync") };
  }

  @Post("team")
  addTeamMember(@Body() body: Omit<TeamMember, "id">) {
    const member = this.settings.addTeamMember(body);
    this.audit.record("create", "settings", member.id);
    return { member, settings: this.settings.get() };
  }

  @Delete("team/:id")
  removeTeamMember(@Param("id") id: string) {
    const result = this.settings.removeTeamMember(id);
    this.audit.record("delete", "settings", id);
    return { ...result, settings: this.settings.get() };
  }
}
