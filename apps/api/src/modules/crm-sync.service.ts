import { Injectable, Logger } from "@nestjs/common";
import type { Lead } from "@geoseo/types";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";

/** Record of a lead synced to an external CRM (additive side-store cx_crm_sync). */
export interface CrmSyncResult {
  leadId: string;
  provider: "hubspot" | "salesforce" | "pipedrive" | "none";
  status: "synced" | "skipped" | "failed" | "duplicate";
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

  /** Active CRM provider — auto-detected from creds. First configured wins. */
  get provider(): "hubspot" | "salesforce" | "pipedrive" | "none" {
    if (process.env.HUBSPOT_ACCESS_TOKEN) return "hubspot";
    if (process.env.SALESFORCE_INSTANCE_URL && process.env.SALESFORCE_ACCESS_TOKEN) return "salesforce";
    if (process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_DOMAIN) return "pipedrive";
    return "none";
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
    switch (this.provider) {
      case "hubspot":
        return this.syncHubspot(tenantId, lead, now);
      case "salesforce":
        return this.syncSalesforce(tenantId, lead, now);
      case "pipedrive":
        return this.syncPipedrive(tenantId, lead, now);
      default:
        return this.record(tenantId, { leadId: lead.id, provider: "none", status: "skipped", syncedAt: now });
    }
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

  private async syncSalesforce(tenantId: string, lead: Lead, now: string): Promise<CrmSyncResult> {
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    const token = process.env.SALESFORCE_ACCESS_TOKEN;
    if (!instanceUrl || !token) {
      return this.record(tenantId, { leadId: lead.id, provider: "salesforce", status: "skipped", syncedAt: now });
    }

    const [firstName, ...restParts] = (lead.name ?? "").trim().split(/\s+/);
    const lastName = restParts.join(" ") || firstName || "Unknown";
    const rating = lead.score >= 80 ? "Hot" : lead.score >= 50 ? "Warm" : "Cold";

    const body: Record<string, string> = {
      Email: lead.email,
      FirstName: firstName || "",
      LastName: lastName,
      LeadSource: "GEOSEO",
      Description: lead.pageTitle ?? "",
      Rating: rating,
    };
    if (lead.company) body.Company = lead.company;

    try {
      const res = await fetchWithTimeout(
        `${instanceUrl.replace(/\/+$/, "")}/services/data/v58.0/sobjects/Lead`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (res.status === 400) {
        // Likely a duplicate email — surface as duplicate, not a hard failure.
        this.log.warn(`Salesforce 400 for lead ${lead.id} — likely duplicate`);
        return this.record(tenantId, { leadId: lead.id, provider: "salesforce", status: "duplicate", syncedAt: now });
      }
      if (!res.ok) {
        const error = `Salesforce ${res.status}`;
        this.log.warn(`${error} — lead ${lead.id} kept local`);
        return this.record(tenantId, { leadId: lead.id, provider: "salesforce", status: "failed", error, syncedAt: now });
      }
      const json = (await res.json()) as { id?: string };
      return this.record(tenantId, {
        leadId: lead.id,
        provider: "salesforce",
        status: "synced",
        externalId: json.id,
        syncedAt: now,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "unknown";
      this.log.warn(`Salesforce sync failed for lead ${lead.id} (${error})`);
      return this.record(tenantId, { leadId: lead.id, provider: "salesforce", status: "failed", error, syncedAt: now });
    }
  }

  private async syncPipedrive(tenantId: string, lead: Lead, now: string): Promise<CrmSyncResult> {
    const apiToken = process.env.PIPEDRIVE_API_TOKEN;
    const domain = process.env.PIPEDRIVE_DOMAIN;
    if (!apiToken || !domain) {
      return this.record(tenantId, { leadId: lead.id, provider: "pipedrive", status: "skipped", syncedAt: now });
    }

    const base = `https://${domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/api/v1`;

    try {
      // Step 1: create person.
      const personRes = await fetchWithTimeout(`${base}/persons?api_token=${encodeURIComponent(apiToken)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: [{ value: lead.email, primary: true }],
        }),
      });
      if (!personRes.ok) {
        const error = `Pipedrive persons ${personRes.status}`;
        this.log.warn(`${error} — lead ${lead.id} kept local`);
        return this.record(tenantId, { leadId: lead.id, provider: "pipedrive", status: "failed", error, syncedAt: now });
      }
      const personJson = (await personRes.json()) as { data?: { id?: number } };
      const personId = personJson.data?.id;
      if (!personId) {
        return this.record(tenantId, { leadId: lead.id, provider: "pipedrive", status: "failed", error: "No person id returned", syncedAt: now });
      }

      // Step 2: create deal linked to the person.
      const dealRes = await fetchWithTimeout(`${base}/deals?api_token=${encodeURIComponent(apiToken)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${lead.name} via ${lead.pageTitle}`,
          person_id: personId,
        }),
      });
      if (!dealRes.ok) {
        const error = `Pipedrive deals ${dealRes.status}`;
        this.log.warn(`${error} — lead ${lead.id} kept local`);
        return this.record(tenantId, { leadId: lead.id, provider: "pipedrive", status: "failed", error, syncedAt: now });
      }
      const dealJson = (await dealRes.json()) as { data?: { id?: number } };
      const dealId = dealJson.data?.id;
      return this.record(tenantId, {
        leadId: lead.id,
        provider: "pipedrive",
        status: "synced",
        externalId: dealId !== undefined ? String(dealId) : undefined,
        syncedAt: now,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "unknown";
      this.log.warn(`Pipedrive sync failed for lead ${lead.id} (${error})`);
      return this.record(tenantId, { leadId: lead.id, provider: "pipedrive", status: "failed", error, syncedAt: now });
    }
  }
}
