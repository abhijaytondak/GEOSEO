import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DocStore } from "../db/db";
import { fetchWithTimeout } from "../common/http";
import { BrandMemoryStore } from "./brand.service";
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
  hero: "a clean, modern hero banner image",
  infographic: "a minimal infographic (process flow / comparison / checklist style), clear visual hierarchy, no dense text",
  illustration: "a simple abstract brand illustration",
  og: "a social share (Open Graph) card image",
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
export class ImageGenStore implements OnModuleInit {
  private readonly log = new Logger(ImageGenStore.name);
  private items: GeneratedImage[] = [];
  private seq = 0;
  private db = new DocStore<ImageState>("cx_images");

  constructor(
    @Inject(BrandMemoryStore) private readonly brand: BrandMemoryStore,
    @Inject(SiteThemeStore) private readonly themes: SiteThemeStore,
  ) {}

  async onModuleInit() {
    await this.db.init({ items: this.items, seq: this.seq }, (loaded) => {
      this.items = loaded.items ?? [];
      this.seq = loaded.seq ?? 0;
    });
  }

  get configured(): boolean {
    return Boolean(process.env.IMAGE_GEN_API_KEY);
  }

  get source(): "openai" | "placeholder" {
    return this.configured ? "openai" : "placeholder";
  }

  list(): GeneratedImage[] {
    return this.items;
  }

  /** Confirmed site-theme primary color, or the design default. */
  private primaryColor(): string {
    return this.themes.list().find((t) => t.status === "confirmed")?.colors?.primary ?? "#6c4cf1";
  }

  /** Brand + theme-aware generation prompt — branded, customer colors, no stock imagery. */
  private buildPrompt(subject: string, kind: ImageKind): string {
    const b = this.brand.current();
    const company = b?.company?.trim() || "the brand";
    const bits = [
      `${KIND_HINT[kind]} for ${company}${b?.valueProp ? ` (${b.valueProp})` : ""}.`,
      `Subject: ${subject}.`,
      b?.tone ? `Brand tone: ${b.tone}.` : "",
      `Build the palette around ${this.primaryColor()}. Professional, on-brand, no stock photography, no logos, minimal text.`,
    ];
    return bits.filter(Boolean).join(" ");
  }

  /** Theme-aware SVG placeholder (data URI) — used when image gen is unconfigured. */
  private placeholder(subject: string, kind: ImageKind): string {
    const primary = this.primaryColor();
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

  async generate(subject: string, kind: ImageKind, now: string): Promise<GeneratedImage> {
    const prompt = this.buildPrompt(subject, kind);
    const url = (this.configured ? await this.viaApi(prompt) : null) ?? this.placeholder(subject, kind);
    this.seq += 1;
    const image: GeneratedImage = {
      id: `img-${this.seq}`,
      subject,
      kind,
      url,
      prompt,
      source: url.startsWith("data:") ? "placeholder" : "openai",
      createdAt: now,
    };
    this.items.unshift(image);
    if (this.items.length > 200) this.items.length = 200;
    this.db.save({ items: this.items, seq: this.seq });
    return image;
  }

  /** OpenAI-compatible images API. Returns a URL, or null on any failure → placeholder. */
  private async viaApi(prompt: string): Promise<string | null> {
    const base = (process.env.IMAGE_GEN_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.IMAGE_GEN_MODEL ?? "gpt-image-1";
    try {
      const res = await fetchWithTimeout(
        `${base}/images/generations`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.IMAGE_GEN_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({ model, prompt, n: 1, size: "1024x1024" }),
        },
        30_000,
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
