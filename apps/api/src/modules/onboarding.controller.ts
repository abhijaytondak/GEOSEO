import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { OnboardingStatus } from "@geoseo/types";
import { OnboardingStore } from "./onboarding.service";
import { SettingsStore } from "./settings.service";
import { AuditStore } from "./audit.service";
import { validateBody, v } from "../common/validation";

const PatchSchema = {
  workspaceName: v.optional(v.string({ max: 120 })),
  domain: v.optional(v.string({ max: 253 })),
  websiteUrl: v.optional(v.string({ max: 2048 })),
  requestedIntegrations: v.optional(v.arrayOf(v.string({ max: 64 }))),
  steps: v.optional(v.object()),
};

const CompleteSchema = {
  workspaceName: v.string({ min: 1, max: 120 }),
  domain: v.string({ min: 1, max: 253 }),
  websiteUrl: v.optional(v.string({ max: 2048 })),
  defaultPublishPath: v.optional(v.string({ max: 64 })),
  timezone: v.optional(v.string({ max: 64 })),
  requestedIntegrations: v.optional(v.arrayOf(v.string({ max: 64 }))),
};

@ApiTags("onboarding")
@Controller("onboarding")
export class OnboardingController {
  constructor(
    @Inject(OnboardingStore) private readonly onboarding: OnboardingStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get("status")
  status() {
    return { onboarding: this.onboarding.get() };
  }

  /** Save step progress mid-flow (e.g. after website scan / brand save). */
  @Post("progress")
  progress(@Body(validateBody(PatchSchema)) body: Partial<OnboardingStatus>) {
    return { onboarding: this.onboarding.patch(body) };
  }

  /**
   * Finalize self-serve setup: persist the company's real workspace identity
   * (replaces seed defaults), record requested integrations, and mark onboarded.
   * Brand Memory, theme, and publishing are persisted by their own endpoints
   * during the flow — this ties identity + completion together.
   */
  @Post("complete")
  complete(
    @Body(validateBody(CompleteSchema))
    body: {
      workspaceName: string;
      domain: string;
      websiteUrl?: string;
      defaultPublishPath?: string;
      timezone?: string;
      requestedIntegrations?: string[];
    },
  ) {
    // Make this the company's workspace (no more seed identity).
    this.settings.update({
      profile: {
        workspaceName: body.workspaceName,
        domain: body.domain,
        defaultPublishPath: body.defaultPublishPath ?? "/feeds",
        timezone: body.timezone ?? "UTC",
      },
    });
    // Mark any requested integrations as needing connection.
    for (const id of body.requestedIntegrations ?? []) {
      try {
        this.settings.updateIntegration(id, { status: "needs-attention" });
      } catch {
        // Unknown integration id — ignore; capture intent in onboarding state below.
      }
    }
    const onboarding = this.onboarding.complete({
      workspaceName: body.workspaceName,
      domain: body.domain,
      websiteUrl: body.websiteUrl,
      requestedIntegrations: body.requestedIntegrations ?? [],
      steps: {
        websiteScanned: true,
        brandSaved: true,
        themeScanned: true,
        publishingConfigured: true,
        opportunitiesSeeded: true,
      },
    });
    this.audit.record("create", "settings", "onboarding");
    return { onboarding, settings: this.settings.get() };
  }
}
