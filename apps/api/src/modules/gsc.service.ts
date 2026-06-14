import { Injectable, Logger } from "@nestjs/common";
import { createSign } from "node:crypto";

/** A Search Analytics row from Google Search Console. */
export interface GscRow {
  key: string; // date (YYYY-MM-DD) or query/page depending on dimension
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "8w": 56, quarter: 90 };

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Google Search Console seam (real rankings/impressions/clicks for a verified,
 * customer-owned property). **Wired, key-gated:** set `GSC_SERVICE_ACCOUNT_JSON`
 * (a service-account key, added as a user on the GSC property) + `GSC_SITE_URL`.
 * Unconfigured → `configured:false` and callers keep the heuristic rank data.
 * Never throws — provider failures return null.
 */
@Injectable()
export class GscService {
  private readonly log = new Logger(GscService.name);
  private token: { value: string; exp: number } | null = null;

  get siteUrl(): string | undefined {
    return process.env.GSC_SITE_URL;
  }
  get configured(): boolean {
    return Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON && process.env.GSC_SITE_URL);
  }

  /** Mint (and cache) an access token from the service-account key via JWT bearer grant. */
  private async accessToken(): Promise<string | null> {
    if (this.token && this.token.exp - 60 > Date.now() / 1000) return this.token.value;
    try {
      const sa = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!) as { client_email: string; private_key: string };
      const key = sa.private_key.replace(/\\n/g, "\n");
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 3600;
      const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
      const claim = b64url(
        JSON.stringify({
          iss: sa.client_email,
          scope: "https://www.googleapis.com/auth/webmasters.readonly",
          aud: "https://oauth2.googleapis.com/token",
          iat,
          exp,
        }),
      );
      const signature = createSign("RSA-SHA256").update(`${header}.${claim}`).end().sign(key).toString("base64url");
      const assertion = `${header}.${claim}.${signature}`;
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      });
      if (!res.ok) {
        this.log.warn(`GSC token ${res.status} — falling back to heuristic data`);
        return null;
      }
      const json = (await res.json()) as { access_token?: string; expires_in?: number };
      if (!json.access_token) return null;
      this.token = { value: json.access_token, exp: iat + (json.expires_in ?? 3600) };
      return this.token.value;
    } catch (err) {
      this.log.warn(`GSC auth failed (${err instanceof Error ? err.message : "unknown"})`);
      return null;
    }
  }

  /** Query Search Analytics over a UI range. `dimension` defaults to date (time series). */
  async searchAnalytics(range = "30d", dimension: "date" | "query" | "page" = "date"): Promise<GscRow[] | null> {
    if (!this.configured) return null;
    const token = await this.accessToken();
    if (!token) return null;
    const days = RANGE_DAYS[range] ?? 30;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl!)}/searchAnalytics/query`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ startDate: daysAgo(days), endDate: daysAgo(1), dimensions: [dimension], rowLimit: 200 }),
        },
      );
      clearTimeout(timer);
      if (!res.ok) {
        this.log.warn(`GSC query ${res.status} — heuristic fallback`);
        return null;
      }
      const json = (await res.json()) as {
        rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
      };
      return (json.rows ?? []).map((r) => ({
        key: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
        position: Math.round((r.position ?? 0) * 10) / 10,
      }));
    } catch (err) {
      this.log.warn(`GSC query failed (${err instanceof Error ? err.message : "unknown"})`);
      return null;
    }
  }
}
