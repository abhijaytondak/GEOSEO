/**
 * Outbound HTTP with a hard timeout — the single source of truth for every provider
 * seam's network call. Without this, a hung upstream (e.g. a stalled OAuth token
 * endpoint) blocks the request indefinitely.
 *
 * Behaviour: aborts the request after `ms` and always clears the timer (even on
 * throw). On timeout the underlying `fetch` rejects with an `AbortError` — callers
 * keep their existing `try/catch → null/[]` safe-fallback contract, so a timeout
 * degrades exactly like any other provider failure and never throws to the request.
 *
 * Default 12s matches the seams' historical inline timeout.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 12_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
