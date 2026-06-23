import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a user-entered website to a scannable origin URL.
 * Accepts bare domains, `www`, full URLs, and pasted deep paths; trims whitespace,
 * lowercases the host, prepends `https://` when no scheme is present, and reduces to
 * scheme+host (Brand Memory is a site-level scan). Returns "" if it can't be parsed.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return ""
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withScheme)
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.port ? `:${u.port}` : ""}`
  } catch {
    return ""
  }
}

export type WebsiteValidation =
  | { ok: true; url: string; domain: string }
  | { ok: false; reason: "empty" | "invalid_format" | "local_or_private" }

/**
 * Client-side UX validation for a website URL — fast feedback only. The server
 * (`assertSafeUrl`) remains the SSRF/DNS security boundary; this just rejects
 * obviously-unusable input and returns the normalized origin + bare domain on success.
 * The `reason` doubles as a non-sensitive analytics code.
 */
export function validateWebsite(raw: string): WebsiteValidation {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return { ok: false, reason: "empty" }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let u: URL
  try {
    u = new URL(withScheme)
  } catch {
    return { ok: false, reason: "invalid_format" }
  }
  if (!/^https?:$/.test(u.protocol)) return { ok: false, reason: "invalid_format" }
  const h = u.hostname.toLowerCase()
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.startsWith("[") || // IPv6 literal
    /^\d{1,3}(\.\d{1,3}){3}$/.test(h) // bare IPv4 — not a public site for onboarding
  ) {
    return { ok: false, reason: "local_or_private" }
  }
  if (!h.includes(".")) return { ok: false, reason: "invalid_format" }
  return { ok: true, url: `${u.protocol}//${h}${u.port ? `:${u.port}` : ""}`, domain: h }
}
