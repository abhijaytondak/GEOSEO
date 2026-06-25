/**
 * Integration-credential redaction (deep-audit 2026-06-24, acceptance test #5).
 *
 * `GET /settings` previously returned integration `credentials` verbatim — WordPress
 * application passwords, Webflow/Shopify access tokens — so any caller could read them.
 * Secrets must be write-only from the client: blanked on every read, and never clobbered
 * by a redacted round-trip on write.
 */

/** Credential keys whose VALUES are secret and must never be returned to a client. */
const SECRET_KEY = /(pass|password|token|secret|key|apikey|api_key|auth|credential)/i;

export function isSecretCredentialKey(key: string): boolean {
  return SECRET_KEY.test(key);
}

type WithCredentials = { credentials?: Record<string, string> };

/**
 * Return a shallow copy of the integrations with secret credential VALUES blanked to "".
 * Non-secret fields (siteUrl, username, domain, shop, host, siteId, collectionId, …) are
 * preserved so the UI can still show connection context; the `status` field signals that a
 * secret is configured without exposing it.
 */
export function redactIntegrations<T extends WithCredentials>(integrations: T[]): T[] {
  return integrations.map((i) => {
    if (!i.credentials) return i;
    const red: Record<string, string> = {};
    for (const [k, v] of Object.entries(i.credentials)) {
      red[k] = isSecretCredentialKey(k) ? "" : v;
    }
    return { ...i, credentials: red };
  });
}

/**
 * Merge incoming credential values over the stored ones, IGNORING empty/blank incoming
 * values. This makes the redacted read safe to round-trip: a client that PUTs back the
 * blanked secret fields won't wipe the real stored secret — only values the user actually
 * typed are written.
 */
export function mergeCredentials(
  existing: Record<string, string> | undefined,
  incoming: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!incoming) return existing;
  const out: Record<string, string> = { ...(existing ?? {}) };
  for (const [k, v] of Object.entries(incoming)) {
    if (v === "" || v == null) continue; // never clobber a stored secret with a blank
    out[k] = v;
  }
  return out;
}
