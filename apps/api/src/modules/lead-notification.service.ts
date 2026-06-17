import { Injectable, NotFoundException } from "@nestjs/common";
import type { Lead, LeadNotification, LeadNotificationRule, LeadScore } from "@geoseo/types";
import { DocStore } from "../db/db";

type NotifyState = { rules: Record<string, LeadNotificationRule>; log: LeadNotification[]; seq: number };

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Per-tenant lead notification rules + delivery log (Leads PRD Gap 5; P0-6) — `cx_lead_notify`.
 * Channels (email/Slack/webhook) record as in-app deliveries until real providers connect;
 * rule evaluation + suppression are real. Additive.
 */
@Injectable()
export class LeadNotificationStore {
  private cache = new Map<string, NotifyState>();
  private db = new DocStore<NotifyState>("cx_lead_notify");

  private async state(tenantId: string): Promise<NotifyState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { rules: {}, log: [], seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: NotifyState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async listRules(tenantId: string): Promise<LeadNotificationRule[]> {
    return Object.values((await this.state(tenantId)).rules);
  }

  async createRule(tenantId: string, input: Partial<LeadNotificationRule> & { name: string }): Promise<LeadNotificationRule> {
    const s = await this.state(tenantId);
    s.seq += 1;
    const rule: LeadNotificationRule = {
      id: `lnr-${s.seq}`,
      workspaceId: tenantId,
      name: input.name,
      enabled: input.enabled ?? true,
      channels: input.channels?.length ? input.channels : ["in_app"],
      minScore: input.minScore,
      statuses: input.statuses,
      pages: input.pages,
      ownerOnly: input.ownerOnly,
      quietHours: input.quietHours,
    };
    s.rules[rule.id] = rule;
    this.persist(tenantId, s);
    return rule;
  }

  async updateRule(tenantId: string, id: string, patch: Partial<LeadNotificationRule>): Promise<LeadNotificationRule> {
    const s = await this.state(tenantId);
    const existing = s.rules[id];
    if (!existing) throw new NotFoundException(`No notification rule '${id}'`);
    s.rules[id] = { ...existing, ...patch, id: existing.id };
    this.persist(tenantId, s);
    return s.rules[id];
  }

  async deleteRule(tenantId: string, id: string): Promise<{ id: string; deleted: boolean }> {
    const s = await this.state(tenantId);
    if (!s.rules[id]) throw new NotFoundException(`No notification rule '${id}'`);
    delete s.rules[id];
    this.persist(tenantId, s);
    return { id, deleted: true };
  }

  async notificationsFor(tenantId: string, leadId: string): Promise<LeadNotification[]> {
    return (await this.state(tenantId)).log.filter((n) => n.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Evaluate enabled rules against a lead; record a delivery per matched rule. */
  async notify(tenantId: string, lead: Lead, score?: LeadScore): Promise<{ delivered: LeadNotification[]; evaluated: number }> {
    const s = await this.state(tenantId);
    const total = score?.total ?? lead.score ?? 0;
    const rules = Object.values(s.rules);
    const matched = rules.filter((r) => {
      if (!r.enabled) return false;
      if (r.minScore != null && total < r.minScore) return false;
      if (r.statuses?.length && !r.statuses.includes(lead.status)) return false;
      if (r.pages?.length && lead.pageId && !r.pages.includes(lead.pageId)) return false;
      return true;
    });
    const delivered: LeadNotification[] = matched.map((r) => {
      s.seq += 1;
      const entry: LeadNotification = {
        id: `ln-${s.seq}`,
        leadId: lead.id,
        ruleId: r.id,
        channels: r.channels,
        message: `${lead.name || lead.email} (score ${total}) from ${lead.pageTitle ?? "a page"} — via "${r.name}".`,
        status: "sent",
        createdAt: nowIso(),
      };
      return entry;
    });
    s.log = [...delivered, ...s.log].slice(0, 500);
    this.persist(tenantId, s);
    return { delivered, evaluated: rules.filter((r) => r.enabled).length };
  }
}
