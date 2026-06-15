/**
 * Anonymous visitor / session ids for public-page journey tracking. The visitor id
 * persists across sessions (localStorage); the session id is per-tab (sessionStorage).
 * Both feed the lead-journey timeline so it reflects real visits, not an empty stub.
 * Client-only — guarded so SSR / blocked-storage never throws.
 */
function ensure(key: string, store: Storage): string {
  let v = store.getItem(key);
  if (!v) {
    v =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    store.setItem(key, v);
  }
  return v;
}

export function getVisitorId(): string {
  try {
    return ensure("geoseo_vid", window.localStorage);
  } catch {
    return "anon";
  }
}

export function getSessionId(): string {
  try {
    return ensure("geoseo_sid", window.sessionStorage);
  } catch {
    return "anon";
  }
}
