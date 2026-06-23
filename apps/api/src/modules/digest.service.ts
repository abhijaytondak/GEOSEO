import { Injectable, Logger, OnModuleInit, Inject } from "@nestjs/common";
import { DEFAULT_TENANT_ID } from "../common/tenant";
import { PageEngineStore } from "./page-engine.service";
import { sendEmail } from "../common/email";

/** Check once per hour whether it's time to send the monthly digest. */
const POLL_MS = 60 * 60_000;
/** Boot delay — let other services initialize first. */
const BOOT_DELAY_MS = 60_000;

/**
 * Monthly SEO performance digest.
 *
 * Fires on the 1st of each calendar month (UTC). Sends a summary email to
 * NOTIFY_EMAIL with published page count, lead volume, top converting pages,
 * and a link to the dashboard. When RESEND_API_KEY is absent it logs instead
 * of sending — safe to deploy without keys.
 */
@Injectable()
export class DigestService implements OnModuleInit {
  private readonly log = new Logger(DigestService.name);
  private lastSentMonth = -1; // -1 means "never sent this process lifetime"

  constructor(@Inject(PageEngineStore) private readonly pages: PageEngineStore) {}

  onModuleInit() {
    setTimeout(() => {
      this.maybeSend();
      setInterval(() => this.maybeSend(), POLL_MS);
    }, BOOT_DELAY_MS);
  }

  /** Can be called manually from tests or an admin endpoint. */
  async sendNow(): Promise<{ sent: boolean; to: string }> {
    return this.send();
  }

  private maybeSend() {
    const now = new Date();
    if (now.getUTCDate() === 1 && now.getUTCMonth() !== this.lastSentMonth) {
      this.lastSentMonth = now.getUTCMonth();
      void this.send();
    }
  }

  private async send(): Promise<{ sent: boolean; to: string }> {
    const to = process.env.NOTIFY_EMAIL ?? "";
    const key = process.env.RESEND_API_KEY ?? "";
    if (!to || !key) {
      this.log.log("[digest] NOTIFY_EMAIL or RESEND_API_KEY not set — digest skipped");
      return { sent: false, to };
    }

    try {
      const tenantId = DEFAULT_TENANT_ID;
      const allPages = this.pages.listPages(tenantId);
      const published = allPages.filter((p) => p.status === "published");
      const allLeads = this.pages.listLeads(tenantId);

      // Month window: first second of last month → now.
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
      const leadsThisMonth = allLeads.filter((l) => (l.createdAt ?? "") >= monthStart);
      const wonThisMonth = leadsThisMonth.filter((l) => l.status === "won");

      // Top converting pages (max 5).
      const pageLeadMap = new Map<string, { leads: number; won: number; title: string }>();
      for (const l of leadsThisMonth) {
        const pid = l.pageId ?? "";
        if (!pid) continue;
        const entry = pageLeadMap.get(pid) ?? { leads: 0, won: 0, title: l.pageTitle ?? pid };
        entry.leads++;
        if (l.status === "won") entry.won++;
        pageLeadMap.set(pid, entry);
      }
      const topPages = [...pageLeadMap.entries()]
        .sort((a, b) => b[1].leads - a[1].leads)
        .slice(0, 5)
        .map(([id, v]) => ({ id, ...v, conv: v.leads > 0 ? Math.round((v.won / v.leads) * 100) : 0 }));

      const convRate = leadsThisMonth.length > 0 ? Math.round((wonThisMonth.length / leadsThisMonth.length) * 100) : 0;
      const monthLabel = new Date(monthStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

      const html = this.buildHtml({ monthLabel, published: published.length, leadsThisMonth: leadsThisMonth.length, wonThisMonth: wonThisMonth.length, convRate, topPages });
      const ok = await sendEmail({ to, subject: `GEOSEO Monthly Digest — ${monthLabel}`, html });

      if (ok) this.log.log(`[digest] Monthly digest sent to ${to} (${monthLabel})`);
      else this.log.warn(`[digest] Failed to send monthly digest to ${to}`);

      return { sent: ok, to };
    } catch (err) {
      this.log.warn(`[digest] send error: ${err instanceof Error ? err.message : String(err)}`);
      return { sent: false, to };
    }
  }

  private buildHtml(d: {
    monthLabel: string;
    published: number;
    leadsThisMonth: number;
    wonThisMonth: number;
    convRate: number;
    topPages: { title: string; leads: number; won: number; conv: number }[];
  }): string {
    const dash = process.env.APP_URL ?? "https://app.geoseo.app";
    const topRows = d.topPages.length
      ? d.topPages.map((p) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${escHtml(p.title)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.leads}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.won}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${p.conv}%</td></tr>`).join("")
      : `<tr><td colspan="4" style="padding:16px 12px;text-align:center;color:#94a3b8">No leads tracked this month</td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">

      <!-- header -->
      <tr><td style="background:#0f172a;padding:24px 32px">
        <p style="margin:0;color:#fff;font-size:16px;font-weight:700">GEOSEO</p>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Monthly performance digest — ${escHtml(d.monthLabel)}</p>
      </td></tr>

      <!-- KPI row -->
      <tr><td style="padding:28px 32px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <tr>
            <td style="padding:16px;border-right:1px solid #e2e8f0;text-align:center">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Published pages</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#0f172a">${d.published}</p>
            </td>
            <td style="padding:16px;border-right:1px solid #e2e8f0;text-align:center">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Leads</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#0f172a">${d.leadsThisMonth}</p>
            </td>
            <td style="padding:16px;border-right:1px solid #e2e8f0;text-align:center">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Won</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#16a34a">${d.wonThisMonth}</p>
            </td>
            <td style="padding:16px;text-align:center">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Conv rate</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${d.convRate >= 20 ? "#16a34a" : d.convRate >= 10 ? "#d97706" : "#6b7280"}">${d.convRate}%</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- top pages table -->
      <tr><td style="padding:24px 32px 0">
        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a">Top converting pages this month</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0">Page</th>
              <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0">Leads</th>
              <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0">Won</th>
              <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0">Conv</th>
            </tr>
          </thead>
          <tbody>${topRows}</tbody>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:28px 32px">
        <a href="${dash}/analytics" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:8px">
          View full analytics →
        </a>
      </td></tr>

      <!-- footer -->
      <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc">
        <p style="margin:0;font-size:12px;color:#94a3b8">GEOSEO monthly digest · <a href="${dash}/settings/notifications" style="color:#64748b">Manage emails</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
