import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { LeadJourneyEventType } from "@geoseo/types";
import { LeadJourneyStore } from "./lead-journey.service";
import { Public } from "../common/public.decorator";
import { validateBody, v } from "../common/validation";

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
  constructor(@Inject(LeadJourneyStore) private readonly journey: LeadJourneyStore) {}

  // Rate-limiting handled globally by PublicThrottleGuard (PRD §18).
  @Public()
  @Post("events")
  record(
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
    const event = this.journey.record(body);
    return { event };
  }
}

@ApiTags("leads")
@Controller("leads")
export class LeadJourneyController {
  constructor(@Inject(LeadJourneyStore) private readonly journey: LeadJourneyStore) {}

  @Get(":id/journey")
  journey_(@Param("id") id: string) {
    return this.journey.journeyForLead(id);
  }

  @Post(":id/link-visitor")
  link(@Param("id") id: string, @Body(validateBody({ visitorId: v.string({ min: 1, max: 128 }) })) body: { visitorId: string }) {
    this.journey.linkVisitor(id, body.visitorId);
    return this.journey.journeyForLead(id);
  }
}
