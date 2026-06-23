import { Inject, Injectable, Logger } from "@nestjs/common";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";
import { BrandMemoryStore } from "./brand.service";
import { BrandLibraryStore } from "./brand-library.service";
import { SiteThemeStore } from "./site-theme.service";

export type ImageKind = "hero" | "infographic" | "illustration" | "og";

export interface GeneratedImage {
  id: string;
  subject: string;
  kind: ImageKind;
  /** Public/data URL of the asset (data-URI SVG placeholder when unconfigured). */
  url: string;
  prompt: string;
  source: "openai" | "placeholder";
  createdAt: string;
}

type ImageState = { items: GeneratedImage[]; seq: number };

const KIND_HINT: Record<ImageKind, string> = {
  hero: "a striking, high-quality hero banner image — wide-format composition, clear focal point, evocative of the service or product category, suitable as a full-bleed page header",
  infographic: "a clean visual diagram (process flow, comparison chart, or step-by-step checklist) — clear visual hierarchy, bold labels, minimal background, no dense paragraph text",
  illustration: "a polished abstract brand illustration — geometric shapes, flowing lines, or conceptual iconography that represents the brand's work or value",
  og: "a bold social share card — clear subject in the centre, brand colours dominant, legible at small sizes on social feeds",
};

/** Darken a #rrggbb hex toward black by `f` (0–1). Passes through non-hex unchanged. */
function darken(hex: string, f = 0.45): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const ch = (h: string) => Math.max(0, Math.round(parseInt(h, 16) * (1 - f)));
  return `#${[m[1], m[2], m[3]].map((h) => ch(h).toString(16).padStart(2, "0")).join("")}`;
}

const escXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Branded image / infographic generation (PRD §14). **Seam wired, key-gated:** with
 * `IMAGE_GEN_API_KEY` set it calls an OpenAI-compatible images API using a brand- and
 * theme-aware prompt; otherwise it returns a **theme-aware SVG placeholder** (customer
 * primary color), so pages always have an on-brand asset. Never throws.
 */
@Injectable()
export class ImageGenStore {
  private readonly log = new Logger(ImageGenStore.name);
  private cache = new Map<string, ImageState>();
  private db = new DocStore<ImageState>("cx_images");

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(SiteThemeStore) private readonly themes: SiteThemeStore,
  ) {}

  private async state(tenantId: string): Promise<ImageState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { items: [], seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }

  private persist(tenantId: string, s: ImageState): void {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  get configured(): boolean {
    return Boolean(process.env.IMAGE_GEN_API_KEY);
  }

  get source(): "openai" | "placeholder" {
    return this.configured ? "openai" : "placeholder";
  }

  async list(tenantId: string): Promise<GeneratedImage[]> {
    return (await this.state(tenantId)).items;
  }

  /** Confirmed site-theme palette (scanned from the brand's own site), or design defaults. */
  private async palette(tenantId: string): Promise<{ primary: string; accent?: string; dark: boolean }> {
    const theme = (await this.themes.list(tenantId)).find((t) => t.status === "confirmed");
    const c = theme?.colors;
    const primary = c?.primary ?? "#6c4cf1";
    const accent = c?.accent && c.accent !== primary ? c.accent : undefined;
    // Light vs dark canvas, inferred from the scanned background so generated art matches.
    const bg = c?.background;
    const dark = !!bg && /^#?[0-3]/i.test(bg.replace(/^#/, ""));
    return { primary, accent, dark };
  }

  /** Confirmed site-theme primary color, or the design default. */
  private async primaryColor(tenantId: string): Promise<string> {
    return (await this.palette(tenantId)).primary;
  }

  /**
   * A consistent **brand style signature** appended to every image so the whole set reads as
   * one visual family (brand harmony). Derived from the brand's *own* assets: the site-scanned
   * palette (primary/accent + light/dark canvas), brand voice traits → visual mood, and — when
   * Brand Memory holds real brand imagery — an instruction to match that existing aesthetic.
   */
  private async styleSignature(tenantId: string, primary: string, accent?: string, dark = false): Promise<string> {
    const lib = await this.library.get(tenantId).catch(() => undefined);
    const traits = lib?.voice?.traits?.slice(0, 4).filter(Boolean) ?? [];
    const mood = traits.length ? `Visual mood: ${traits.join(", ")}.` : "";
    const hasAssets = (lib?.images?.length ?? 0) > 0;
    const bits = [
      `Brand palette: lead with ${primary}${accent ? `, accent ${accent}` : ""};`,
      `${dark ? "dark" : "light"} background that matches the brand's site.`,
      mood,
      // Fixed art direction → every render shares composition/lighting → harmony across the set.
      "Cohesive brand art direction: clean, modern, professional; soft even lighting; generous negative space; flat, minimal, consistent style.",
      hasAssets ? "Stay visually consistent with the brand's existing imagery and identity." : "",
      "No stock photography, no logos, no watermark, minimal or no text.",
    ];
    return bits.filter(Boolean).join(" ");
  }

  /** Brand + theme-aware generation prompt — branded, customer colors, harmonized style. */
  private async buildPrompt(tenantId: string, subject: string, kind: ImageKind, primary: string, accent?: string, dark = false): Promise<string> {
    const b = this.brand.current();
    const company = b?.company?.trim() || "the brand";
    const bits = [
      `${KIND_HINT[kind]}.`,
      `Brand: ${company}${b?.valueProp ? ` — ${b.valueProp}` : ""}.`,
      `Visual subject: ${subject}.`,
      b?.industry ? `Industry: ${b.industry}.` : "",
      b?.tone ? `Brand tone: ${b.tone}.` : "",
      await this.styleSignature(tenantId, primary, accent, dark),
    ];
    return bits.filter(Boolean).join(" ");
  }

  /**
   * Instant theme-aware placeholder data URI — no generation, no persistence. Used as a hero
   * stand-in so page creation returns immediately while the real raster generates in the
   * background (see PageEngineStore.upgradeHeroImage).
   */
  async placeholderUrl(tenantId: string, subject: string, kind: ImageKind): Promise<string> {
    const { primary } = await this.palette(tenantId);
    return this.placeholder(subject, kind, primary);
  }

  /** Theme-aware SVG placeholder (data URI) — used when image gen is unconfigured. */
  private placeholder(subject: string, kind: ImageKind, primary: string): string {
    const dark = darken(primary);
    const label = escXml(subject.slice(0, 48));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<circle cx="1000" cy="120" r="260" fill="#ffffff" opacity="0.06"/>
<circle cx="180" cy="560" r="200" fill="#ffffff" opacity="0.05"/>
<text x="64" y="300" fill="#ffffff" opacity="0.85" font-family="system-ui,sans-serif" font-size="30" font-weight="600">${escXml(kind.toUpperCase())}</text>
<text x="64" y="360" fill="#ffffff" font-family="system-ui,sans-serif" font-size="52" font-weight="800">${label}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  async deleteAsset(tenantId: string, assetId: string): Promise<void> {
    const s = await this.state(tenantId);
    const before = s.items.length;
    s.items = s.items.filter((img) => img.id !== assetId);
    if (s.items.length === before) return; // not found — no-op (idempotent)
    this.persist(tenantId, s);
  }

  async updateAsset(tenantId: string, assetId: string, patch: { altText?: string; label?: string }): Promise<GeneratedImage | null> {
    const s = await this.state(tenantId);
    const idx = s.items.findIndex((img) => img.id === assetId);
    if (idx === -1) return null;
    const item = s.items[idx];
    // `label` maps to `subject` (the user-visible description); `altText` is stored there too.
    if (patch.label !== undefined) item.subject = patch.label.slice(0, 240).trim() || item.subject;
    if (patch.altText !== undefined) item.subject = patch.altText.slice(0, 240).trim() || item.subject;
    s.items[idx] = item;
    this.persist(tenantId, s);
    return item;
  }

  async generate(tenantId: string, subject: string, kind: ImageKind, now: string): Promise<GeneratedImage> {
    const { primary, accent, dark } = await this.palette(tenantId);
    const prompt = await this.buildPrompt(tenantId, subject, kind, primary, accent, dark);
    const generated = this.configured ? await this.viaApi(prompt) : null;
    const url = generated ?? this.placeholder(subject, kind, primary);
    const s = await this.state(tenantId);
    s.seq += 1;
    const image: GeneratedImage = {
      id: `img-${s.seq}`,
      subject,
      kind,
      url,
      prompt,
      // `generated` is a real render from the image API; null ⇒ we fell back to the SVG
      // placeholder. (Both can be data: URIs, so the URL prefix alone can't tell them apart.)
      source: generated ? "openai" : "placeholder",
      createdAt: now,
    };
    s.items.unshift(image);
    if (s.items.length > 200) s.items.length = 200;
    this.persist(tenantId, s);
    return image;
  }

  /** OpenAI-compatible images API. Returns a URL, or null on any failure → placeholder. */
  private async viaApi(prompt: string): Promise<string | null> {
    const base = (process.env.IMAGE_GEN_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.IMAGE_GEN_MODEL ?? "gpt-image-1";
    // Smaller sizes generate far faster on local diffusion (512² ≈ ¼ the compute of 1024²);
    // hosted APIs keep the 1024² default when IMAGE_GEN_SIZE is unset.
    const size = process.env.IMAGE_GEN_SIZE ?? "1024x1024";
    try {
      const res = await fetchWithTimeout(
        `${base}/images/generations`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.IMAGE_GEN_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({ model, prompt, n: 1, size }),
        },
        // Local diffusion (Ollama z-image/flux) is far slower than hosted APIs → configurable.
        // Observed: warm 512² on an M3 Pro ≈ 50s, so the 30s default is too low for local gen.
        Number(process.env.IMAGE_GEN_TIMEOUT_MS) || 30_000,
      );
      if (!res.ok) {
        this.log.warn(`Image gen ${res.status} — using theme-aware placeholder`);
        return null;
      }
      const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
      const d = json.data?.[0];
      if (d?.url) return d.url;
      if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
      return null;
    } catch (err) {
      this.log.warn(`Image gen failed (${err instanceof Error ? err.message : "unknown"}) — placeholder`);
      return null;
    }
  }
}
