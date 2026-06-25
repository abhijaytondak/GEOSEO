/**
 * Canonical output-escaping helpers for generated/persisted HTML and JSON-LD.
 *
 * Generated pages interpolate user-editable fields (titles, meta, FAQ Q&A, slugs)
 * into HTML and into `<script type="application/ld+json">` blocks. Use these so that
 * data can never break out of its context (stored-XSS defense, audit 2026-06-24).
 */

/**
 * Escape for HTML text AND double/single-quoted attribute contexts: & < > " '.
 * Safe to use for element text and for `attr="${escapeHtml(v)}"`.
 */
export function escapeHtml(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize an ALREADY-serialized JSON(-LD) string for embedding inside a
 * `<script type="application/ld+json">…</script>` element. Escapes the characters
 * that could close the script element or be misparsed (`<`, `>`, `&`). The result is
 * still valid JSON (these only ever appear inside string values in JSON-LD), so a
 * `</script>` in a title can't break out and inject markup.
 */
export function jsonLdSafe(json: string): string {
  return String(json)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Serialize a value to a script-safe JSON-LD string (JSON.stringify + jsonLdSafe). */
export function jsonLdScript(data: unknown): string {
  return jsonLdSafe(JSON.stringify(data));
}
