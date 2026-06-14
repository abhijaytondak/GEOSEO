import { Injectable } from "@nestjs/common";
import { DocStore } from "../db/db";

export type AuditStatus = "pass" | "warn" | "fail";

export interface AuditFinding {
  id: string;
  label: string;
  status: AuditStatus;
  detail: string;
  recommendation: string;
}

export interface ConversionAudit {
  url: string;
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D";
  findings: AuditFinding[];
  crawled: boolean;
  auditedAt: string;
  error?: string;
}

type AuditState = { last: ConversionAudit | null };

/** Block SSRF targets: only http/https, no localhost / private / link-local / metadata IPs. */
function isSafeUrl(raw: string): { ok: boolean; reason?: string } {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, reason: "Only http/https allowed" };
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "169.254.169.254"
  ) {
    return { ok: false, reason: "Private / local hosts are not allowed" };
  }
  return { ok: true };
}

function gradeFor(score: number): ConversionAudit["grade"] {
  return score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
}

/**
 * Per-tenant store (reference implementation of the multi-tenant pattern — see
 * docs/MULTI-TENANCY.md). State is lazily hydrated per `tenantId` into an in-memory
 * cache, backed by `DocStore.loadForTenant/saveForTenant`. Controllers pass
 * `req.tenantId` (set by TenantGuard); `ws-default` maps to the legacy "state" row.
 */
@Injectable()
export class ConversionAuditStore {
  private cache = new Map<string, AuditState>();
  private db = new DocStore<AuditState>("cx_conversion_audit");

  /** Lazily hydrate a tenant's state from the DB into the cache. */
  private async state(tenantId: string): Promise<AuditState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { last: null };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  private commit(tenantId: string, audit: ConversionAudit): ConversionAudit {
    const next: AuditState = { last: audit };
    this.cache.set(tenantId, next);
    this.db.saveForTenant(tenantId, next);
    return audit;
  }

  async latest(tenantId: string): Promise<ConversionAudit | null> {
    return (await this.state(tenantId)).last;
  }

  async run(tenantId: string, rawUrl: string, now: string): Promise<ConversionAudit> {
    const safe = isSafeUrl(rawUrl);
    const url = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    if (!safe.ok) {
      return this.commit(tenantId, { url, score: 0, grade: "D", findings: [], crawled: false, auditedAt: now, error: safe.reason });
    }

    let html = "";
    let crawled = false;
    let error: string | undefined;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: "follow",
        headers: { "user-agent": "GEOSEO-bot/1.0 (+conversion-audit)" },
      });
      clearTimeout(timer);
      if (res.ok) {
        html = (await res.text()).slice(0, 800_000);
        crawled = true;
      } else {
        error = `Site returned HTTP ${res.status}`;
      }
    } catch {
      error = "Couldn't reach the site (timeout or network error).";
    }

    const findings = crawled ? evaluate(html) : [];
    const score = findings.length
      ? Math.round((findings.reduce((a, f) => a + (f.status === "pass" ? 1 : f.status === "warn" ? 0.5 : 0), 0) / findings.length) * 100)
      : 0;
    return this.commit(tenantId, { url, score, grade: gradeFor(score), findings, crawled, auditedAt: now, error });
  }
}

/** Heuristic conversion checks against the homepage HTML. */
function evaluate(html: string): AuditFinding[] {
  const has = (re: RegExp) => re.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const hasForm = has(/<form/i);
  const hasEmailField = has(/type=["']email["']|name=["']email["']/i);

  const f: AuditFinding[] = [];
  f.push({
    id: "lead-capture",
    label: "Lead capture form",
    status: hasForm && hasEmailField ? "pass" : hasForm ? "warn" : "fail",
    detail: hasForm && hasEmailField ? "An email capture form is present." : hasForm ? "A form exists but no email field detected." : "No lead capture form found on the page.",
    recommendation: "Add a visible email capture / demo-request form above the fold.",
  });
  f.push({
    id: "primary-cta",
    label: "Primary call-to-action",
    status: has(/get started|sign ?up|book a demo|request a demo|start (free|now)|try (it )?free|contact (us|sales)|get a quote|buy now/i) ? "pass" : "fail",
    detail: "Looks for high-intent CTA copy in buttons/links.",
    recommendation: "Add a clear, action-oriented primary CTA (e.g. “Start free”, “Book a demo”).",
  });
  f.push({
    id: "single-h1",
    label: "Single clear H1",
    status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
    detail: `${h1Count} H1 heading(s) found.`,
    recommendation: h1Count === 1 ? "Looks good." : "Use exactly one H1 that states the core value proposition.",
  });
  f.push({
    id: "meta-description",
    label: "Meta description",
    status: has(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i) ? "pass" : "warn",
    detail: "A descriptive meta description improves search CTR.",
    recommendation: "Write a 120–160 char meta description with the value prop + a CTA.",
  });
  f.push({
    id: "title-quality",
    label: "Page title",
    status: title.length >= 10 && title.length <= 65 ? "pass" : title ? "warn" : "fail",
    detail: title ? `Title is ${title.length} chars.` : "No <title> found.",
    recommendation: "Keep the title 10–65 chars, lead with the benefit + brand.",
  });
  f.push({
    id: "social-proof",
    label: "Social proof",
    status: has(/testimonial|trusted by|customers love|case stud|rated|reviews?|\bG2\b|logos?/i) ? "pass" : "warn",
    detail: "Logos, testimonials, or ratings build trust.",
    recommendation: "Add customer logos, a testimonial, or a metric (“used by 2,000 teams”).",
  });
  f.push({
    id: "mobile-viewport",
    label: "Mobile-ready",
    status: has(/<meta[^>]+name=["']viewport["']/i) ? "pass" : "fail",
    detail: "A responsive viewport tag is required for mobile conversion.",
    recommendation: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
  });
  return f;
}
