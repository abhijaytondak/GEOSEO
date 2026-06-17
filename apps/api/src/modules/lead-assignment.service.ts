import { Injectable } from "@nestjs/common";
import type { LeadAssignment } from "@geoseo/types";
import { DocStore } from "../db/db";

type AssignmentState = { byLead: Record<string, LeadAssignment> };

/**
 * Per-tenant lead → owner assignment (Leads PRD §9 / Gap 4; P0-6) — `cx_lead_assignment`,
 * keyed by leadId. Additive: ownership lives here, not on the core Lead record.
 */
@Injectable()
export class LeadAssignmentStore {
  private cache = new Map<string, AssignmentState>();
  private db = new DocStore<AssignmentState>("cx_lead_assignment");

  private async state(tenantId: string): Promise<AssignmentState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { byLead: {} };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: AssignmentState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async assign(tenantId: string, leadId: string, ownerId: string, assignedBy = "you"): Promise<LeadAssignment> {
    const s = await this.state(tenantId);
    const entry: LeadAssignment = { leadId, ownerId, assignedAt: new Date().toISOString(), assignedBy };
    s.byLead[leadId] = entry;
    this.persist(tenantId, s);
    return entry;
  }

  async bulkAssign(tenantId: string, ids: string[], ownerId: string, assignedBy = "you"): Promise<LeadAssignment[]> {
    const s = await this.state(tenantId);
    const at = new Date().toISOString();
    const out: LeadAssignment[] = [];
    for (const leadId of ids) {
      const entry: LeadAssignment = { leadId, ownerId, assignedAt: at, assignedBy };
      s.byLead[leadId] = entry;
      out.push(entry);
    }
    this.persist(tenantId, s);
    return out;
  }

  async get(tenantId: string, leadId: string): Promise<LeadAssignment | undefined> {
    return (await this.state(tenantId)).byLead[leadId];
  }

  async all(tenantId: string): Promise<LeadAssignment[]> {
    return Object.values((await this.state(tenantId)).byLead);
  }

  /** Count of leads owned per rep (PRD §9 "workload count by rep"). */
  async workload(tenantId: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const a of Object.values((await this.state(tenantId)).byLead)) counts[a.ownerId] = (counts[a.ownerId] ?? 0) + 1;
    return counts;
  }
}
