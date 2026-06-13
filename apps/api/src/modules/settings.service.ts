import { Injectable, NotFoundException } from "@nestjs/common";
import type { TeamMember, WorkspaceIntegration, WorkspaceSettings } from "@geoseo/types";

@Injectable()
export class SettingsStore {
  private settings: WorkspaceSettings = {
    profile: {
      workspaceName: "Northwind Labs",
      domain: "northwindlabs.io",
      defaultPublishPath: "/feeds",
      timezone: "Asia/Kolkata",
    },
    notifications: {
      weeklyDigest: true,
      criticalAlerts: true,
      publishFailures: true,
      leadAlerts: false,
    },
    integrations: [
      {
        id: "webflow",
        label: "Webflow",
        description: "Publish generated pages to the marketing site.",
        status: "connected",
        lastSyncAt: "2026-06-12T00:00:00.000Z",
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
        status: "disabled",
      },
    ],
    team: [
      { id: "tm-1", name: "Maya Chen", email: "maya@northwindlabs.io", role: "owner" },
      { id: "tm-2", name: "Ari Patel", email: "ari@northwindlabs.io", role: "marketer" },
    ],
    billing: { plan: "Grow", status: "trial", seatsUsed: 2, seatsLimit: 5 },
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
    };
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
    return this.settings.integrations.find((integration) => integration.id === id)!;
  }

  addTeamMember(member: Omit<TeamMember, "id">) {
    const next: TeamMember = { id: `tm-${Date.now()}`, ...member };
    this.settings.team = [...this.settings.team, next];
    this.settings.billing = { ...this.settings.billing, seatsUsed: this.settings.team.length };
    return next;
  }

  removeTeamMember(id: string) {
    const before = this.settings.team.length;
    this.settings.team = this.settings.team.filter((member) => member.id !== id);
    if (this.settings.team.length === before) throw new NotFoundException(`Team member ${id} not found`);
    this.settings.billing = { ...this.settings.billing, seatsUsed: this.settings.team.length };
    return { id, removed: true };
  }
}
