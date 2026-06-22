import { BadRequestException } from "@nestjs/common";
import { safeFetchText } from "../common/ssrf";
import { extractBrandLibrary } from "../llm/brand-extract";
import type { BrandProduct, BuyerPersona, ProofPoint, ProofType, BrandTerminology, BrandVoice } from "./brand-library.service";

/**
 * Crawl a company's own website and build a *real* Brand Memory draft — products,
 * personas, proof, terminology, tone of voice, and real brand images pulled from
 * the page. Uses the DeepSeek extractor when a key is set; otherwise falls back to
 * a conservative heuristic (value-prop + tone + images, never invented facts).
 * Returns a draft for the user to review — it does NOT persist.
 */
export interface BrandLibraryDraft {
  products: BrandProduct[];
  personas: BuyerPersona[];
  proofPoints: ProofPoint[];
  terminology: BrandTerminology;
  voice: BrandVoice;
  images: string[];
}

const PROOF_TYPES: ProofType[] = ["stat", "testimonial", "case-study", "award", "logo"];
const clip = (s: unknown, max: number): string => (typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "");
const list = (v: unknown, cap = 8, max = 200): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => clip(x, max)).filter(Boolean))].slice(0, cap) : [];

/** Decode the common + numeric HTML entities (so meta copy reads naturally). */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ""; } })
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return ""; } })
    .replace(/&[a-z]+;/gi, " ");
}

/** Strip a page to readable text for the LLM (drops script/style/markup). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_IMAGES = 200;
const MAX_CRAWL_PAGES = 5;

/** From a responsive `srcset`, pick the highest-resolution candidate (sharper than a tiny default src). */
function largestFromSrcset(srcset: string): string | undefined {
  let best: { url: string; weight: number } | undefined;
  for (const part of srcset.split(",")) {
    const [url, descriptor] = part.trim().split(/\s+/, 2);
    if (!url) continue;
    const w = descriptor?.match(/(\d+)w/);
    const x = descriptor?.match(/([\d.]+)x/);
    const weight = w ? Number(w[1]) : x ? Number(x[1]) * 1000 : 1;
    if (!best || weight > best.weight) best = { url, weight };
  }
  return best?.url;
}

/** Real brand images from the page: og/twitter share image + meaningful content imgs.
 *  Skips tiny icons/sprites/avatars/placeholders and prefers the largest responsive variant. */
function extractImages(html: string, baseUrl: string, limit = MAX_IMAGES): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string | null) => {
    if (!raw || out.length >= limit) return;
    try {
      // Decode HTML entities in the URL (e.g. `&amp;` in query strings) so the image actually loads.
      const u = new URL(decodeEntities(raw).trim(), baseUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      const s = u.toString();
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    } catch {
      /* skip malformed URLs */
    }
  };
  const grab = (re: RegExp) => html.match(re)?.[1];

  // Anything that isn't a real brand image — tracking pixels, sprites, icon/avatar/placeholder assets.
  const JUNK = /sprite|pixel|tracking|spacer|1x1|blank|favicon|avatar|placeholder|loader|spinner|emoji|\bflag|hamburger|burger|chevron|caret|arrow-/i;
  const consider = (src?: string | null) => {
    if (!src || /^data:/i.test(src) || JUNK.test(src)) return;
    push(src);
  };

  // Social-share images first — the site's own chosen, full-size brand visuals.
  push(grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i));
  push(grab(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i));

  // <img> tags — prefer the largest responsive variant; honor lazy-load attributes.
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? "");
    const h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? "");
    if ((w && w < 40) || (h && h < 40)) continue; // genuinely tiny → icon/spacer
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1] || tag.match(/\bdata-srcset=["']([^"']+)["']/i)?.[1];
    consider(
      (srcset && largestFromSrcset(srcset)) ||
        tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
        tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ||
        tag.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1],
    );
  }
  // <picture><source srcset> responsive variants.
  for (const m of html.matchAll(/<source\b[^>]*\bsrcset=["']([^"']+)["']/gi)) consider(largestFromSrcset(m[1]));
  // CSS background images (marketing sites lean on these) — inline styles + <style> blocks.
  for (const m of html.matchAll(/url\((['"]?)([^)'"\s]+?\.(?:jpe?g|png|webp|gif|avif|svg)(?:\?[^)'"\s]*)?)\1\)/gi)) consider(m[2]);

  if (out.length < 4) push(grab(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i));
  return out;
}

function withIds<T>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((it, i) => ({ ...it, id: `${prefix}-${i + 1}` }));
}

const PAGE_PRIORITY = /product|solution|feature|service|about|case|customer|client|work|portfolio|gallery|pricing|industr|platform|use-case/i;

/** Same-domain internal page links to ALSO crawl for brand images — so we capture every brand
 *  image across the site, not just the homepage. Prioritizes content-rich pages; capped. */
function internalLinks(html: string, baseUrl: string, domain: string): string[] {
  const bare = (h: string) => h.replace(/^www\./i, "").toLowerCase();
  const host = bare(domain);
  const seen = new Set<string>();
  const all: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (/^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const u = new URL(decodeEntities(href).trim(), baseUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      if (bare(u.hostname) !== host) continue; // same domain only
      if (/\.(pdf|zip|jpe?g|png|svg|gif|webp|mp4|mov|css|js)(\?|$)/i.test(u.pathname)) continue;
      u.hash = "";
      const s = u.toString().replace(/\/$/, "");
      if (s === baseUrl.replace(/\/$/, "")) continue; // not the homepage itself
      if (!seen.has(s)) {
        seen.add(s);
        all.push(s);
      }
    } catch {
      /* skip malformed hrefs */
    }
  }
  const priority = all.filter((u) => PAGE_PRIORITY.test(u));
  const rest = all.filter((u) => !PAGE_PRIORITY.test(u));
  return [...priority, ...rest].slice(0, MAX_CRAWL_PAGES);
}

export async function crawlBrandDraft(
  rawUrl: string,
): Promise<{ draft: BrandLibraryDraft; crawled: boolean; llm: boolean; source: string; text: string }> {
  const normalized = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
  const domain = normalized.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  let html = "";
  let crawled = false;
  try {
    const { html: fetched } = await safeFetchText(normalized, { maxBytes: 1_800_000, timeoutMs: 10_000 });
    html = fetched;
    crawled = Boolean(html);
  } catch (err) {
    // SSRF / invalid-URL rejections must surface as 400; network/timeout falls back gracefully.
    if (err instanceof BadRequestException) throw err;
  }

  const grab = (re: RegExp) => decodeEntities((html.match(re)?.[1] ?? "").trim()).trim();
  const title = grab(/<title[^>]*>([^<]+)<\/title>/i);
  const siteName = grab(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  const description =
    grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const company = siteName || title.split(/[|\-–·:]/)[0].trim() || (domain.split(".")[0] || "Company").replace(/\b\w/g, (c) => c.toUpperCase());
  // First H1 as a tagline fallback when there's no meta description (used by the heuristic product).
  const h1 = decodeEntities((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const tagline = description || h1 || title.replace(company, "").replace(/^[\s|\-–·:]+/, "").trim();

  // Collect brand images from the homepage AND key internal pages so we capture *every* brand image,
  // not just the homepage. Same-domain only, SSRF-guarded per hop, fetched in parallel, fail-soft.
  const images: string[] = [];
  if (crawled) {
    const seen = new Set<string>();
    const add = (urls: string[]) => {
      for (const u of urls) {
        if (images.length >= MAX_IMAGES) break;
        if (!seen.has(u)) {
          seen.add(u);
          images.push(u);
        }
      }
    };
    add(extractImages(html, normalized));
    const links = internalLinks(html, normalized, domain);
    const pages = await Promise.all(
      links.map(async (link) => {
        try {
          const { html: pageHtml } = await safeFetchText(link, { maxBytes: 1_200_000, timeoutMs: 6000 });
          return pageHtml ? extractImages(pageHtml, link) : [];
        } catch {
          return []; // a page that errors (SSRF/timeout) just contributes nothing
        }
      }),
    );
    for (const list of pages) add(list);
  }
  const text = crawled ? htmlToText(html) : "";

  // Preferred path: real structured extraction via the LLM (uses only on-page facts).
  const ai = crawled ? await extractBrandLibrary(text, { url: normalized, company }) : null;

  if (ai) {
    const draft: BrandLibraryDraft = {
      products: withIds(
        ai.products
          .map((p) => ({
            name: clip(p.name, 160),
            description: clip(p.description, 1200),
            category: clip(p.category, 80) || undefined,
            pricing: clip(p.pricing, 200) || undefined,
            url: undefined,
          }))
          .filter((p) => p.name)
          .slice(0, 12),
        "prod",
      ),
      personas: withIds(
        ai.personas
          .map((p) => ({
            name: clip(p.name, 160),
            role: clip(p.role, 160) || undefined,
            painPoints: list(p.painPoints),
            goals: list(p.goals),
            buyingTriggers: list(p.buyingTriggers),
          }))
          .filter((p) => p.name)
          .slice(0, 8),
        "persona",
      ),
      proofPoints: withIds(
        ai.proofPoints
          .map((p) => {
            const t = clip(p.type, 20) as ProofType;
            return {
              type: PROOF_TYPES.includes(t) ? t : "stat",
              label: clip(p.label, 240),
              detail: clip(p.detail, 600) || undefined,
              source: undefined,
            };
          })
          .filter((p) => p.label)
          .slice(0, 12),
        "proof",
      ),
      terminology: { preferred: list(ai.terminology?.preferred, 20, 80), avoid: list(ai.terminology?.avoid, 20, 80) },
      voice: {
        tone: clip(ai.voice?.tone, 120) || "professional",
        traits: list(ai.voice?.traits, 12, 60),
        guidance: clip(ai.voice?.guidance, 1200),
      },
      images,
    };
    return { draft, crawled, llm: true, source: domain, text: text.slice(0, 14000) };
  }

  // Heuristic fallback (no LLM key / call failed): never fabricate — seed only what
  // the page literally gives us (a product from the value prop + tone + real images).
  const draft: BrandLibraryDraft = {
    products: crawled && company
      ? [{ id: "prod-1", name: company, description: clip(tagline, 1200), category: undefined, pricing: undefined, url: normalized }]
      : [],
    personas: [],
    proofPoints: [],
    terminology: { preferred: [], avoid: [] },
    voice: { tone: "professional", traits: [], guidance: "" },
    images,
  };
  return { draft, crawled, llm: false, source: domain, text: text.slice(0, 14000) };
}
