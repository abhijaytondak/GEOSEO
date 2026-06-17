import { Injectable } from "@nestjs/common";
import type { LeadJourneyEvent, LeadJourneyEventType, LeadJourneySummary } from "@geoseo/types";
import { DocStore } from "../db/db";

type JourneyState = {
  events: LeadJourneyEvent[];
  leadVisitor: Record<string, string>; // leadId → anonymousVisitorId
  seq: number;
};

/**
 * Per-tenant visitor journey tracking (Leads PRD Gap 1 / §11; P0-6). Stores anonymous
 * page events by visitor and links them to a lead on conversion — additive (no change
 * to the Lead record). `cx_lead_journey`.
 */
@Injectable()
export class LeadJourneyStore {
  private cache = new Map<string, JourneyState>();
  private db = new DocStore<JourneyState>("cx_lead_journey");

  private async state(tenantId: string): Promise<JourneyState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { events: [], leadVisitor: {}, seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: JourneyState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async record(
    tenantId: string,
    input: {
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
  ): Promise<LeadJourneyEvent> {
    const s = await this.state(tenantId);
    s.seq += 1;
    const event: LeadJourneyEvent = {
      id: `lj-${s.seq}`,
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
    s.events.unshift(event);
    if (s.events.length > 5000) s.events.length = 5000;
    this.persist(tenantId, s);
    return event;
  }

  /** Associate a visitor's event history with a converted lead. */
  async linkVisitor(tenantId: string, leadId: string, anonymousVisitorId: string): Promise<void> {
    const s = await this.state(tenantId);
    s.leadVisitor[leadId] = anonymousVisitorId;
    // Backfill leadId onto that visitor's existing events.
    for (const e of s.events) if (e.anonymousVisitorId === anonymousVisitorId) e.leadId = leadId;
    this.persist(tenantId, s);
  }

  private eventsForLead(s: JourneyState, leadId: string): LeadJourneyEvent[] {
    const visitorId = s.leadVisitor[leadId];
    return s.events
      .filter((e) => e.leadId === leadId || (visitorId && e.anonymousVisitorId === visitorId))
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  async journeyForLead(tenantId: string, leadId: string): Promise<{ events: LeadJourneyEvent[]; summary: LeadJourneySummary }> {
    const s = await this.state(tenantId);
    const events = this.eventsForLead(s, leadId);
    return { events, summary: summarize(events, s.leadVisitor[leadId]) };
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
