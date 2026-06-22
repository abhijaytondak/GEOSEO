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

/** Normalize a CSS color token (#abc / #rrggbb / #rrggbbaa / rgb()/rgba()) to #rrggbb. */
function normalizeColor(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return "#" + m[1].split("").map((c) => c + c).join("");
  m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s);
  if (m) return "#" + m[1];
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s);
  if (m) {
    const c = [m[1], m[2], m[3]].map((n) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))));
    return "#" + c.map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  return null;
}

/** The page's own background/foreground, read only from explicit html/body/:root
 *  rules — conservative, so dark sites unlock a dark theme but ambiguous ones keep
 *  the safe light defaults rather than guessing wrong. */
function findSurface(html: string): { background?: string; foreground?: string } {
  let background: string | undefined;
  let foreground: string | undefined;
  for (const m of html.matchAll(/(?:^|[{};,>])\s*(?:html|body|:root)\s*\{([^}]*)\}/gi)) {
    const body = m[1];
    if (!background) {
      const bg = /background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i.exec(body)?.[1];
      if (bg) background = normalizeColor(bg) ?? undefined;
    }
    if (!foreground) {
      const fg = /(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i.exec(body)?.[1];
      if (fg) foreground = normalizeColor(fg) ?? undefined;
    }
  }
  return { background, foreground };
}

/** Pull a handful of visual tokens out of raw HTML + CSS — heuristic, best-effort. */
function extractTokens(html: string): {
  colors: string[];
  fonts: string[];
  background?: string;
  foreground?: string;
  themeColor?: string;
  favicon?: string;
  ogImage?: string;
} {
  const lower = html;
  // Capture 8-digit, 6-digit and 3-digit hex plus rgb()/rgba() — covers CSS custom
  // properties and the rgb/short-hex Webflow/Framer ship in external bundles, where
  // a 6-hex-only scan previously found nothing and fell back to the default purple.
  const raw = [
    ...(lower.match(/#[0-9a-fA-F]{8}\b/g) ?? []),
    ...(lower.match(/#[0-9a-fA-F]{6}\b/g) ?? []),
    ...(lower.match(/#[0-9a-fA-F]{3}\b/g) ?? []),
    ...(lower.match(/rgba?\([^)]*\)/gi) ?? []),
  ];
  const colorCounts = new Map<string, number>();
  for (const r of raw) {
    const n = normalizeColor(r);
    if (n) colorCounts.set(n, (colorCounts.get(n) ?? 0) + 1);
  }
  const colors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  const fonts = [...lower.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)]
    .map((m) => m[1].split(",")[0].replace(/['"]/g, "").trim())
    .filter((f) => f && !/^(inherit|initial|unset|var\()/i.test(f));

  const { background, foreground } = findSurface(lower);
  const themeColor = lower.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const favicon = lower.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];
  const ogImage = lower.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return { colors, fonts: [...new Set(fonts)], background, foreground, themeColor, favicon, ogImage };
}

/** HSL of a #rrggbb hex (null if unparseable) — used to pick sensible brand roles. */
function hslOf(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let s = 0, h = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}
/** A real brand color: not near-white / near-black, and saturated enough to not be a grey. */
function isVivid(hex: string): boolean {
  const c = hslOf(hex);
  return !!c && c.l > 0.12 && c.l < 0.9 && c.s > 0.22;
}
function hueGap(a: string, b: string): number {
  const x = hslOf(a), y = hslOf(b);
  if (!x || !y) return 360;
  const diff = Math.abs(x.h - y.h);
  return Math.min(diff, 360 - diff);
}

function pickColors(t: ReturnType<typeof extractTokens>): SiteThemeProfile["colors"] {
  // Only consider real brand colors — drop off-whites, near-blacks, and greys that pollute CSS,
  // so "accent"/"muted" never end up as a near-white or a random scanned color.
  const vivid = t.colors.filter(isVivid);
  const primary =
    (t.themeColor && isVivid(t.themeColor) ? t.themeColor : undefined) ?? vivid[0] ?? t.themeColor ?? "#6c4cf1";
  // Accent = the next vivid color whose hue is clearly different from primary (never a near-white).
  const accent = vivid.find((c) => c !== primary && hueGap(c, primary) > 40);
  // Use the site's real background/foreground when we could read them (unlocks dark
  // themes — the renderer derives surfaces along the bg↔fg axis); else safe defaults.
  const dark = !!t.background && (hslOf(t.background)?.l ?? 1) < 0.5;
  return {
    background: t.background ?? "#ffffff",
    foreground: t.foreground ?? (dark ? "#f5f5f5" : "#0a0a0a"),
    primary,
    accent, // optional — the Brand Kit only renders an accent ramp when one is found
    muted: dark ? "#1c1f26" : "#f1f5f9", // neutral surface tuned to light/dark — never an arbitrary brand color
    border: dark ? "#2a2e37" : "#e5e7eb",
  };
}

/** Fetch up to 3 linked stylesheets so a site's real palette/fonts — which
 *  Webflow and Framer ship in external hashed CSS bundles, not inline — are
 *  visible to the token scan. SSRF-guarded + byte-capped; failures are skipped. */
async function fetchLinkedCss(pageUrl: string, html: string): Promise<string> {
  const hrefs = [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter((m) => /rel=["'][^"']*stylesheet[^"']*["']/i.test(m[0]))
    .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
    .filter((h): h is string => !!h)
    .slice(0, 3);
  let css = "";
  for (const href of hrefs) {
    try {
      const abs = new URL(href, pageUrl).toString();
      const { html: text } = await safeFetchText(abs, { maxBytes: 800_000, timeoutMs: 6000 });
      css += "\n" + text;
    } catch {
      /* skip an unreachable/blocked stylesheet — best-effort */
    }
  }
  return css;
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
    const css = await fetchLinkedCss(url, html);
    const tokens = extractTokens(css ? `${html}\n${css}` : html);
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
