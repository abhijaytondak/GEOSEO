import { Injectable, OnModuleInit } from "@nestjs/common";
import type { LeadAssignment } from "@geoseo/types";
import { DocStore } from "../db/db";

type AssignmentState = { byLead: Record<string, LeadAssignment> };

/**
 * Lead → owner assignment (Leads PRD §9 / Gap 4) — persisted to `cx_lead_assignment`,
 * keyed by leadId. Additive: ownership lives here, not on the core Lead record.
 */
@Injectable()
export class LeadAssignmentStore implements OnModuleInit {
  private byLead: Record<string, LeadAssignment> = {};
  private db = new DocStore<AssignmentState>("cx_lead_assignment");

  async onModuleInit() {
    await this.db.init({ byLead: this.byLead }, (loaded) => {
      this.byLead = loaded.byLead ?? {};
    });
  }

  assign(leadId: string, ownerId: string, assignedBy = "you"): LeadAssignment {
    const entry: LeadAssignment = { leadId, ownerId, assignedAt: new Date().toISOString(), assignedBy };
    this.byLead[leadId] = entry;
    this.db.save({ byLead: this.byLead });
    return entry;
  }

  bulkAssign(ids: string[], ownerId: string, assignedBy = "you"): LeadAssignment[] {
    const at = new Date().toISOString();
    const out: LeadAssignment[] = [];
    for (const leadId of ids) {
      const entry: LeadAssignment = { leadId, ownerId, assignedAt: at, assignedBy };
      this.byLead[leadId] = entry;
      out.push(entry);
    }
    this.db.save({ byLead: this.byLead });
    return out;
  }

  get(leadId: string): LeadAssignment | undefined {
    return this.byLead[leadId];
  }

  all(): LeadAssignment[] {
    return Object.values(this.byLead);
  }

  /** Count of leads owned per rep (PRD §9 "workload count by rep"). */
  workload(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const a of Object.values(this.byLead)) counts[a.ownerId] = (counts[a.ownerId] ?? 0) + 1;
    return counts;
  }
}
