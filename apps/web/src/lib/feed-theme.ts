import type { CSSProperties } from "react";
import type { SiteThemeProfile } from "@geoseo/types";

/**
 * Maps a confirmed Site Theme Profile onto the design-system CSS variables so
 * public /feeds pages render in the customer's own palette/radius/font — native
 * to their brand, not the generic GEOSEO theme. Shared by /feeds/[slug] and the
 * /feeds index (AI Feed hub). Surfaces are derived from the background↔foreground
 * axis so contrast holds on both light and dark customer themes.
 */
type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex?: string): Rgb | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** WCAG relative luminance (0 = black, 1 = white). */
function relLuminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const mix = (a: Rgb, b: Rgb, t: number) =>
  `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(a.b + (b.b - a.b) * t)}`;

// Accepts the full profile OR the lightweight list summary — reads colors/typography/layout.
export function themeStyle(t: Pick<SiteThemeProfile, "colors" | "typography" | "layout"> | null): CSSProperties | undefined {
  if (!t) return undefined;
  const c = t.colors ?? ({} as SiteThemeProfile["colors"]);
  const v: Record<string, string> = {};
  const bg = hexToRgb(c.background);
  const fg = hexToRgb(c.foreground);

  if (bg && fg) {
    v["--background"] = c.background!;
    v["--foreground"] = c.foreground!;
    v["--card-foreground"] = c.foreground!;
    v["--card"] = mix(bg, fg, 0.05);
    v["--muted"] = mix(bg, fg, 0.1);
    v["--muted-foreground"] = mix(bg, fg, 0.55);
    v["--border"] = mix(bg, fg, 0.14);
    v["--border-strong"] = mix(bg, fg, 0.22);
  } else {
    if (c.background) v["--background"] = c.background;
    if (c.foreground) {
      v["--foreground"] = c.foreground;
      v["--card-foreground"] = c.foreground;
    }
    if (c.border) {
      v["--border"] = c.border;
      v["--border-strong"] = c.border;
    }
  }

  if (c.primary) {
    v["--brand"] = c.primary;
    const p = hexToRgb(c.primary);
    if (p) v["--brand-foreground"] = relLuminance(p) > 0.5 ? "#0a0a0a" : "#ffffff";
  }
  if (c.accent) v["--brand-accent"] = c.accent;
  if (t.layout?.radius) v["--radius"] = `${t.layout.radius}px`;
  // Body + heading fonts from the brand's scanned typography. Headings fall back to
  // the body font when the scan only found one face, so they always read as the brand's.
  const sans = "system-ui, -apple-system, sans-serif";
  const headingFont = t.typography?.headingFont ?? t.typography?.bodyFont;
  if (t.typography?.bodyFont) v["fontFamily"] = `'${t.typography.bodyFont}', ${sans}`;
  if (headingFont) v["--font-heading"] = `'${headingFont}', ${sans}`;
  return v as CSSProperties;
}
