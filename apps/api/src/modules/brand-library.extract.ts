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

/** Real brand images from the page: og/twitter image, apple-touch-icon, logo + content imgs. */
function extractImages(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const push = (raw?: string | null) => {
    if (!raw || out.length >= 12) return;
    try {
      const u = new URL(raw, baseUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      const s = u.toString();
      if (!out.includes(s)) out.push(s);
    } catch {
      /* skip malformed URLs */
    }
  };
  const grab = (re: RegExp) => html.match(re)?.[1];

  push(grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i));
  push(grab(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i));
  push(grab(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i));

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || /^data:/i.test(src)) continue;
    // Drop obvious non-brand assets (tracking pixels, sprites, tiny spacers).
    if (/sprite|pixel|tracking|spacer|1x1|blank\.|\.gif(\?|$)/i.test(src)) continue;
    // Keep SVGs only when they look like a logo (icons are usually noise).
    if (/\.svg(\?|$)/i.test(src) && !/logo/i.test(tag)) continue;
    push(src);
  }
  return out;
}

function withIds<T>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((it, i) => ({ ...it, id: `${prefix}-${i + 1}` }));
}

export async function crawlBrandDraft(
  rawUrl: string,
): Promise<{ draft: BrandLibraryDraft; crawled: boolean; llm: boolean; source: string }> {
  const normalized = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
  const domain = normalized.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  let html = "";
  let crawled = false;
  try {
    const { html: fetched } = await safeFetchText(normalized, { maxBytes: 800_000, timeoutMs: 9000 });
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
    return { draft, crawled, llm: true, source: domain };
  }

  // Heuristic fallback (no LLM key / call failed): never fabricate — seed only what
  // the page literally gives us (a product from the value prop + tone + real images).
  const draft: BrandLibraryDraft = {
    products: description
      ? [{ id: "prod-1", name: company, description: clip(description, 1200), category: undefined, pricing: undefined, url: normalized }]
      : [],
    personas: [],
    proofPoints: [],
    terminology: { preferred: [], avoid: [] },
    voice: { tone: "professional", traits: [], guidance: "" },
    images,
  };
  return { draft, crawled, llm: false, source: domain };
}
