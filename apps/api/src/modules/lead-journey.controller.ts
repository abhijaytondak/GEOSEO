import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { LeadJourneyEventType } from "@geoseo/types";
import { BadRequestException } from "@nestjs/common";
import { LeadJourneyStore } from "./lead-journey.service";
import { AiBotActivityStore } from "./ai-search.service";
import { PageEngineStore } from "./page-engine.service";
import { SettingsStore } from "./settings.service";
import { Public } from "../common/public.decorator";
import { validateBody, v } from "../common/validation";
import { resolveMode } from "../common/mode";
import { resolveTenantId, type TenantRequest } from "../common/tenant";
import { refererAllowed } from "../common/public-ingest";

const EVENT_TYPES: LeadJourneyEventType[] = ["page_view", "cta_click", "form_start", "form_submit", "download", "external_click"];

const EventSchema = {
  anonymousVisitorId: v.string({ min: 1, max: 128 }),
  sessionId: v.string({ min: 1, max: 128 }),
  type: v.enumOf(EVENT_TYPES),
  url: v.string({ min: 1, max: 2048 }),
  pageId: v.optional(v.string({ max: 128 })),
  title: v.optional(v.string({ max: 300 })),
  referrer: v.optional(v.string({ max: 2048 })),
  durationMs: v.optional(v.number({ min: 0, max: 86_400_000 })),
  leadId: v.optional(v.string({ max: 128 })),
};

@ApiTags("public")
@Controller("public")
export class PublicEventsController {
  constructor(
    @Inject(LeadJourneyStore) private readonly journey: LeadJourneyStore,
    @Inject(AiBotActivityStore) private readonly bots: AiBotActivityStore,
    @Inject(PageEngineStore) private readonly pages: PageEngineStore,
    @Inject(SettingsStore) private readonly settings: SettingsStore,
  ) {}

  // Rate-limiting handled globally by PublicThrottleGuard (PRD §18).
  @Public()
  @Post("events")
  async record(
    @Body(validateBody(EventSchema))
    body: {
      anonymousVisitorId: string;
      sessionId: string;
      type: LeadJourneyEventType;
      url: string;
      pageId?: string;
      title?: string;
      referrer?: string;
      durationMs?: number;
      leadId?: string;
    },
  ) {
    // Production anti-abuse: events must originate from an allow-listed host when
    // configured (demo stays permissive — see common/public-ingest).
    if (resolveMode() !== "demo" && !refererAllowed(body.url, this.settings.get().profile.allowedDomains)) {
      throw new BadRequestException("Events are not accepted from this domain");
    }
    // Route the anonymous event to the page's OWNING workspace (A5), not the caller.
    const slug = body.url.includes("/feeds/") ? body.url.split("/feeds")[1] : undefined;
    const tenantId = this.pages.publicTenantFor({ pageId: body.pageId, slug });
    const event = await this.journey.record(tenantId, body);
    return { event };
  }

  /**
   * Records an AI-crawler visit to a published page (AI Search bot analytics).
   * Classifies the supplied user-agent; no-ops for human/unknown agents. Called
   * fire-and-forget by the public /feeds renderer.
   */
  @Public()
  @Post("ai-bot-hit")
  botHit(@Body(validateBody({ userAgent: v.string({ min: 1, max: 1024 }), slug: v.optional(v.string({ max: 256 })), pageId: v.optional(v.string({ max: 128 })) }))
    body: { userAgent: string; slug?: string; pageId?: string }) {
    const bot = AiBotActivityStore.classify(body.userAgent);
    if (!bot) return { recorded: false };
    const hit = this.bots.record({ bot, url: body.slug ? `/feeds/${body.slug}` : "/feeds", pageId: body.pageId, userAgent: body.userAgent.slice(0, 256) });
    return { recorded: true, bot, hit };
  }
}

@ApiTags("leads")
@Controller("leads")
export class LeadJourneyController {
  constructor(@Inject(LeadJourneyStore) private readonly journey: LeadJourneyStore) {}

  @Get(":id/journey")
  journey_(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.journey.journeyForLead(resolveTenantId(req), id);
  }

  @Post(":id/link-visitor")
  async link(@Req() req: TenantRequest, @Param("id") id: string, @Body(validateBody({ visitorId: v.string({ min: 1, max: 128 }) })) body: { visitorId: string }) {
    const t = resolveTenantId(req);
    await this.journey.linkVisitor(t, id, body.visitorId);
    return this.journey.journeyForLead(t, id);
  }
}
