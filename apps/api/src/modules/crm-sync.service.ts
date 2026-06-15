import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
export class CrmSyncStore implements OnModuleInit {
  private readonly log = new Logger(CrmSyncStore.name);
  private byLead: Record<string, CrmSyncResult> = {};
  private db = new DocStore<CrmState>("cx_crm_sync");

  async onModuleInit() {
    await this.db.init({ byLead: this.byLead }, (loaded) => {
      this.byLead = loaded.byLead ?? {};
    });
  }

  /** Active CRM provider — auto-detected from creds (extensible to Salesforce/Pipedrive). */
  get provider(): "hubspot" | "none" {
    return process.env.HUBSPOT_ACCESS_TOKEN ? "hubspot" : "none";
  }
  get configured(): boolean {
    return this.provider !== "none";
  }

  get(leadId: string): CrmSyncResult | null {
    return this.byLead[leadId] ?? null;
  }
  list(): CrmSyncResult[] {
    return Object.values(this.byLead);
  }

  private record(result: CrmSyncResult): CrmSyncResult {
    this.byLead[result.leadId] = result;
    this.db.save({ byLead: this.byLead });
    return result;
  }

  /** Sync a lead to the active CRM. Returns a result (never throws). */
  async sync(lead: Lead, now: string): Promise<CrmSyncResult> {
    if (this.provider !== "hubspot") {
      return this.record({ leadId: lead.id, provider: "none", status: "skipped", syncedAt: now });
    }
    return this.syncHubspot(lead, now);
  }

  private async syncHubspot(lead: Lead, now: string): Promise<CrmSyncResult> {
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
        return this.record({ leadId: lead.id, provider: "hubspot", status: "failed", error, syncedAt: now });
      }
      const json = (await res.json()) as { results?: { id?: string }[] };
      const externalId = json.results?.[0]?.id;
      return this.record({
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
      return this.record({ leadId: lead.id, provider: "hubspot", status: "failed", error, syncedAt: now });
    }
  }
}
