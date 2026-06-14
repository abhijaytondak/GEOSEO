#!/usr/bin/env node
/**
 * Live API smoke test (PRD §15.2). Exercises the core workflows against a running
 * API and asserts the {success,data,errors} envelope + basic response shapes.
 *
 * Run:
 *   cd apps/api && set -a; . ./.env; set +a; PORT=4000 pnpm start   # in one shell
 *   node apps/api/scripts/smoke-live.mjs                            # in another
 *
 * Env: API_BASE (default http://localhost:4000/api/v1), DEV_API_TOKEN (bearer).
 * Exits non-zero if any check fails — suitable for CI.
 */

const BASE = process.env.API_BASE ?? "http://localhost:4000/api/v1";
const TOKEN = process.env.DEV_API_TOKEN ?? "";
const HEADERS = { accept: "application/json", "content-type": "application/json", ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) };

let pass = 0;
let fail = 0;
const failures = [];

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json };
}

/** Assert envelope success + run an optional shape predicate; return data. */
async function check(name, method, path, { body, expect } = {}) {
  try {
    const { status, json } = await req(method, path, body);
    if (!json || json.success !== true) {
      throw new Error(`status ${status}, success=${json && json.success}, errors=${JSON.stringify(json && json.errors)}`);
    }
    if (expect && !expect(json.data)) {
      throw new Error(`shape predicate failed; data=${JSON.stringify(json.data).slice(0, 160)}`);
    }
    pass += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    return json.data;
  } catch (err) {
    fail += 1;
    failures.push(`${name}: ${err.message}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name} — ${err.message}`);
    return null;
  }
}

/** Negative assertion: PASSES when the API rejects the request (4xx / success=false). */
async function checkRejects(name, method, path, body) {
  try {
    const { status, json } = await req(method, path, body);
    if (json && json.success === true) {
      throw new Error(`expected rejection but got success (status ${status})`);
    }
    pass += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name} (correctly rejected)`);
  } catch (err) {
    fail += 1;
    failures.push(`${name}: ${err.message}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name} — ${err.message}`);
  }
}

function group(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

async function main() {
  console.log(`GEOSEO live smoke → ${BASE}\n`);

  group("Health & mode");
  await check("GET /health (mode reported)", "GET", "/health", {
    expect: (d) => d.status === "ok" && typeof d.mode === "string",
  });

  group("Authority + Performance overview aggregates");
  await check("GET /overview/authority", "GET", "/overview/authority", {
    expect: (d) => typeof d.health?.score === "number" && typeof d.backlinkQuality?.score === "number" && d.momentum,
  });
  await check("GET /performance/overview?range=30d", "GET", "/performance/overview?range=30d", {
    expect: (d) => d.range === "30d" && typeof d.avgRank === "number" && Array.isArray(d.topMovers),
  });
  await check("GET /performance/domain-health", "GET", "/performance/domain-health", { expect: (d) => typeof d.score === "number" });
  await check("GET /performance/pages", "GET", "/performance/pages?limit=5", { expect: (d) => Array.isArray(d.pages) });

  group("Jobs lifecycle");
  const job = await check("POST /jobs (create)", "POST", "/jobs", {
    body: { type: "audit", description: "smoke-live audit" },
    expect: (d) => d.id && d.status,
  });
  await check("GET /jobs (list)", "GET", "/jobs", { expect: (d) => Array.isArray(d.jobs) });
  if (job?.id) {
    await check("GET /jobs/:id", "GET", `/jobs/${job.id}`, { expect: (d) => d.id === job.id });
    await check("POST /jobs/:id/cancel", "POST", `/jobs/${job.id}/cancel`, { expect: (d) => d.id === job.id });
    await check("POST /jobs/:id/retry", "POST", `/jobs/${job.id}/retry`, { expect: (d) => d.id === job.id });
  }

  group("Backlink opportunities + outreach");
  await check("GET /backlink/opportunities", "GET", "/backlink/opportunities?limit=5", { expect: (d) => Array.isArray(d.opportunities) });
  const discovered = await check("POST /backlink/opportunities/discover", "POST", "/backlink/opportunities/discover", {
    expect: (d) => d.opportunity?.id,
  });
  const pid = discovered?.opportunity?.id;
  if (pid) {
    await check("PATCH opportunity (edit metadata)", "PATCH", `/backlink/opportunities/${pid}`, {
      body: { status: "contacted", tags: ["smoke"], notes: "smoke-live" },
      expect: (d) => d.opportunity?.status === "contacted",
    });
    await check("GET /outreach/templates (discovered prospect)", "GET", `/outreach/templates?prospectId=${pid}`, {
      expect: (d) => Array.isArray(d.templates) && d.templates.length > 0,
    });
    await check("DELETE opportunity (archive)", "DELETE", `/backlink/opportunities/${pid}`, { expect: (d) => d.archived === true });
    await check("POST opportunity/:id/restore", "POST", `/backlink/opportunities/${pid}/restore`, {
      expect: (d) => d.opportunity?.archived === false,
    });
    await check("POST opportunities/bulk (archive)", "POST", "/backlink/opportunities/bulk", {
      body: { ids: [pid], action: "archive" },
      expect: (d) => Array.isArray(d.updated) && d.updated.includes(pid),
    });
    await checkRejects("POST opportunities/bulk validates action", "POST", "/backlink/opportunities/bulk", {
      ids: [pid],
      action: "nope",
    });
  }

  group("Alerts");
  const alerts = await check("GET /alerts", "GET", "/alerts", { expect: (d) => Array.isArray(d.alerts) });
  await check("GET /alerts/thresholds", "GET", "/alerts/thresholds", { expect: (d) => d.thresholds });
  await check("PUT /alerts/thresholds", "PUT", "/alerts/thresholds", { body: { rankDrop: 6 }, expect: (d) => d.thresholds?.rankDrop === 6 });
  if (alerts?.alerts?.[0]) {
    const aid = alerts.alerts[0].id;
    await check("PATCH /alerts/:id (mark read)", "PATCH", `/alerts/${aid}`, { body: { read: true }, expect: (d) => d.read === true });
    await check("POST /alerts/:id/snooze", "POST", `/alerts/${aid}/snooze`, { expect: (d) => typeof d.snoozedUntil === "string" });
    await checkRejects("POST /alerts/:id/snooze validates `until`", "POST", `/alerts/${aid}/snooze`, { until: "not-a-date" });
  }

  group("Content");
  await check("GET /content/internal-links", "GET", "/content/internal-links", { expect: (d) => Array.isArray(d.suggestions) });
  await check("POST /content/rescan", "POST", "/content/rescan", { expect: (d) => d.job });

  group("Brand memory");
  const brand = await check("GET /brand-profile", "GET", "/brand-profile", { expect: (d) => d.profile });
  await check("GET /brand-profile/versions", "GET", "/brand-profile/versions", { expect: (d) => Array.isArray(d.versions) });
  if (brand?.profile) {
    await check("PUT /brand-profile (new version)", "PUT", "/brand-profile", {
      body: { ...brand.profile, note: "smoke-live" },
      expect: (d) => d.version,
    });
  }

  group("Settings");
  const settings = await check("GET /settings", "GET", "/settings", { expect: (d) => d.settings?.profile });
  await check("PUT /settings (publishing persist)", "PUT", "/settings", {
    body: { publishing: { ...(settings?.settings?.publishing ?? {}), autoSitemap: true } },
    expect: (d) => d.settings?.publishing,
  });

  group("Page Engine + public");
  const pagesData = await check("GET /pages", "GET", "/pages", { expect: (d) => Array.isArray(d.pages) || Array.isArray(d) });
  await check("GET /opportunities (page engine)", "GET", "/opportunities", { expect: (d) => Array.isArray(d.opportunities) || Array.isArray(d) });
  await check("GET /public/pages (no auth)", "GET", "/public/pages", { expect: (d) => Array.isArray(d.pages) || Array.isArray(d) });
  const firstPage = (pagesData?.pages ?? pagesData)?.[0];
  if (firstPage?.id) {
    await check("POST /pages/:id/validate (quality gate)", "POST", `/pages/${firstPage.id}/validate`, {
      expect: (d) => Array.isArray(d.blockers) && typeof d.canPublish === "boolean",
    });
  }
  await checkRejects("POST /brand-profile/extract-from-site blocks SSRF", "POST", "/brand-profile/extract-from-site", { url: "http://localhost:4000" });

  group("Leads");
  const leadsData = await check("GET /leads", "GET", "/leads", { expect: (d) => Array.isArray(d.leads) || Array.isArray(d) });
  const firstLead = (leadsData?.leads ?? leadsData)?.[0];
  if (firstLead?.id) {
    await check("POST /leads/:id/activity (note)", "POST", `/leads/${firstLead.id}/activity`, {
      body: { type: "note", body: "smoke-live note" },
      expect: (d) => d.activity?.id && d.activity?.type === "note",
    });
    await check("GET /leads/:id/activity", "GET", `/leads/${firstLead.id}/activity`, {
      expect: (d) => Array.isArray(d.activity) && d.activity.some((a) => a.body === "smoke-live note"),
    });
    await checkRejects("POST /leads/:id/activity validates type", "POST", `/leads/${firstLead.id}/activity`, { type: "bogus", body: "x" });

    // visitor journey (Gap 1): record anonymous events → link to lead → summary
    const visitorId = `smoke-visitor-${firstLead.id}`;
    const sessionId = "smoke-session-1";
    await check("POST /public/events (page_view)", "POST", "/public/events", {
      body: { anonymousVisitorId: visitorId, sessionId, type: "page_view", url: "https://demo.test/pricing", title: "Pricing" },
      expect: (d) => d.event?.id,
    });
    await check("POST /public/events (form_submit)", "POST", "/public/events", {
      body: { anonymousVisitorId: visitorId, sessionId, type: "form_submit", url: "https://demo.test/contact", title: "Contact" },
      expect: (d) => d.event?.type === "form_submit",
    });
    await check("POST /leads/:id/link-visitor", "POST", `/leads/${firstLead.id}/link-visitor`, {
      body: { visitorId },
      expect: (d) => d.summary && typeof d.summary.touchpointCount === "number",
    });
    await check("GET /leads/:id/journey (summary)", "GET", `/leads/${firstLead.id}/journey`, {
      expect: (d) => Array.isArray(d.events) && d.events.length >= 2 && d.summary.touchpointCount >= 2 && !!d.summary.convertedAt,
    });
    await checkRejects("POST /public/events validates type", "POST", "/public/events", {
      anonymousVisitorId: "x",
      sessionId: "y",
      type: "bogus",
      url: "https://demo.test",
    });

    // owner assignment (Gap 4)
    await check("POST /leads/:id/assign", "POST", `/leads/${firstLead.id}/assign`, {
      body: { ownerId: "tm-2" },
      expect: (d) => d.assignment?.ownerId === "tm-2" && d.assignment?.leadId === firstLead.id,
    });
    await check("GET /leads/assign/workload", "GET", "/leads/assign/workload", {
      expect: (d) => d.workload && (d.workload["tm-2"] ?? 0) >= 1,
    });
    await check("POST /leads/bulk-assign", "POST", "/leads/bulk-assign", {
      body: { ids: [firstLead.id], ownerId: "tm-1" },
      expect: (d) => Array.isArray(d.assignments) && d.assignments[0]?.ownerId === "tm-1",
    });
    await checkRejects("POST /leads/:id/assign validates ownerId", "POST", `/leads/${firstLead.id}/assign`, {});

    // explainable scoring (Gap 7) — firstLead has a linked journey + form_submit
    await check("GET /leads/:id/score (computed + explained)", "GET", `/leads/${firstLead.id}/score`, {
      expect: (d) => typeof d.score?.total === "number" && Array.isArray(d.score?.reasons) && d.score.reasons.length > 0 && typeof d.score?.recommendedAction === "string",
    });
    await check("POST /leads/:id/recalculate-score", "POST", `/leads/${firstLead.id}/recalculate-score`, {
      expect: (d) => typeof d.score?.fit === "number" && typeof d.score?.intent === "number" && typeof d.score?.spamRisk === "number",
    });

    // CRM sync seam (HubSpot, env-gated) — unconfigured → skipped (no key in demo)
    await check("POST /leads/:id/crm-sync (seam)", "POST", `/leads/${firstLead.id}/crm-sync`, {
      expect: (d) => d.result && ["synced", "skipped", "failed"].includes(d.result.status) && typeof d.provider === "string",
    });
    await check("GET /leads/:id/crm-sync (status)", "GET", `/leads/${firstLead.id}/crm-sync`, {
      expect: (d) => typeof d.provider === "string",
    });

    // notification rules (Gap 5)
    const rule = await check("POST /lead-notification-rules", "POST", "/lead-notification-rules", {
      body: { name: "Smoke high-fit", channels: ["in_app", "slack"], minScore: 1 },
      expect: (d) => d.rule?.id && d.rule?.enabled === true,
    });
    await check("GET /lead-notification-rules", "GET", "/lead-notification-rules", { expect: (d) => Array.isArray(d.rules) && d.rules.length > 0 });
    await check("POST /leads/:id/notify (evaluates rules)", "POST", `/leads/${firstLead.id}/notify`, {
      expect: (d) => Array.isArray(d.delivered) && d.delivered.length >= 1 && typeof d.evaluated === "number",
    });
    await check("GET /leads/:id/notifications", "GET", `/leads/${firstLead.id}/notifications`, {
      expect: (d) => Array.isArray(d.notifications) && d.notifications.length >= 1,
    });
    if (rule?.rule?.id) {
      await check("PATCH /lead-notification-rules/:id", "PATCH", `/lead-notification-rules/${rule.rule.id}`, { body: { enabled: false }, expect: (d) => d.rule?.enabled === false });
      await check("DELETE /lead-notification-rules/:id", "DELETE", `/lead-notification-rules/${rule.rule.id}`, { expect: (d) => d.deleted === true });
    }
    await checkRejects("POST /lead-notification-rules validates name", "POST", "/lead-notification-rules", { channels: ["in_app"] });
  }

  group("Lead form config (Gap 11)");
  await check("GET /lead-forms (seeded default)", "GET", "/lead-forms", {
    expect: (d) => Array.isArray(d.forms) && d.forms.some((f) => f.id === "form-default"),
  });
  const form = await check("POST /lead-forms", "POST", "/lead-forms", {
    body: { name: "Smoke form", ctaText: "Talk to us" },
    expect: (d) => d.form?.id && d.form?.ctaText === "Talk to us" && Array.isArray(d.form?.fields),
  });
  if (form?.form?.id) {
    await check("PATCH /lead-forms/:id", "PATCH", `/lead-forms/${form.form.id}`, { body: { consentRequired: true }, expect: (d) => d.form?.consentRequired === true });
    await check("POST /lead-forms/:id/preview", "POST", `/lead-forms/${form.form.id}/preview`, { expect: (d) => d.form?.id === form.form.id });
    await check("DELETE /lead-forms/:id", "DELETE", `/lead-forms/${form.form.id}`, { expect: (d) => d.deleted === true });
  }
  await checkRejects("POST /lead-forms validates name", "POST", "/lead-forms", { ctaText: "x" });

  group("Search");
  await check("GET /search?q=segment", "GET", "/search?q=segment", { expect: (d) => Array.isArray(d.results) });

  group("AI Search engine");
  await check("GET /ai-search/overview", "GET", "/ai-search/overview", {
    expect: (d) => typeof d.activePages === "number" && Array.isArray(d.byEngine) && Array.isArray(d.byBot),
  });
  await check("POST /ai-search/mentions/check (heuristic)", "POST", "/ai-search/mentions/check", {
    body: { query: "best product analytics tools" },
    expect: (d) => Array.isArray(d.recorded) && typeof d.live === "boolean",
  });
  await check("GET /ai-search/mentions", "GET", "/ai-search/mentions", { expect: (d) => Array.isArray(d.mentions) });
  await check("POST /ai-search/bot-activity (record GPTBot hit)", "POST", "/ai-search/bot-activity", {
    body: { bot: "GPTBot", url: "https://demo.test/feeds/pricing" },
    expect: (d) => d.hit?.bot === "GPTBot",
  });
  await check("GET /ai-search/bot-activity", "GET", "/ai-search/bot-activity", {
    expect: (d) => Array.isArray(d.hits) && Array.isArray(d.byBot),
  });
  await checkRejects("POST /ai-search/mentions validates engine", "POST", "/ai-search/mentions", { engine: "bogus", query: "x" });
  await check("POST /public/ai-bot-hit records a crawler UA", "POST", "/public/ai-bot-hit", {
    body: { userAgent: "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)", slug: "pricing" },
    expect: (d) => d.recorded === true && d.bot === "GPTBot",
  });
  await check("POST /public/ai-bot-hit no-ops a human UA", "POST", "/public/ai-bot-hit", {
    body: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605", slug: "pricing" },
    expect: (d) => d.recorded === false,
  });

  group("Onboarding journey");
  await check("GET /onboarding/status", "GET", "/onboarding/status", {
    expect: (d) => d.onboarding && typeof d.onboarding.completed === "boolean" && d.onboarding.steps,
  });
  // Capture the real workspace profile so this destructive test can restore it.
  const savedProfile = (await req("GET", "/settings")).json?.data?.settings?.profile;
  await check("POST /onboarding/complete (persists workspace identity + onboarded)", "POST", "/onboarding/complete", {
    body: { workspaceName: "Smoke Co", domain: "smoke.test", websiteUrl: "https://smoke.test", requestedIntegrations: ["search-console"] },
    expect: (d) => d.onboarding?.completed === true && d.settings?.profile?.workspaceName === "Smoke Co" && d.settings?.profile?.domain === "smoke.test",
  });
  await check("GET /onboarding/status reflects completion", "GET", "/onboarding/status", {
    expect: (d) => d.onboarding?.completed === true && d.onboarding?.workspaceName === "Smoke Co",
  });
  await checkRejects("POST /onboarding/complete validates required fields", "POST", "/onboarding/complete", { domain: "x" });
  // Restore the original workspace identity so smoke isn't destructive.
  if (savedProfile) await req("PUT", "/settings", { profile: savedProfile });

  group("Solution readiness (Solution Parity PRD)");
  await check("GET /solutions/readiness", "GET", "/solutions/readiness", {
    expect: (d) =>
      Array.isArray(d.solutions) &&
      d.solutions.length === 3 &&
      d.solutions.find((s) => s.id === "paid-boost")?.status === "planned" &&
      d.solutions.find((s) => s.id === "lead-conversion")?.status === "partial" &&
      typeof d.solutions[0].completeness === "number",
  });

  group("Site theme scan (PRD §7 / §19 SSRF)");
  const theme = await check("POST /site-theme/scan (public URL)", "POST", "/site-theme/scan", {
    body: { url: "https://example.com" },
    expect: (d) => d.profile?.id && typeof d.profile?.confidence === "number",
  });
  await check("GET /site-theme", "GET", "/site-theme", { expect: (d) => Array.isArray(d.profiles) });
  if (theme?.profile?.id) {
    await check("POST /site-theme/:id/confirm", "POST", `/site-theme/${theme.profile.id}/confirm`, {
      expect: (d) => d.profile?.status === "confirmed",
    });
  }
  await checkRejects("POST /site-theme/scan blocks localhost (SSRF)", "POST", "/site-theme/scan", { url: "http://localhost:4000" });
  await checkRejects("POST /site-theme/scan blocks private IP (SSRF)", "POST", "/site-theme/scan", { url: "http://169.254.169.254/latest/meta-data" });

  group("Audit log (PRD §10)");
  await check("GET /audit/log (records core mutations)", "GET", "/audit/log?limit=50", {
    expect: (d) => Array.isArray(d.audit) && d.audit.some((e) => e.entity === "prospect"),
  });

  group("Input validation (PRD §7)");
  await checkRejects("POST /jobs rejects invalid type", "POST", "/jobs", { type: "bogus-type" });
  await checkRejects("PUT /alerts/thresholds rejects non-number", "PUT", "/alerts/thresholds", { rankDrop: "high" });
  await checkRejects("POST /backlink/opportunities/bulk rejects missing ids", "POST", "/backlink/opportunities/bulk", { action: "archive" });

  console.log(`\n\x1b[1mResult:\x1b[0m ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("smoke-live crashed:", err);
  process.exit(1);
});
