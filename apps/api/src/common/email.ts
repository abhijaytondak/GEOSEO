import { Logger } from "@nestjs/common";
import { fetchWithTimeout } from "./http";

const log = new Logger("email");

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend (https://resend.com).
 * No-ops gracefully when RESEND_API_KEY is absent — never throws.
 *
 * Set env vars:
 *   RESEND_API_KEY   — your Resend API key (re_...)
 *   EMAIL_FROM       — sender address (default: "noreply@geoseo.app")
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const from = payload.from ?? process.env.EMAIL_FROM ?? "GEOSEO <noreply@geoseo.app>";
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];

  try {
    const res = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ from, to, subject: payload.subject, html: payload.html, reply_to: payload.replyTo }),
      },
      10_000,
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.warn(`Resend ${res.status}: ${text.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    log.warn(`sendEmail failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/** HTML template for a new lead alert email. */
export function leadAlertHtml(opts: {
  leadName: string;
  leadEmail: string;
  leadCompany: string;
  pageTitle: string;
  score: number;
  status: string;
  ruleName: string;
  dashboardUrl?: string;
}): string {
  const dash = opts.dashboardUrl ?? "https://app.geoseo.app/leads";
  const scoreColor = opts.score >= 75 ? "#16a34a" : opts.score >= 50 ? "#d97706" : "#6b7280";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
      <tr><td style="background:#0f172a;padding:20px 28px">
        <p style="margin:0;color:#fff;font-size:16px;font-weight:700">GEOSEO</p>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:12px">New lead alert — ${opts.ruleName}</p>
      </td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a">${escHtml(opts.leadName)}</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280">${escHtml(opts.leadEmail)}${opts.leadCompany ? ` · ${escHtml(opts.leadCompany)}` : ""}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px">
          <tr>
            <td style="padding:12px 16px;border-right:1px solid #e2e8f0">
              <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Source page</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a">${escHtml(opts.pageTitle)}</p>
            </td>
            <td style="padding:12px 16px;border-right:1px solid #e2e8f0">
              <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Score</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:${scoreColor}">${opts.score}</p>
            </td>
            <td style="padding:12px 16px">
              <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Status</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;text-transform:capitalize">${opts.status}</p>
            </td>
          </tr>
        </table>
        <a href="${dash}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px">
          View lead in GEOSEO →
        </a>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;background:#f8fafc">
        <p style="margin:0;font-size:12px;color:#94a3b8">Sent by GEOSEO · Triggered by rule "${escHtml(opts.ruleName)}" · <a href="${dash}/settings/notifications" style="color:#64748b">Manage alerts</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
