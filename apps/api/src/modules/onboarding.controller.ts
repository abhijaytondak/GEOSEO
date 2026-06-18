import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { OnboardingStatus } from "@geoseo/types";
import { OnboardingStore } from "./onboarding.service";
import { SettingsStore } from "./settings.service";
import { AuditStore } from "./audit.service";
import { BrandAnalysisStore } from "./brand-analysis.service";
import { BrandLibraryStore } from "./brand-library.service";
import { crawlBrandDraft } from "./brand-library.extract";
import { SiteThemeStore } from "./site-theme.service";
import { validateBody, v } from "../common/validation";
import { resolveTenantId, type TenantRequest } from "../common/tenant";

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
    @Inject(BrandAnalysisStore) private readonly brandAnalysis: BrandAnalysisStore,
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(SiteThemeStore) private readonly theme: SiteThemeStore,
  ) {}

  @Get("status")
  async status(@Req() req: TenantRequest) {
    return { onboarding: await this.onboarding.get(resolveTenantId(req)) };
  }

  /** Save step progress mid-flow (e.g. after website scan / brand save). */
  @Post("progress")
  async progress(@Req() req: TenantRequest, @Body(validateBody(PatchSchema)) body: Partial<OnboardingStatus>) {
    return { onboarding: await this.onboarding.patch(resolveTenantId(req), body) };
  }

  /**
   * Finalize self-serve setup: persist the company's real workspace identity
   * (replaces seed defaults), record requested integrations, and mark onboarded.
   * Brand Memory, theme, and publishing are persisted by their own endpoints
   * during the flow — this ties identity + completion together.
   */
  @Post("complete")
  async complete(
    @Req() req: TenantRequest,
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
    const onboarding = await this.onboarding.complete(resolveTenantId(req), {
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
    // Auto-analyze the brand in the background so the dashboard Scorecard is warm on first load.
    // Fire-and-forget: never block or fail the onboarding response on the network-bound analysis.
    void this.brandAnalysis.run(resolveTenantId(req), new Date().toISOString()).catch(() => undefined);
    // Dynamic Brand Memory: auto-extract the company's real products / personas / proof / tone of
    // voice / images from its OWN website (the onboarded URL) and replace the sample library — so
    // onboarding ANY company populates Brand Memory from that company's site. Fire-and-forget (never
    // blocks onboarding); only overwrites when the crawl actually reached the site (no clobber-with-empty).
    const brandTenant = resolveTenantId(req);
    const siteUrl = (body.websiteUrl?.trim() || body.domain).trim();
    void crawlBrandDraft(siteUrl)
      .then((r) => (r.crawled ? this.library.replace(brandTenant, r.draft, new Date().toISOString()) : undefined))
      .catch(() => undefined);
    // Scan + confirm the site theme so the Brand Kit (real color ramps + typography) reflects the
    // onboarded company's own site — not a seed palette. Fire-and-forget, same as above.
    void this.theme
      .scan(brandTenant, siteUrl)
      .then((p) => this.theme.confirm(brandTenant, p.id))
      .catch(() => undefined);
    return { onboarding, settings: this.settings.get() };
  }
}
