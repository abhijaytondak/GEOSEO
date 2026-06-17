import { Injectable, Logger } from "@nestjs/common";
import type { Lead } from "@geoseo/types";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";

/** Record of a lead synced to an external CRM (additive side-store cx_crm_sync). */
export interface CrmSyncResult {
  leadId: string;
  provider: "hubspot" | "none";
  status: "synced" | "skipped" | "failed";
  externalId?: string;
  externalUrl?: string;
  error?: string;
  syncedAt: string;
}

type CrmState = { byLead: Record<string, CrmSyncResult> };

/**
 * CRM sync seam (Leads PRD §9 CRM Sync). **Wired, key-gated:** when a HubSpot
 * private-app token (`HUBSPOT_ACCESS_TOKEN`) is set, `sync()` upserts the lead as
 * a HubSpot contact (idempotent by email) and records the external id/url;
 * otherwise it returns a `skipped` result and the lead stays local. Never throws —
 * provider failures degrade to a `failed` result the UI can retry.
 */
@Injectable()
export class CrmSyncStore {
  private readonly log = new Logger(CrmSyncStore.name);
  private cache = new Map<string, CrmState>();
  private db = new DocStore<CrmState>("cx_crm_sync");

  private async state(tenantId: string): Promise<CrmState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { byLead: {} };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  /** Active CRM provider — auto-detected from creds (extensible to Salesforce/Pipedrive). */
  get provider(): "hubspot" | "none" {
    return process.env.HUBSPOT_ACCESS_TOKEN ? "hubspot" : "none";
  }
  get configured(): boolean {
    return this.provider !== "none";
  }

  async get(tenantId: string, leadId: string): Promise<CrmSyncResult | null> {
    return (await this.state(tenantId)).byLead[leadId] ?? null;
  }
  async list(tenantId: string): Promise<CrmSyncResult[]> {
    return Object.values((await this.state(tenantId)).byLead);
  }

  private async record(tenantId: string, result: CrmSyncResult): Promise<CrmSyncResult> {
    const s = await this.state(tenantId);
    s.byLead[result.leadId] = result;
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
    return result;
  }

  /** Sync a lead to the active CRM. Returns a result (never throws). */
  async sync(tenantId: string, lead: Lead, now: string): Promise<CrmSyncResult> {
    if (this.provider !== "hubspot") {
      return this.record(tenantId, { leadId: lead.id, provider: "none", status: "skipped", syncedAt: now });
    }
    return this.syncHubspot(tenantId, lead, now);
  }

  private async syncHubspot(tenantId: string, lead: Lead, now: string): Promise<CrmSyncResult> {
    const token = process.env.HUBSPOT_ACCESS_TOKEN!;
    const base = (process.env.HUBSPOT_BASE_URL ?? "https://api.hubapi.com").replace(/\/+$/, "");
    const portalId = process.env.HUBSPOT_PORTAL_ID;
    const [firstname, ...rest] = (lead.name ?? "").trim().split(/\s+/);
    const properties: Record<string, string> = { email: lead.email };
    if (firstname) properties.firstname = firstname;
    if (rest.length) properties.lastname = rest.join(" ");
    if (lead.company) properties.company = lead.company;
    if (lead.message) properties.message = lead.message.slice(0, 5000);

    try {
      // Idempotent upsert by email — no duplicate contacts on re-sync.
      const res = await fetchWithTimeout(`${base}/crm/v3/objects/contacts/batch/upsert`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ inputs: [{ idProperty: "email", id: lead.email, properties }] }),
      });
      if (!res.ok) {
        const error = `HubSpot ${res.status}`;
        this.log.warn(`${error} — lead ${lead.id} kept local`);
        return this.record(tenantId, { leadId: lead.id, provider: "hubspot", status: "failed", error, syncedAt: now });
      }
      const json = (await res.json()) as { results?: { id?: string }[] };
      const externalId = json.results?.[0]?.id;
      return this.record(tenantId, {
        leadId: lead.id,
        provider: "hubspot",
        status: "synced",
        externalId,
        externalUrl: externalId && portalId ? `https://app.hubspot.com/contacts/${portalId}/contact/${externalId}` : undefined,
        syncedAt: now,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "unknown";
      this.log.warn(`HubSpot sync failed for lead ${lead.id} (${error})`);
      return this.record(tenantId, { leadId: lead.id, provider: "hubspot", status: "failed", error, syncedAt: now });
    }
  }
}
