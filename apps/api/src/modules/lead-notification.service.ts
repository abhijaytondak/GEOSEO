import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { Lead, LeadNotification, LeadNotificationRule, LeadScore } from "@geoseo/types";
import { DocStore } from "../db/db";

type NotifyState = { rules: Record<string, LeadNotificationRule>; log: LeadNotification[]; seq: number };

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Lead notification rules + delivery log (Leads PRD Gap 5) — `cx_lead_notify`.
 * Channels (email/Slack/webhook) are recorded as in-app deliveries until real
 * providers are connected; rule evaluation + suppression are real. Additive.
 */
@Injectable()
export class LeadNotificationStore implements OnModuleInit {
  private rules: Record<string, LeadNotificationRule> = {};
  private log: LeadNotification[] = [];
  private seq = 0;
  private db = new DocStore<NotifyState>("cx_lead_notify");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.rules = loaded.rules ?? {};
      this.log = loaded.log ?? [];
      this.seq = loaded.seq ?? 0;
    });
  }

  private snapshot(): NotifyState {
    return { rules: this.rules, log: this.log, seq: this.seq };
  }

  listRules(): LeadNotificationRule[] {
    return Object.values(this.rules);
  }

  createRule(input: Partial<LeadNotificationRule> & { name: string }): LeadNotificationRule {
    this.seq += 1;
    const rule: LeadNotificationRule = {
      id: `lnr-${this.seq}`,
      workspaceId: "ws-default",
      name: input.name,
      enabled: input.enabled ?? true,
      channels: input.channels?.length ? input.channels : ["in_app"],
      minScore: input.minScore,
      statuses: input.statuses,
      pages: input.pages,
      ownerOnly: input.ownerOnly,
      quietHours: input.quietHours,
    };
    this.rules[rule.id] = rule;
    this.db.save(this.snapshot());
    return rule;
  }

  updateRule(id: string, patch: Partial<LeadNotificationRule>): LeadNotificationRule {
    const existing = this.rules[id];
    if (!existing) throw new NotFoundException(`No notification rule '${id}'`);
    this.rules[id] = { ...existing, ...patch, id: existing.id };
    this.db.save(this.snapshot());
    return this.rules[id];
  }

  deleteRule(id: string): { id: string; deleted: boolean } {
    if (!this.rules[id]) throw new NotFoundException(`No notification rule '${id}'`);
    delete this.rules[id];
    this.db.save(this.snapshot());
    return { id, deleted: true };
  }

  notificationsFor(leadId: string): LeadNotification[] {
    return this.log.filter((n) => n.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Evaluate enabled rules against a lead; record a delivery per matched rule. */
  notify(lead: Lead, score?: LeadScore): { delivered: LeadNotification[]; evaluated: number } {
    const total = score?.total ?? lead.score ?? 0;
    const matched = this.listRules().filter((r) => {
      if (!r.enabled) return false;
      if (r.minScore != null && total < r.minScore) return false;
      if (r.statuses?.length && !r.statuses.includes(lead.status)) return false;
      if (r.pages?.length && lead.pageId && !r.pages.includes(lead.pageId)) return false;
      return true;
    });
    const delivered: LeadNotification[] = matched.map((r) => {
      this.seq += 1;
      const entry: LeadNotification = {
        id: `ln-${this.seq}`,
        leadId: lead.id,
        ruleId: r.id,
        channels: r.channels,
        message: `${lead.name || lead.email} (score ${total}) from ${lead.pageTitle ?? "a page"} — via "${r.name}".`,
        status: "sent",
        createdAt: nowIso(),
      };
      return entry;
    });
    this.log = [...delivered, ...this.log].slice(0, 500);
    this.db.save(this.snapshot());
    return { delivered, evaluated: this.listRules().filter((r) => r.enabled).length };
  }
}
