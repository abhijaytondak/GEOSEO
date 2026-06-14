import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { TeamMember, WorkspaceIntegration, WorkspaceSettings } from "@geoseo/types";
import { DocStore } from "../db/db";

@Injectable()
export class SettingsStore implements OnModuleInit {
  private db = new DocStore<WorkspaceSettings>("cx_settings");

  async onModuleInit() {
    await this.db.init(this.settings, (loaded) => {
      // Backfill fields added after this doc was first persisted.
      this.settings = { ...this.settings, ...loaded, publishing: loaded.publishing ?? this.settings.publishing };
    });
  }

  private settings: WorkspaceSettings = {
    profile: {
      workspaceName: "Your Workspace",
      domain: "example.com",
      defaultPublishPath: "/feeds",
      timezone: "Asia/Kolkata",
    },
    notifications: {
      weeklyDigest: true,
      criticalAlerts: true,
      publishFailures: true,
      leadAlerts: false,
    },
    // Status here is a seed; SettingsController.get() overlays the real env-detected
    // state for provider-backed rows, so this never claims an unconfigured provider is connected.
    integrations: [
      {
        id: "webflow",
        label: "Webflow",
        description: "Publish generated pages to the marketing site.",
        status: "needs-attention",
      },
      {
        id: "search-console",
        label: "Google Search Console",
        description: "Read impressions, clicks, ranking changes, and index state.",
        status: "needs-attention",
      },
      {
        id: "hubspot",
        label: "HubSpot",
        description: "Sync qualified leads and source-page attribution.",
        status: "needs-attention",
      },
      {
        id: "dataforseo",
        label: "DataForSEO",
        description: "Real keyword volume, difficulty, and SERP data for research.",
        status: "needs-attention",
      },
      {
        id: "image-generation",
        label: "Image generation",
        description: "Generate brand- and theme-aware hero/infographic images for pages.",
        status: "needs-attention",
      },
    ],
    team: [
      { id: "tm-1", name: "Workspace Owner", email: "owner@example.com", role: "owner" },
    ],
    billing: { plan: "Grow", status: "trial", seatsUsed: 1, seatsLimit: 5 },
    publishing: { requireApproval: true, autoSitemap: true, autoLlms: true },
  };

  get() {
    return this.settings;
  }

  update(update: Partial<WorkspaceSettings>) {
    this.settings = {
      ...this.settings,
      ...update,
      profile: { ...this.settings.profile, ...(update.profile ?? {}) },
      notifications: { ...this.settings.notifications, ...(update.notifications ?? {}) },
      integrations: update.integrations ?? this.settings.integrations,
      team: update.team ?? this.settings.team,
      billing: { ...this.settings.billing, ...(update.billing ?? {}) },
      publishing: { ...this.settings.publishing, ...(update.publishing ?? {}) },
    };
    this.db.save(this.settings);
    return this.settings;
  }

  updateIntegration(id: string, update: Partial<WorkspaceIntegration>) {
    let found = false;
    this.settings.integrations = this.settings.integrations.map((integration) => {
      if (integration.id !== id) return integration;
      found = true;
      return {
        ...integration,
        ...update,
        lastSyncAt: update.status === "connected" ? new Date().toISOString() : integration.lastSyncAt,
      };
    });
    if (!found) throw new NotFoundException(`Integration ${id} not found`);
    this.db.save(this.settings);
    return this.settings.integrations.find((integration) => integration.id === id)!;
  }

  addTeamMember(member: Omit<TeamMember, "id">) {
    const next: TeamMember = { id: `tm-${Date.now()}`, ...member };
    this.settings.team = [...this.settings.team, next];
    this.settings.billing = { ...this.settings.billing, seatsUsed: this.settings.team.length };
    this.db.save(this.settings);
    return next;
  }

  removeTeamMember(id: string) {
    const before = this.settings.team.length;
    this.settings.team = this.settings.team.filter((member) => member.id !== id);
    if (this.settings.team.length === before) throw new NotFoundException(`Team member ${id} not found`);
    this.settings.billing = { ...this.settings.billing, seatsUsed: this.settings.team.length };
    this.db.save(this.settings);
    return { id, removed: true };
  }
}
