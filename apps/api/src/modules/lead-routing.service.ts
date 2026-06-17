import { Injectable } from "@nestjs/common";
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

/** Per-tenant lead routing rules (P0-6) — `cx_lead_routing`. */
@Injectable()
export class LeadRoutingStore {
  private cache = new Map<string, RoutingState>();
  private db = new DocStore<RoutingState>("cx_lead_routing");

  private async state(tenantId: string): Promise<RoutingState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { rules: [], seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: RoutingState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async list(tenantId: string): Promise<LeadRoutingRule[]> {
    return (await this.state(tenantId)).rules;
  }

  async create(tenantId: string, draft: Omit<LeadRoutingRule, "id">): Promise<LeadRoutingRule> {
    const s = await this.state(tenantId);
    s.seq += 1;
    const rule: LeadRoutingRule = { ...draft, id: `rule-${s.seq}` };
    s.rules.push(rule);
    this.persist(tenantId, s);
    return rule;
  }

  async update(tenantId: string, id: string, patch: Partial<Omit<LeadRoutingRule, "id">>): Promise<LeadRoutingRule | undefined> {
    const s = await this.state(tenantId);
    const rule = s.rules.find((r) => r.id === id);
    if (!rule) return undefined;
    Object.assign(rule, patch);
    this.persist(tenantId, s);
    return rule;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const s = await this.state(tenantId);
    s.rules = s.rules.filter((r) => r.id !== id);
    this.persist(tenantId, s);
  }

  /** First enabled matching rule → ownerId, or null when nothing matches. */
  async routeOwner(tenantId: string, lead: Lead): Promise<string | null> {
    for (const rule of (await this.state(tenantId)).rules) {
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
