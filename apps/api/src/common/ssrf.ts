import { BadRequestException } from "@nestjs/common";
import { lookup } from "node:dns/promises";

/**
 * SSRF protection for user-supplied URLs (theme/site scans — PRD §19).
 * Allows only http(s) to public hosts; blocks localhost, private/link-local/CGNAT
 * ranges, and cloud metadata IPs — checked on both the literal host and its
 * resolved address (defends DNS-based bypass).
 */

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^\[|\]$/g, "");
  return v === "::1" || v === "::" || v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.");
}

function isBlockedHostLiteral(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return isPrivateIPv4(h);
  if (h.includes(":")) return isPrivateIPv6(h);
  return false;
}

/**
 * Validate + normalize a scan target. Throws BadRequestException if unsafe.
 * Returns the normalized https(s) URL string.
 */
export async function assertSafeUrl(raw: string): Promise<string> {
  if (typeof raw !== "string" || !raw.trim()) throw new BadRequestException("A URL is required");
  const normalized = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new BadRequestException("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BadRequestException("Only http(s) URLs are allowed");
  }
  if (isBlockedHostLiteral(url.hostname)) {
    throw new BadRequestException("That host is not allowed");
  }

  // Resolve and re-check the actual address (blocks DNS-based SSRF bypass).
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) && !url.hostname.includes(":")) {
    try {
      const records = await lookup(url.hostname, { all: true });
      for (const r of records) {
        if (r.family === 4 ? isPrivateIPv4(r.address) : isPrivateIPv6(r.address)) {
          throw new BadRequestException("That host resolves to a private address");
        }
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("Could not resolve host");
    }
  }
  return url.toString();
}

/**
 * Fetch a URL with SSRF guard + size/time limits. Returns the response text.
 *
 * Redirects are followed manually so EVERY hop is re-validated by `assertSafeUrl`
 * (auto-follow would skip the SSRF check on intermediate hosts). This is what lets
 * the common real-world canonicalizations work — apex→www and http→https — which a
 * hard `redirect:"manual"` stop used to turn into an empty body (`crawled:false`),
 * breaking onboarding for most Webflow/Framer custom domains. A redirect to an
 * unsafe/unresolvable host stops gracefully with empty html rather than throwing.
 */
export async function safeFetchText(raw: string, opts: { maxBytes?: number; timeoutMs?: number } = {}): Promise<{ url: string; html: string }> {
  const maxBytes = opts.maxBytes ?? 1_500_000; // 1.5 MB cap
  const maxHops = 5;
  let current = await assertSafeUrl(raw);

  for (let hop = 0; ; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
    try {
      const res = await fetch(current, {
        redirect: "manual", // follow manually so each hop is re-checked below
        signal: controller.signal,
        headers: { "user-agent": "GEOSEO-ThemeScanner/1.0", accept: "text/html" },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || hop >= maxHops) return { url: current, html: "" };
        try {
          current = await assertSafeUrl(new URL(location, current).toString());
        } catch {
          return { url: current, html: "" }; // redirect target is unsafe/unresolvable — stop, don't throw
        }
        continue;
      }

      const reader = res.body?.getReader();
      if (!reader) return { url: current, html: "" };
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.length;
          if (total > maxBytes) {
            await reader.cancel();
            break;
          }
          chunks.push(value);
        }
      }
      const buf = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        buf.set(c.subarray(0, Math.min(c.length, maxBytes - offset)), offset);
        offset += c.length;
        if (offset >= maxBytes) break;
      }
      return { url: current, html: new TextDecoder().decode(buf) };
    } finally {
      clearTimeout(timer);
    }
  }
}
