import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Lead } from "@geoseo/types";
import { DocStore } from "../db/db";

/** Lead routing rule (Lead Conversion Engine — routing). Defined locally to keep
 *  this net-new module decoupled from the shared `@geoseo/types` (which is under
 *  active concurrent edits). The first enabled rule that matches a lead wins. */
export interface LeadRoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  field: "score" | "company" | "spamStatus" | "pageTitle";
  operator: "gte" | "lte" | "eq" | "contains";
  value: string;
  ownerId: string;
}

type RoutingState = { rules: LeadRoutingRule[]; seq: number };

@Injectable()
export class LeadRoutingStore implements OnModuleInit {
  private rules: LeadRoutingRule[] = [];
  private seq = 0;
  private db = new DocStore<RoutingState>("cx_lead_routing");

  async onModuleInit() {
    await this.db.init({ rules: this.rules, seq: this.seq }, (loaded) => {
      this.rules = loaded.rules ?? [];
      this.seq = loaded.seq ?? 0;
    });
  }

  private persist() {
    this.db.save({ rules: this.rules, seq: this.seq });
  }

  list(): LeadRoutingRule[] {
    return this.rules;
  }

  create(draft: Omit<LeadRoutingRule, "id">): LeadRoutingRule {
    this.seq += 1;
    const rule: LeadRoutingRule = { ...draft, id: `rule-${this.seq}` };
    this.rules.push(rule);
    this.persist();
    return rule;
  }

  update(id: string, patch: Partial<Omit<LeadRoutingRule, "id">>): LeadRoutingRule | undefined {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) return undefined;
    Object.assign(rule, patch);
    this.persist();
    return rule;
  }

  remove(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.persist();
  }

  /** First enabled matching rule → ownerId, or null when nothing matches. */
  routeOwner(lead: Lead): string | null {
    for (const rule of this.rules) {
      if (rule.enabled && this.matches(rule, lead)) return rule.ownerId;
    }
    return null;
  }

  private matches(rule: LeadRoutingRule, lead: Lead): boolean {
    if (rule.field === "score") {
      const v = Number(rule.value);
      if (Number.isNaN(v)) return false;
      return rule.operator === "gte" ? lead.score >= v : rule.operator === "lte" ? lead.score <= v : lead.score === v;
    }
    const fieldValue = String(
      rule.field === "company" ? lead.company : rule.field === "spamStatus" ? lead.spamStatus : (lead.pageTitle ?? ""),
    ).toLowerCase();
    const target = rule.value.toLowerCase();
    return rule.operator === "contains" ? fieldValue.includes(target) : fieldValue === target;
  }
}
