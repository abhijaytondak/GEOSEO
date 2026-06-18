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
function htmlToText(html: string): string {
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

const MAX_IMAGES = 60;

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
function extractImages(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string | null) => {
    if (!raw || out.length >= MAX_IMAGES) return;
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

  // Social-share images first — the site's own chosen, full-size brand visuals.
  push(grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i));
  push(grab(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i));

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    // Skip images that declare tiny dimensions — icons/spacers, not brand imagery.
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? "");
    const h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? "");
    if ((w && w < 64) || (h && h < 64)) continue;
    // Prefer the largest responsive variant; fall back to src / lazy-loaded data-src.
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
    const src =
      (srcset && largestFromSrcset(srcset)) ||
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
    if (!src || /^data:/i.test(src)) continue;
    // Drop non-brand assets (tracking pixels, sprites, icons, avatars, placeholders, spinners).
    if (/sprite|pixel|tracking|spacer|1x1|blank|favicon|avatar|placeholder|loader|spinner|emoji|\bflag|hamburger|burger|chevron|caret|arrow-/i.test(src)) continue;
    // Keep SVGs only when they look like a logo (icon sprites are noise).
    if (/\.svg(\?|$)/i.test(src) && !/logo/i.test(tag + " " + src)) continue;
    push(src);
  }
  // apple-touch-icon is an icon — only include if we found little else.
  if (out.length < 4) push(grab(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i));
  return out;
}

function withIds<T>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((it, i) => ({ ...it, id: `${prefix}-${i + 1}` }));
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

  const images = crawled ? extractImages(html, normalized) : [];
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
