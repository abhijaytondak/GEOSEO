import { Injectable, NotFoundException } from "@nestjs/common";
import type { SiteThemeProfile, ThemeFidelity } from "@geoseo/types";
import { DocStore } from "../db/db";
import { safeFetchText } from "../common/ssrf";

const present = (xs: unknown[]) => Math.round((xs.filter(Boolean).length / xs.length) * 100);

/**
 * Theme-fidelity score (theme PRD §13): how natively a page rendered with this
 * profile will match the customer site. Derived from token completeness +
 * extraction confidence, scaled by confirmation status. Pure + reusable.
 */
export function computeThemeFidelity(theme: SiteThemeProfile | null): ThemeFidelity {
  if (!theme) {
    return {
      score: 0,
      grade: "needs-review",
      breakdown: [],
      blockers: ["No site theme profile — scan and confirm the customer's site theme."],
      recommendedAction: "Run a site-theme scan and confirm it so pages render in the customer's brand.",
    };
  }
  const c = theme.colors ?? ({} as SiteThemeProfile["colors"]);
  const t = theme.typography ?? ({} as SiteThemeProfile["typography"]);
  const l = theme.layout ?? ({} as SiteThemeProfile["layout"]);
  const comp = theme.components ?? ({} as SiteThemeProfile["components"]);

  const colorMatch = present([c.primary, c.background, c.foreground, c.border, c.accent]);
  const typographyMatch = present([t.headingFont, t.bodyFont, t.scale?.length]);
  const layoutMatch = present([l.maxWidth, l.radius, l.sectionSpacing, l.headerStyle]);
  const componentMatch = present([comp.button, comp.card, comp.input]);
  const confidence = theme.confidence ?? 0;

  const base = colorMatch * 0.3 + typographyMatch * 0.25 + layoutMatch * 0.2 + componentMatch * 0.15 + confidence * 0.1;
  const mult = theme.status === "confirmed" ? 1 : theme.status === "draft" ? 0.85 : 0.7;
  const score = Math.max(0, Math.min(100, Math.round(base * mult)));

  const breakdown = [
    { label: "Color match", score: colorMatch },
    { label: "Typography match", score: typographyMatch },
    { label: "Spacing & layout", score: layoutMatch },
    { label: "Component styles", score: componentMatch },
    { label: "Extraction confidence", score: confidence },
  ];
  const blockers = theme.status !== "confirmed" ? ["Theme not confirmed — confirm it to publish at full fidelity."] : [];
  const grade: ThemeFidelity["grade"] = score >= 80 ? "native-fit" : score >= 60 ? "acceptable" : "needs-review";
  const recommendedAction =
    grade === "native-fit"
      ? "Pages will render natively to the customer's site."
      : grade === "acceptable"
        ? "Acceptable fit — refine theme tokens for a closer match before publishing."
        : "Needs review — rescan/confirm the theme and fill missing tokens before publishing.";
  return { score, grade, breakdown, blockers, recommendedAction };
}

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

/**
 * Per-tenant site-theme store (multi-tenant pattern — docs/MULTI-TENANCY.md, P0-6).
 * State lazily hydrates per `tenantId` into a cache, backed by
 * `DocStore.loadForTenant/saveForTenant`; `ws-default` maps to the legacy "state" row.
 */
@Injectable()
export class SiteThemeStore {
  private cache = new Map<string, ThemeState>();
  private db = new DocStore<ThemeState>("cx_site_theme");

  private async state(tenantId: string): Promise<ThemeState> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;
    const loaded = (await this.db.loadForTenant(tenantId)) ?? { profiles: {}, seq: 0 };
    this.cache.set(tenantId, loaded);
    return loaded;
  }
  private persist(tenantId: string, s: ThemeState) {
    this.cache.set(tenantId, s);
    this.db.saveForTenant(tenantId, s);
  }

  async list(tenantId: string): Promise<SiteThemeProfile[]> {
    return Object.values((await this.state(tenantId)).profiles).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(tenantId: string, id: string): Promise<SiteThemeProfile> {
    const profile = (await this.state(tenantId)).profiles[id];
    if (!profile) throw new NotFoundException(`No site theme profile '${id}'`);
    return profile;
  }

  /** The active profile — most recent confirmed, else most recent overall. */
  async latest(tenantId: string): Promise<SiteThemeProfile | null> {
    const all = await this.list(tenantId);
    return all.find((p) => p.status === "confirmed") ?? all[0] ?? null;
  }

  /** SSRF-guarded scan → heuristic draft profile. */
  async scan(tenantId: string, rawUrl: string): Promise<SiteThemeProfile> {
    const { url, html } = await safeFetchText(rawUrl, { maxBytes: 1_200_000, timeoutMs: 8000 });
    const tokens = extractTokens(html);
    const found = [tokens.colors.length > 0, tokens.fonts.length > 0, !!tokens.themeColor, !!tokens.favicon].filter(Boolean).length;
    const confidence = Math.min(95, 35 + found * 15 + Math.min(tokens.colors.length, 6) * 2);
    const s = await this.state(tenantId);
    s.seq += 1;
    const id = `theme-${s.seq}`;
    const profile: SiteThemeProfile = {
      id,
      workspaceId: tenantId,
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
    s.profiles[id] = profile;
    this.persist(tenantId, s);
    return profile;
  }

  async update(tenantId: string, id: string, patch: Partial<SiteThemeProfile>): Promise<SiteThemeProfile> {
    const s = await this.state(tenantId);
    const existing = s.profiles[id];
    if (!existing) throw new NotFoundException(`No site theme profile '${id}'`);
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
    s.profiles[id] = next;
    this.persist(tenantId, s);
    return next;
  }

  async confirm(tenantId: string, id: string): Promise<SiteThemeProfile> {
    return this.update(tenantId, id, { status: "confirmed" });
  }
}
