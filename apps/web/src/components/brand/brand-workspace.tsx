"use client";

import { useState } from "react";
import { BrainCircuit, History, Gauge, Check, AlertTriangle, ArrowRight, Library, Image as ImageIcon, Palette } from "lucide-react";
import type { BrandProfile, BrandMemoryVersion } from "@geoseo/types";
import { cn } from "@/lib/utils";
import { BrandMemoryEditor } from "./brand-memory-editor";
import { VersionHistory } from "./version-history";
import { BrandLibrary } from "./brand-library";
import { BrandKit } from "./brand-kit";
import { BrandAssets } from "./brand-assets";

type Tab = "overview" | "memory" | "library" | "kit" | "assets" | "versions";
const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "memory", label: "Brand Memory", icon: BrainCircuit },
  { id: "library", label: "Library", icon: Library },
  { id: "kit", label: "Brand Kit", icon: Palette },
  { id: "assets", label: "Assets", icon: ImageIcon },
  { id: "versions", label: "Versions", icon: History },
];

export function BrandWorkspace({
  profile,
  completeness,
  versions,
}: {
  profile: BrandProfile;
  completeness: number;
  versions: BrandMemoryVersion[];
}) {
  // Honor a `?tab=` deep link (e.g. the dashboard "View brand kit" → /brand?tab=kit), read
  // once at init (SSR-safe). Defaults to overview, so no hydration mismatch on the common path.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t && TABS.some((x) => x.id === t) ? (t as Tab) : "overview";
  });

  const topicCount = profile.topics?.length ?? 0;
  const competitorCount = profile.competitors?.length ?? 0;

  // Coverage of the captured brand profile (memory quality gates).
  const coverage: { label: string; ok: boolean }[] = [
    { label: "Brand identity & value prop", ok: Boolean(profile.company && profile.valueProp) },
    { label: "Core topics", ok: topicCount > 0 },
    { label: "Audience", ok: Boolean(profile.audience) },
    { label: "Competitors", ok: competitorCount > 0 },
    { label: "Contact for outreach", ok: Boolean(profile.contactEmail) },
  ];
  const covered = coverage.filter((c) => c.ok).length;

  return (
    <div className="space-y-5">
      {/* tabs */}
      <div
        role="tablist"
        aria-label="Brand workspace sections"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                active
                  ? "bg-brand/12 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Memory strength", value: `${completeness}%` },
              { label: "Core topics", value: topicCount },
              { label: "Competitors", value: competitorCount },
              { label: "Sections covered", value: `${covered}/${coverage.length}` },
            ].map((mc) => (
              <div key={mc.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="text-micro font-semibold uppercase text-muted-foreground">{mc.label}</div>
                <div className="tnum mt-1.5 text-kpi font-semibold text-foreground">{mc.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-h-card font-semibold text-foreground">Memory coverage</h3>
            <p className="mt-0.5 text-label text-muted-foreground">
              Fill these so every generated page and outreach draft is grounded in your business — not invented.
            </p>
            <ul className="mt-3 space-y-1.5">
              {coverage.map((c) => (
                <li key={c.label}>
                  <button
                    onClick={() => setTab("memory")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-label transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    {c.ok ? (
                      <Check className="size-4 text-positive" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
                    )}
                    <span className={cn("flex-1", c.ok ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
                    {!c.ok && (
                      <span className="inline-flex items-center gap-1 text-label font-semibold text-brand">
                        Add <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "memory" && <BrandMemoryEditor initial={profile} />}

      {tab === "library" && <BrandLibrary />}

      {tab === "kit" && <BrandKit />}

      {tab === "assets" && <BrandAssets />}

      {tab === "versions" && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-h-card font-semibold text-foreground">Version history</h3>
          <p className="mt-0.5 text-label text-muted-foreground">Every edit is snapshotted — restore any point in time.</p>
          <div className="mt-3">
            <VersionHistory versions={versions} />
          </div>
        </div>
      )}
    </div>
  );
}
