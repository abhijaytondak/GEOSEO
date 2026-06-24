import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Lead, LeadNotification, LeadNotificationRule, LeadScore } from "@geoseo/types";
import { DocStore } from "../db/db";
import { sendEmail, leadAlertHtml } from "../common/email";

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
  private readonly log = new Logger(LeadNotificationStore.name);
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
      webhookUrl: input.webhookUrl,
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

  /** Evaluate enabled rules against a lead; deliver per matched rule (email/Slack/in-app). */
  async notify(tenantId: string, lead: Lead, score?: LeadScore): Promise<{ delivered: LeadNotification[]; evaluated: number }> {
    const s = await this.state(tenantId);
    const total = score?.total ?? lead.score ?? 0;
    const rules = Object.values(s.rules);
    const matched = rules.filter((r) => {
      if (!r.enabled) return false;
      if (r.minScore != null && total < r.minScore) return false;
      if (r.statuses?.length && !r.statuses.includes(lead.status)) return false;
      // A page-scoped rule must NOT match a lead with no pageId (or one outside the list).
      if (r.pages?.length && (!lead.pageId || !r.pages.includes(lead.pageId))) return false;
      return true;
    });

    const delivered: LeadNotification[] = [];
    for (const r of matched) {
      s.seq += 1;
      const msg = `${lead.name || lead.email} (score ${total}) from ${lead.pageTitle ?? "a page"} — via "${r.name}".`;

      // Truthful delivery tracking: a channel only counts as delivered when it has a real
      // destination AND the send succeeds. "in_app" always delivers (it IS this log entry).
      // status is "sent" iff ≥1 channel delivered, else "suppressed" — never "sent" with no
      // destination (audit 2026-06-24).
      let deliveredAny = false;
      for (const channel of r.channels) {
        if (channel === "in_app") {
          deliveredAny = true;
        } else if (channel === "email") {
          // NOTIFY_EMAIL env var — the workspace owner's email (or comma-separated list).
          const recipients = (process.env.NOTIFY_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
          if (recipients.length) {
            const html = leadAlertHtml({
              leadName: lead.name || "Unknown",
              leadEmail: lead.email,
              leadCompany: lead.company ?? "",
              pageTitle: lead.pageTitle ?? "a page",
              score: total,
              status: lead.status,
              ruleName: r.name,
            });
            const ok = await sendEmail({ to: recipients, subject: `New lead: ${lead.name || lead.email} (score ${total})`, html });
            if (ok) deliveredAny = true;
            else this.log.warn(`Email delivery failed for lead ${lead.id}, rule ${r.id}`);
          }
        } else if (channel === "slack") {
          // NOTIFY_SLACK_WEBHOOK env var — Incoming Webhook URL (operator-configured).
          const webhook = process.env.NOTIFY_SLACK_WEBHOOK;
          if (webhook) {
            try {
              const { fetchWithTimeout } = await import("../common/http");
              const res = await fetchWithTimeout(webhook, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  text: `*New lead (score ${total})*\n${lead.name || lead.email}${lead.company ? ` · ${lead.company}` : ""}\nPage: ${lead.pageTitle ?? "unknown"} · Rule: _${r.name}_`,
                }),
              }, 8_000);
              if (res.ok) deliveredAny = true;
            } catch {
              /* delivery failed → not counted */
            }
          }
        } else if (channel === "webhook") {
          // POST to the rule's TENANT-SUPPLIED URL. SSRF defense: validate the URL
          // (blocks localhost/private/link-local/cloud-metadata) AND do NOT follow redirects,
          // so a safe public URL can't 30x-redirect us into an internal address.
          const url = r.webhookUrl;
          if (url) {
            try {
              const { assertSafeUrl } = await import("../common/ssrf");
              const safeUrl = await assertSafeUrl(url);
              const { fetchWithTimeout } = await import("../common/http");
              const res = await fetchWithTimeout(safeUrl, {
                method: "POST",
                redirect: "manual", // a 30x → opaqueredirect (res.ok false) → not followed, not delivered
                headers: { "content-type": "application/json", "x-geoseo-event": "lead.alert" },
                body: JSON.stringify({
                  event: "lead.alert",
                  leadId: lead.id,
                  leadName: lead.name,
                  leadEmail: lead.email,
                  leadCompany: lead.company,
                  pageTitle: lead.pageTitle,
                  score: total,
                  status: lead.status,
                  ruleName: r.name,
                  ruleId: r.id,
                  sentAt: nowIso(),
                }),
              }, 10_000);
              if (res.ok) deliveredAny = true;
            } catch {
              /* unsafe URL or request failed → not counted */
            }
          }
        }
      }
      const actualStatus: "sent" | "suppressed" = deliveredAny ? "sent" : "suppressed";

      const entry: LeadNotification = {
        id: `ln-${s.seq}`,
        leadId: lead.id,
        ruleId: r.id,
        channels: r.channels,
        message: msg,
        status: actualStatus,
        createdAt: nowIso(),
      };
      delivered.push(entry);
    }

    s.log = [...delivered, ...s.log].slice(0, 500);
    this.persist(tenantId, s);
    return { delivered, evaluated: rules.filter((r) => r.enabled).length };
  }
}
