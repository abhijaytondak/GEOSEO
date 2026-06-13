import { Injectable, OnModuleInit } from "@nestjs/common";
import type { LeadActivity, LeadActivityType } from "@geoseo/types";
import { DocStore } from "../db/db";

type ActivityState = { byLead: Record<string, LeadActivity[]>; seq: number };

/**
 * Per-lead notes & activity timeline (Leads PRD Gap 3 / §11) — persisted to
 * `cx_lead_activity`, keyed by leadId. Additive: does not touch the existing
 * Lead record, so it composes with the page-engine LeadsController.
 */
@Injectable()
export class LeadActivityStore implements OnModuleInit {
  private byLead: Record<string, LeadActivity[]> = {};
  private seq = 0;
  private db = new DocStore<ActivityState>("cx_lead_activity");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.byLead = loaded.byLead ?? {};
      this.seq = loaded.seq ?? 0;
    });
  }

  private snapshot(): ActivityState {
    return { byLead: this.byLead, seq: this.seq };
  }

  list(leadId: string): LeadActivity[] {
    return [...(this.byLead[leadId] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  add(leadId: string, type: LeadActivityType, body: string, actorId = "you", metadata?: Record<string, unknown>): LeadActivity {
    this.seq += 1;
    const entry: LeadActivity = {
      id: `la-${this.seq}`,
      leadId,
      type,
      body,
      actorId,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.byLead[leadId] = [entry, ...(this.byLead[leadId] ?? [])].slice(0, 200);
    this.db.save(this.snapshot());
    return entry;
  }
}
