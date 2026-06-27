"use client";

import { useEffect, useState } from "react";
import { Palette, Type, Square, MessageSquare, Loader2, ScanLine } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

/**
 * Brand Kit — graceful capture of the workspace's colors + typography (Gushwork-parity).
 * Sources tokens from the confirmed Site Theme scan; renders each brand color as a 100→900
 * shade ramp with hex labels, plus the typography scale. Self-fetching so it drops into the
 * Brand Memory workspace without changing its server load.
 */
type ThemeColors = {
  background?: string;
  foreground?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  muted?: string;
  border?: string;
};
type ThemeTypography = { headingFont?: string; bodyFont?: string; scale?: string[]; headingWeight?: number; bodyWeight?: number };
interface SiteTheme {
  id: string;
  status: "draft" | "confirmed" | "needs-review";
  colors: ThemeColors;
  typography: ThemeTypography;
}

/** Parse #rrggbb (or #rgb) → [r,g,b], else null. */
function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (rgb: [number, number, number]) => "#" + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [17, 17, 17];
/** Steps: 500 = base; lighter toward white (100–400), darker toward black (600–900). */
const STEPS: { name: string; toward: "white" | "black" | "base"; t: number }[] = [
  { name: "100", toward: "white", t: 0.85 },
  { name: "200", toward: "white", t: 0.7 },
  { name: "300", toward: "white", t: 0.5 },
  { name: "400", toward: "white", t: 0.25 },
  { name: "500", toward: "base", t: 0 },
  { name: "600", toward: "black", t: 0.12 },
  { name: "700", toward: "black", t: 0.25 },
  { name: "800", toward: "black", t: 0.4 },
  { name: "900", toward: "black", t: 0.55 },
];

function ramp(baseHex: string): { name: string; hex: string }[] {
  const base = hexToRgb(baseHex);
  if (!base) return [];
  return STEPS.map((s) => ({
    name: s.name,
    hex: s.toward === "base" ? toHex(base) : toHex(mix(base, s.toward === "white" ? WHITE : BLACK, s.t)),
  }));
}

function ColorRamp({ label, baseHex }: { label: string; baseHex?: string }) {
  if (!baseHex) return null;
  const shades = ramp(baseHex);
  if (!shades.length) return null;
  return (
    <div>
      <div className="mb-2 text-label font-semibold capitalize text-foreground">{label}</div>
      <div className="grid grid-cols-9 gap-1.5">
        {shades.map((s) => (
          <div key={s.name} className="min-w-0">
            <div
              className="h-12 w-full rounded-md ring-1 ring-inset ring-black/5"
              style={{ background: s.hex }}
              title={`${label} ${s.name} · ${s.hex}`}
            />
            <div className="mt-1 truncate text-micro font-medium text-foreground">{s.name}</div>
            <div className="truncate text-micro uppercase text-muted-foreground">{s.hex.replace("#", "")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandKit() {
  const [theme, setTheme] = useState<SiteTheme | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    fetch("/api/v1/site-theme", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        // The list summary keeps colors + typography (what the brand kit renders), so no
        // detail fetch is needed here. (Only `components`/`sourceUrls` are stripped — editor-only.)
        const profiles: SiteTheme[] = j?.data?.profiles ?? [];
        setTheme(profiles.find((p) => p.status === "confirmed") ?? profiles[0] ?? null);
      })
      .catch(() => live && setTheme(null));
    return () => {
      live = false;
    };
  }, []);

  if (theme === undefined) {
    return (
      <Panel title="Brand Kit" description="Colors and typography the AI uses to stay on-brand.">
        <div className="flex items-center gap-2 py-8 text-label text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading brand kit…
        </div>
      </Panel>
    );
  }

  if (!theme) {
    return (
      <Panel title="Brand Kit" description="Colors and typography the AI uses to stay on-brand.">
        <div className="flex flex-col items-start gap-3 py-6">
          <p className="text-label text-muted-foreground">
            No brand kit yet. Scan your site to extract its colors, fonts, and styling — then every generated page
            renders natively in your brand.
          </p>
          <Button variant="brand" size="sm" render={<Link href="/theme" />}>
            <ScanLine className="size-3.5" aria-hidden="true" /> Scan your site
          </Button>
        </div>
      </Panel>
    );
  }

  const c = theme.colors ?? {};
  const t = theme.typography ?? {};
  const scale = t.scale ?? ["0.875rem", "1rem", "1.25rem", "1.5rem", "2rem", "3rem"];
  const semantic = [
    { label: "Background", hex: c.background },
    { label: "Foreground", hex: c.foreground },
    { label: "Border", hex: c.border },
    { label: "Muted", hex: c.muted },
  ].filter((s) => s.hex);

  return (
    <div className="space-y-5">
      <Panel title="Color palette" description="Each brand color expanded into a 100–900 ramp for consistent, on-brand output.">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-label text-muted-foreground">
            <Palette className="size-4" aria-hidden="true" />
            {theme.status === "confirmed" ? "Confirmed from your site scan." : "Draft — confirm on the Theme page to lock it in."}
          </div>
          <ColorRamp label="primary" baseHex={c.primary} />
          {c.accent && <ColorRamp label="accent" baseHex={c.accent} />}
          {c.secondary && <ColorRamp label="secondary" baseHex={c.secondary} />}
          {semantic.length > 0 && (
            <div>
              <div className="mb-2 text-label font-semibold text-foreground">Neutrals</div>
              <div className="flex flex-wrap gap-3">
                {semantic.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="size-8 rounded-md ring-1 ring-inset ring-black/10" style={{ background: s.hex }} />
                    <div className="leading-tight">
                      <div className="text-micro font-medium text-foreground">{s.label}</div>
                      <div className="text-micro uppercase text-muted-foreground">{s.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Typography" description="Heading and body fonts + the type scale used across generated pages.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="flex items-center gap-1.5 text-micro font-semibold uppercase text-muted-foreground">
                <Type className="size-3.5" aria-hidden="true" /> Heading
              </div>
              <div className="mt-1.5 text-title font-bold text-foreground" style={{ fontFamily: t.headingFont }}>
                {t.headingFont ?? "System default"}
              </div>
              {t.headingWeight && <div className="text-micro text-muted-foreground">Weight {t.headingWeight}</div>}
            </div>
            <div className="rounded-xl border border-border bg-surface-sunken p-4">
              <div className="flex items-center gap-1.5 text-micro font-semibold uppercase text-muted-foreground">
                <Square className="size-3.5" aria-hidden="true" /> Body
              </div>
              <div className="mt-1.5 text-h-card font-normal text-foreground" style={{ fontFamily: t.bodyFont }}>
                {t.bodyFont ?? "System default"}
              </div>
              {t.bodyWeight && <div className="text-micro text-muted-foreground">Weight {t.bodyWeight}</div>}
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 text-micro font-semibold uppercase text-muted-foreground">Type scale</div>
            <div className="space-y-1.5" style={{ fontFamily: t.headingFont }}>
              {[...scale].reverse().slice(0, 6).map((size, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span className="w-14 shrink-0 text-micro text-muted-foreground">{size}</span>
                  <span className="truncate font-semibold text-foreground" style={{ fontSize: size, lineHeight: 1.1 }}>
                    The quick brown fox
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <MessageSquare className="size-3.5" aria-hidden="true" /> Tone of voice and terminology live in the Library tab and shape every draft.
          </p>
        </div>
      </Panel>
    </div>
  );
}
