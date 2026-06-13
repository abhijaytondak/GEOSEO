import { Injectable, OnModuleInit } from "@nestjs/common";
import type { LeadJourneyEvent, LeadJourneyEventType, LeadJourneySummary } from "@geoseo/types";
import { DocStore } from "../db/db";

type JourneyState = {
  events: LeadJourneyEvent[];
  leadVisitor: Record<string, string>; // leadId → anonymousVisitorId
  seq: number;
};

/**
 * Visitor journey tracking (Leads PRD Gap 1 / §11). Stores anonymous page events
 * by visitor and links them to a lead on conversion — all additive (no change to
 * the core Lead record). Persisted to `cx_lead_journey`.
 */
@Injectable()
export class LeadJourneyStore implements OnModuleInit {
  private events: LeadJourneyEvent[] = [];
  private leadVisitor: Record<string, string> = {};
  private seq = 0;
  private db = new DocStore<JourneyState>("cx_lead_journey");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.events = loaded.events ?? [];
      this.leadVisitor = loaded.leadVisitor ?? {};
      this.seq = loaded.seq ?? 0;
    });
  }

  private snapshot(): JourneyState {
    return { events: this.events, leadVisitor: this.leadVisitor, seq: this.seq };
  }

  record(input: {
    anonymousVisitorId: string;
    sessionId: string;
    type: LeadJourneyEventType;
    url: string;
    pageId?: string;
    title?: string;
    referrer?: string;
    durationMs?: number;
    leadId?: string;
  }): LeadJourneyEvent {
    this.seq += 1;
    const event: LeadJourneyEvent = {
      id: `lj-${this.seq}`,
      anonymousVisitorId: input.anonymousVisitorId,
      sessionId: input.sessionId,
      type: input.type,
      url: input.url,
      pageId: input.pageId,
      title: input.title,
      referrer: input.referrer,
      durationMs: input.durationMs,
      leadId: input.leadId,
      occurredAt: new Date().toISOString(),
    };
    this.events.unshift(event);
    if (this.events.length > 5000) this.events.length = 5000;
    this.db.save(this.snapshot());
    return event;
  }

  /** Associate a visitor's event history with a converted lead. */
  linkVisitor(leadId: string, anonymousVisitorId: string): void {
    this.leadVisitor[leadId] = anonymousVisitorId;
    // Backfill leadId onto that visitor's existing events.
    for (const e of this.events) if (e.anonymousVisitorId === anonymousVisitorId) e.leadId = leadId;
    this.db.save(this.snapshot());
  }

  private eventsForLead(leadId: string): LeadJourneyEvent[] {
    const visitorId = this.leadVisitor[leadId];
    return this.events
      .filter((e) => e.leadId === leadId || (visitorId && e.anonymousVisitorId === visitorId))
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  journeyForLead(leadId: string): { events: LeadJourneyEvent[]; summary: LeadJourneySummary } {
    const events = this.eventsForLead(leadId);
    return { events, summary: summarize(events, this.leadVisitor[leadId]) };
  }
}

function summarize(events: LeadJourneyEvent[], visitorId?: string): LeadJourneySummary {
  const sessions = new Set(events.map((e) => e.sessionId));
  const firstSeenAt = events[0]?.occurredAt;
  const conversion = [...events].reverse().find((e) => e.type === "form_submit");
  const convertedAt = conversion?.occurredAt;
  const timeToConvertSeconds =
    firstSeenAt && convertedAt
      ? Math.max(0, Math.round((new Date(convertedAt).getTime() - new Date(firstSeenAt).getTime()) / 1000))
      : undefined;

  const pageViews = new Map<string, { pageId?: string; title: string; url: string; views: number }>();
  for (const e of events) {
    if (e.type !== "page_view") continue;
    const key = e.url;
    const existing = pageViews.get(key);
    if (existing) existing.views += 1;
    else pageViews.set(key, { pageId: e.pageId, title: e.title ?? e.url, url: e.url, views: 1 });
  }
  const topPages = [...pageViews.values()].sort((a, b) => b.views - a.views).slice(0, 5);

  return {
    anonymousVisitorId: visitorId,
    sessionCount: sessions.size,
    touchpointCount: events.length,
    firstSeenAt,
    convertedAt,
    timeToConvertSeconds,
    topPages,
  };
}
