import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { IntegrationStatus, TeamMember, WorkspaceIntegration, WorkspaceSettings } from "@geoseo/types";
import { JobsStore } from "./jobs.service";
import { SettingsStore } from "./settings.service";
import { AuditStore } from "./audit.service";
import { CmsPublishStore } from "./cms-publish.service";
import { GscService } from "./gsc.service";
import { CrmSyncStore } from "./crm-sync.service";
import { KeywordResearchService } from "./keyword-research.service";
import { ImageGenStore } from "./image-gen.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(JobsStore) private readonly jobs: JobsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
    @Inject(CmsPublishStore) private readonly cms: CmsPublishStore,
    @Inject(GscService) private readonly gsc: GscService,
    @Inject(CrmSyncStore) private readonly crm: CrmSyncStore,
    @Inject(KeywordResearchService) private readonly keywords: KeywordResearchService,
    @Inject(ImageGenStore) private readonly images: ImageGenStore,
  ) {}

  /** Live, env-detected connection state for provider-backed integrations, so Settings
   *  reflects reality (a configured seam) instead of a stale seeded status. Returns null
   *  for ids that aren't seam-backed (manual toggles keep their stored status). */
  private liveStatus(id: string): IntegrationStatus | null {
    switch (id) {
      case "webflow":
      case "wordpress":
      case "shopify":
        return this.cms.configured && this.cms.provider === id ? "connected" : "needs-attention";
      case "search-console":
        return this.gsc.configured ? "connected" : "needs-attention";
      case "hubspot":
        return this.crm.configured ? "connected" : "needs-attention";
      case "dataforseo":
        return this.keywords.configured ? "connected" : "needs-attention";
      case "image-generation":
        return this.images.configured ? "connected" : "needs-attention";
      default:
        return null;
    }
  }

  @Get()
  get() {
    const settings = this.settings.get();
    // Overlay env-detected truth on seam-backed integrations (audit: Settings must not
    // claim a provider is connected when its seam reports unconfigured).
    const integrations = settings.integrations.map((integration) => {
      const live = this.liveStatus(integration.id);
      return live ? { ...integration, status: live } : integration;
    });
    return { settings: { ...settings, integrations } };
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

  @Patch("team/:id")
  updateTeamMember(@Param("id") id: string, @Body() body: Partial<Omit<TeamMember, "id">>) {
    const member = this.settings.updateTeamMember(id, body);
    this.audit.record("update", "settings", id);
    return { member, settings: this.settings.get() };
  }

  @Delete("team/:id")
  removeTeamMember(@Param("id") id: string) {
    const result = this.settings.removeTeamMember(id);
    this.audit.record("delete", "settings", id);
    return { ...result, settings: this.settings.get() };
  }
}
