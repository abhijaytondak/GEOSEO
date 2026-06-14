"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Check,
  RefreshCw,
  Pencil,
  Globe,
  Palette,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { SiteThemeProfile } from "@geoseo/types";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppFeedback } from "@/components/system/app-feedback";

type Viewport = "desktop" | "tablet" | "mobile";
const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor; width: number | null }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: null },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 375 },
];

const STATUS_TONE: Record<SiteThemeProfile["status"], string> = {
  confirmed: "bg-positive/12 text-positive",
  draft: "bg-warning/15 text-warning",
  "needs-review": "bg-destructive/12 text-destructive",
};

const COLOR_KEYS: { key: keyof SiteThemeProfile["colors"]; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Muted" },
  { key: "border", label: "Border" },
];

export function ThemeSettingsView() {
  const { notify } = useAppFeedback();
  const [profiles, setProfiles] = useState<SiteThemeProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SiteThemeProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getSiteThemes()
      .then((list) => {
        if (cancelled) return;
        setProfiles(list);
        setActiveId(list[0]?.id ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(() => profiles.find((p) => p.id === activeId) ?? null, [profiles, activeId]);
  const shown = editing && draft ? draft : active;

  async function scan() {
    const url = scanUrl.trim();
    if (!url) return;
    setScanning(true);
    try {
      const { profile } = await api.scanSiteTheme(url);
      setProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
      setActiveId(profile.id);
      setScanUrl("");
      notify({ kind: "success", title: "Theme scanned", message: `Confidence ${profile.confidence}%. Review and confirm.` });
    } catch (err) {
      notify({ kind: "error", title: "Scan failed", message: err instanceof Error ? err.message : "Check the URL and try again." });
    } finally {
      setScanning(false);
    }
  }

  async function confirmTheme() {
    if (!active) return;
    setConfirming(true);
    try {
      const updated = await api.confirmSiteTheme(active.id);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      notify({ kind: "success", title: "Theme confirmed", message: "Generated pages will use this profile." });
    } catch (err) {
      notify({ kind: "error", title: "Could not confirm", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setConfirming(false);
    }
  }

  function startEdit() {
    if (!active) return;
    setDraft(structuredClone(active));
    setEditing(true);
  }

  async function saveEdits() {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api.updateSiteTheme(draft.id, { colors: draft.colors, layout: draft.layout });
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditing(false);
      setDraft(null);
      notify({ kind: "success", title: "Theme updated" });
    } catch (err) {
      notify({ kind: "error", title: "Save failed", message: err instanceof Error ? err.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  function setColor(key: keyof SiteThemeProfile["colors"], value: string) {
    setDraft((d) => (d ? { ...d, colors: { ...d.colors, [key]: value } } : d));
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading theme profile…
      </div>
    );
  }

  // Empty state — first-run scan
  if (!active) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Palette className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Match your website&apos;s look</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
          Scan your site so generated pages use your real colors, fonts, and component styles — and feel native, not like a detached microsite.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
              placeholder="https://yourcompany.com"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button onClick={scan} disabled={scanning || !scanUrl.trim()} className="h-10">
            {scanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Scan website
          </Button>
        </div>
      </div>
    );
  }

  const c = shown!.colors;

  return (
    <div className="space-y-5">
      {/* Status + actions header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]", STATUS_TONE[active.status])}>
              {active.status === "needs-review" ? "Needs review" : active.status}
            </span>
            <Confidence value={active.confidence} />
          </div>
          <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground">
            {active.sourceUrls.length ? `Scanned: ${active.sourceUrls.join(", ")}` : "No source URLs recorded"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditing(false); setDraft(null); }} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" className="h-8" onClick={saveEdits} disabled={saving}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save changes
              </Button>
            </>
          ) : (
            <>
              <RescanInline url={scanUrl} setUrl={setScanUrl} onScan={scan} scanning={scanning} />
              <Button variant="outline" size="sm" className="h-8" onClick={startEdit}>
                <Pencil className="size-3.5" /> Edit tokens
              </Button>
              <Button size="sm" className="h-8" onClick={confirmTheme} disabled={confirming || active.status === "confirmed"}>
                {confirming ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                {active.status === "confirmed" ? "Confirmed" : "Accept theme"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Detected tokens */}
        <div className="space-y-4">
          <Panel title="Colors">
            <div className="grid grid-cols-2 gap-2.5">
              {COLOR_KEYS.map(({ key, label }) => {
                const val = (c as Record<string, string | undefined>)[key];
                if (!val && !editing) return null;
                return (
                  <div key={key} className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2">
                    {editing ? (
                      <input
                        type="color"
                        value={val ?? "#000000"}
                        onChange={(e) => setColor(key, e.target.value)}
                        className="size-7 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
                        aria-label={label}
                      />
                    ) : (
                      <span className="size-7 shrink-0 rounded-md border border-border" style={{ background: val }} />
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
                      <div className="truncate font-mono text-[11px] text-foreground">{val ?? "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Typography">
            <div style={{ fontFamily: stack(shown!.typography.headingFont) }}>
              <div className="text-[22px] font-bold leading-tight text-foreground" style={{ fontWeight: shown!.typography.headingWeight }}>
                The quick brown fox
              </div>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: stack(shown!.typography.bodyFont) }}>
              Body copy renders in {shown!.typography.bodyFont ?? "the detected body font"}. Headings use {shown!.typography.headingFont ?? "the detected heading font"}.
            </p>
            {shown!.typography.scale?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {shown!.typography.scale.slice(0, 8).map((s, i) => (
                  <span key={i} className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Layout">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Token label="Max width" value={`${shown!.layout.maxWidth}px`} />
              <Token label="Header" value={shown!.layout.headerStyle} />
              <Token label="Section gap" value={`${shown!.layout.sectionSpacing}px`} />
              <Token label="Radius" value={`${shown!.layout.radius}px`} />
            </div>
          </Panel>
        </div>

        {/* Themed preview */}
        <Panel
          title="Themed preview"
          action={
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
              {VIEWPORTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewport(v.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    viewport === v.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={viewport === v.id}
                >
                  <v.icon className="size-3.5" /> {v.label}
                </button>
              ))}
            </div>
          }
        >
          <p className="mb-3 text-[12px] text-muted-foreground">
            A sample page section rendered with your theme tokens — this is how generated pages will feel inside your site.
          </p>
          <div className="flex justify-center overflow-x-auto rounded-xl bg-muted/40 p-4">
            <ThemedPreview profile={shown!} width={VIEWPORTS.find((v) => v.id === viewport)!.width} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- sub-components ---------- */

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Token({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-2.5 py-1.5">
      <div className="text-[10.5px] text-muted-foreground">{label}</div>
      <div className="font-mono text-[12px] capitalize text-foreground">{value}</div>
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const tone = value >= 80 ? "text-positive" : value >= 60 ? "text-warning" : "text-destructive";
  const label = value >= 80 ? "Native fit" : value >= 60 ? "Acceptable" : "Needs review";
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <span className="text-muted-foreground">Confidence</span>
      <span className={cn("font-semibold tabular-nums", tone)}>{value}</span>
      <span className={cn("text-[11px]", tone)}>· {label}</span>
    </span>
  );
}

function RescanInline({ url, setUrl, onScan, scanning }: { url: string; setUrl: (v: string) => void; onScan: () => void; scanning: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background pl-2.5">
      <Globe className="size-3.5 shrink-0 text-muted-foreground" />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onScan()}
        placeholder="Rescan a URL…"
        className="h-7 w-32 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground sm:w-40"
      />
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onScan} disabled={scanning || !url.trim()}>
        {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      </Button>
    </div>
  );
}

function stack(font?: string) {
  return font ? `'${font}', system-ui, -apple-system, sans-serif` : "system-ui, -apple-system, sans-serif";
}

/** Renders a mini landing section using the customer's theme tokens (PRD §7.3 / §11.3). */
function ThemedPreview({ profile, width }: { profile: SiteThemeProfile; width: number | null }) {
  const c = profile.colors;
  const btn = profile.components.button ?? {};
  const card = profile.components.card ?? {};
  const input = profile.components.input ?? {};
  const radius = profile.layout.radius ?? 12;

  const frameStyle: React.CSSProperties = width
    ? { width, maxWidth: "100%" }
    : { width: "100%", maxWidth: profile.layout.maxWidth ? Math.min(profile.layout.maxWidth, 1100) : 1100 };

  return (
    <div
      style={{
        ...frameStyle,
        background: c.background,
        color: c.foreground,
        fontFamily: stack(profile.typography.bodyFont),
        border: `1px solid ${c.border ?? "rgba(0,0,0,0.08)"}`,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
      }}
    >
      {/* Nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: `1px solid ${c.border ?? "rgba(0,0,0,0.06)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, background: c.primary, display: "inline-block" }} />
          <span style={{ fontWeight: 700, fontFamily: stack(profile.typography.headingFont) }}>Brand</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: c.muted ?? c.foreground }}>
          <span>Product</span>
          <span>Pricing</span>
          <Btn small tokens={btn} primary={c.primary}>Get started</Btn>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "32px 18px 8px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 9999,
            background: hexA(c.primary, 0.12),
            color: c.primary,
            marginBottom: 12,
          }}
        >
          AI-search ready
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: width === 375 ? 22 : 30,
            lineHeight: 1.15,
            fontWeight: profile.typography.headingWeight ?? 800,
            fontFamily: stack(profile.typography.headingFont),
          }}
        >
          A page that looks like you built it
        </h1>
        <p style={{ margin: "10px auto 0", maxWidth: 460, fontSize: 14, color: c.muted ?? c.foreground, opacity: 0.85 }}>
          Generated content rendered in your colors, fonts, and components — native to your brand, not a detached template.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <Btn tokens={btn} primary={c.primary}>Book a demo</Btn>
          <Btn tokens={{ background: "transparent", foreground: c.foreground, border: `1px solid ${c.border ?? c.foreground}` }} primary={c.primary} ghost>
            Learn more
          </Btn>
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: width === 375 ? "1fr" : "1fr 1fr",
          gap: profile.layout.gridGap ? Math.min(profile.layout.gridGap, 16) : 12,
          padding: "24px 18px",
        }}
      >
        {["Built for intent", "Native theme fit"].map((t) => (
          <div
            key={t}
            style={{
              background: card.background ?? hexA(c.foreground, 0.03),
              color: card.foreground ?? c.foreground,
              border: card.border ?? `1px solid ${c.border ?? "rgba(0,0,0,0.08)"}`,
              borderRadius: card.radius ?? radius,
              padding: card.padding ?? "16px",
              boxShadow: card.shadow,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, fontFamily: stack(profile.typography.headingFont) }}>{t}</div>
            <div style={{ fontSize: 12.5, color: c.muted ?? c.foreground, opacity: 0.8 }}>
              Matches your site so visitors and AI crawlers see one consistent brand.
            </div>
          </div>
        ))}
      </div>

      {/* Lead form */}
      <div style={{ padding: "8px 18px 28px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexDirection: width === 375 ? "column" : "row",
          }}
        >
          <input
            readOnly
            value="you@company.com"
            style={{
              flex: 1,
              background: input.background ?? c.background,
              color: input.foreground ?? c.foreground,
              border: input.border ?? `1px solid ${c.border ?? "rgba(0,0,0,0.15)"}`,
              borderRadius: input.radius ?? radius,
              padding: input.padding ?? "10px 12px",
              fontSize: 13,
            }}
          />
          <Btn tokens={btn} primary={c.primary}>Subscribe</Btn>
        </div>
      </div>
    </div>
  );
}

function Btn({
  children,
  tokens,
  primary,
  ghost,
  small,
}: {
  children: React.ReactNode;
  tokens: { background?: string; foreground?: string; border?: string; radius?: number; padding?: string; fontWeight?: number };
  primary: string;
  ghost?: boolean;
  small?: boolean;
}) {
  return (
    <button
      style={{
        background: ghost ? (tokens.background ?? "transparent") : (tokens.background ?? primary),
        color: tokens.foreground ?? (ghost ? undefined : "#fff"),
        border: tokens.border ?? "none",
        borderRadius: tokens.radius ?? 10,
        padding: tokens.padding ?? (small ? "6px 12px" : "10px 18px"),
        fontWeight: tokens.fontWeight ?? 600,
        fontSize: small ? 12 : 13.5,
        cursor: "default",
      }}
    >
      {children}
    </button>
  );
}

/** Hex color + alpha → rgba string; passes through non-hex values unchanged. */
function hexA(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const [, r, g, b] = m;
  return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},${alpha})`;
}
