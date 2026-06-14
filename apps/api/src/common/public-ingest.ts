/**
 * Shared guards for unauthenticated public ingestion (PRD §16 / launch P0.5):
 * disposable-email blocking + a referer/source-host allowlist. Used by lead
 * capture and the public event/bot endpoints. Demo mode stays permissive; the
 * allowlist only bites when a workspace has configured `allowedDomains`.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "getnada.com",
  "sharklasers.com",
  "throwawaymail.com",
  "maildrop.cc",
  "fakeinbox.com",
  "dispostable.com",
  "mailnesia.com",
  "spam4.me",
  "tempr.email",
  "discard.email",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

/** Bare hostname of a URL/host string, lowercased, `www.` stripped. Null if unparseable. */
export function hostOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

const normDomain = (d: string) =>
  d.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

/**
 * True if `sourceUrl`'s host is covered by `allowedDomains` (exact or sub-domain).
 * When no allowlist is configured the check is a no-op (returns true) — so demo /
 * unconfigured workspaces stay open; callers gate stricter rejection on mode.
 */
export function refererAllowed(sourceUrl: string | undefined, allowedDomains: string[] | undefined): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const host = hostOf(sourceUrl);
  if (!host) return false;
  return allowedDomains.some((d) => {
    const dd = normDomain(d);
    return dd.length > 0 && (host === dd || host.endsWith(`.${dd}`));
  });
}
