import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { SiteThemeProfile } from "@geoseo/types";
import { DocStore } from "../db/db";
import { safeFetchText } from "../common/ssrf";

type ThemeState = { profiles: Record<string, SiteThemeProfile>; seq: number };

function nowIso(): string {
  return new Date().toISOString();
}

/** Pull a handful of visual tokens out of raw HTML — heuristic, best-effort. */
function extractTokens(html: string): {
  colors: string[];
  fonts: string[];
  themeColor?: string;
  favicon?: string;
  ogImage?: string;
} {
  const lower = html;
  const hexes = (lower.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase());
  const colorCounts = new Map<string, number>();
  for (const h of hexes) colorCounts.set(h, (colorCounts.get(h) ?? 0) + 1);
  const colors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  const fonts = [...lower.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)]
    .map((m) => m[1].split(",")[0].replace(/['"]/g, "").trim())
    .filter((f) => f && !/^(inherit|initial|unset|var\()/i.test(f));

  const themeColor = lower.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const favicon = lower.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];
  const ogImage = lower.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return { colors, fonts: [...new Set(fonts)], themeColor, favicon, ogImage };
}

function pickColors(t: ReturnType<typeof extractTokens>): SiteThemeProfile["colors"] {
  const nonNeutral = t.colors.filter((c) => c !== "#ffffff" && c !== "#000000" && c !== "#fff" && c !== "#000");
  return {
    background: "#ffffff",
    foreground: "#0a0a0a",
    primary: t.themeColor ?? nonNeutral[0] ?? "#6c4cf1",
    accent: nonNeutral[1],
    muted: nonNeutral[2],
    border: "#e5e7eb",
  };
}

@Injectable()
export class SiteThemeStore implements OnModuleInit {
  private profiles: Record<string, SiteThemeProfile> = {};
  private seq = 0;
  private db = new DocStore<ThemeState>("cx_site_theme");

  async onModuleInit() {
    await this.db.init(this.snapshot(), (loaded) => {
      this.profiles = loaded.profiles ?? {};
      this.seq = loaded.seq ?? 0;
    });
  }

  private snapshot(): ThemeState {
    return { profiles: this.profiles, seq: this.seq };
  }
  private persist() {
    this.db.save(this.snapshot());
  }

  list(): SiteThemeProfile[] {
    return Object.values(this.profiles).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  get(id: string): SiteThemeProfile {
    const profile = this.profiles[id];
    if (!profile) throw new NotFoundException(`No site theme profile '${id}'`);
    return profile;
  }

  /** SSRF-guarded scan → heuristic draft profile. */
  async scan(rawUrl: string): Promise<SiteThemeProfile> {
    const { url, html } = await safeFetchText(rawUrl, { maxBytes: 1_200_000, timeoutMs: 8000 });
    const tokens = extractTokens(html);
    const found = [tokens.colors.length > 0, tokens.fonts.length > 0, !!tokens.themeColor, !!tokens.favicon].filter(Boolean).length;
    const confidence = Math.min(95, 35 + found * 15 + Math.min(tokens.colors.length, 6) * 2);
    this.seq += 1;
    const id = `theme-${this.seq}`;
    const profile: SiteThemeProfile = {
      id,
      workspaceId: "ws-default",
      sourceUrls: [url],
      status: confidence >= 60 ? "draft" : "needs-review",
      colors: pickColors(tokens),
      typography: {
        headingFont: tokens.fonts[0],
        bodyFont: tokens.fonts[1] ?? tokens.fonts[0],
        scale: ["0.875rem", "1rem", "1.25rem", "1.5rem", "2rem", "3rem"],
        headingWeight: 700,
        bodyWeight: 400,
      },
      layout: { maxWidth: 1200, sectionSpacing: 80, gridGap: 24, headerStyle: "split", radius: 12 },
      components: {
        button: { background: pickColors(tokens).primary, foreground: "#ffffff", radius: 9999 },
        card: { background: "#ffffff", border: "#e5e7eb", radius: 16 },
        input: { background: "#f8fafc", border: "#e5e7eb", radius: 10 },
      },
      assets: { faviconUrl: tokens.favicon, sampleImages: tokens.ogImage ? [tokens.ogImage] : [] },
      confidence,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.profiles[id] = profile;
    this.persist();
    return profile;
  }

  update(id: string, patch: Partial<SiteThemeProfile>): SiteThemeProfile {
    const existing = this.get(id);
    const next: SiteThemeProfile = {
      ...existing,
      ...patch,
      id: existing.id,
      colors: { ...existing.colors, ...(patch.colors ?? {}) },
      typography: { ...existing.typography, ...(patch.typography ?? {}) },
      layout: { ...existing.layout, ...(patch.layout ?? {}) },
      components: { ...existing.components, ...(patch.components ?? {}) },
      assets: { ...existing.assets, ...(patch.assets ?? {}) },
      updatedAt: nowIso(),
    };
    this.profiles[id] = next;
    this.persist();
    return next;
  }

  confirm(id: string): SiteThemeProfile {
    return this.update(id, { status: "confirmed" });
  }
}
