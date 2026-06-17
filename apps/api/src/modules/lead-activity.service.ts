import { Injectable } from "@nestjs/common";
import type { LeadActivity, LeadActivityType } from "@geoseo/types";
import { DocStore } from "../db/db";

type ActivityState = { byLead: Record<string, LeadActivity[]>; seq: number };

/**
 * Per-tenant lead notes & activity timeline (Leads PRD Gap 3 / §11; P0-6) —
 * `cx_lead_activity`, keyed by leadId. Additive: does not touch the Lead record.
 */
@Injectable()
export class LeadActivityStore {
  private cache = new Map<string, ActivityState>();
  private db = new DocStore<ActivityState>("cx_lead_activity");

  private async state(tenantId: string): Promise<ActivityState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { byLead: {}, seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  async list(tenantId: string, leadId: string): Promise<LeadActivity[]> {
    return [...((await this.state(tenantId)).byLead[leadId] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async add(tenantId: string, leadId: string, type: LeadActivityType, body: string, actorId = "you", metadata?: Record<string, unknown>): Promise<LeadActivity> {
    const s = await this.state(tenantId);
    s.seq += 1;
    const entry: LeadActivity = {
      id: `la-${s.seq}`,
      leadId,
      type,
      body,
      actorId,
      metadata,
      createdAt: new Date().toISOString(),
    };
    s.byLead[leadId] = [entry, ...(s.byLead[leadId] ?? [])].slice(0, 200);
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
    return entry;
  }
}
