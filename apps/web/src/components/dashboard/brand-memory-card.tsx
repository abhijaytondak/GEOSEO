"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, ArrowRight, Package, Users, BadgeCheck, MessageSquareWarning, Loader2 } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";

/**
 * Brand Memory entry point on the dashboard. Surfaces the single source of truth the AI
 * uses — strength, what's captured (products / personas / proof / corrections), and a
 * brand-color preview — with a one-click path into the Brand Memory workspace.
 * Self-fetching so it drops onto Home without changing its server load.
 */
interface Lib {
  products: unknown[];
  personas: unknown[];
  proofPoints: unknown[];
  corrections?: unknown[];
}

export function BrandMemoryCard() {
  const [lib, setLib] = useState<Lib | null | undefined>(undefined);
  const [strength, setStrength] = useState(0);
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    fetch("/api/v1/brand-library", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        setLib(j?.data?.library ?? null);
        setStrength(j?.data?.strength ?? 0);
      })
      .catch(() => live && setLib(null));
    fetch("/api/v1/site-theme", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        const profiles = j?.data?.profiles ?? [];
        const t = profiles.find((p: { status: string }) => p.status === "confirmed") ?? profiles[0];
        const c = t?.colors ?? {};
        setColors([c.primary, c.accent, c.secondary, c.foreground, c.muted].filter(Boolean).slice(0, 5));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const stats = [
    { icon: Package, label: "Products", value: lib?.products?.length ?? 0 },
    { icon: Users, label: "Personas", value: lib?.personas?.length ?? 0 },
    { icon: BadgeCheck, label: "Proof", value: lib?.proofPoints?.length ?? 0 },
    { icon: MessageSquareWarning, label: "Corrections", value: lib?.corrections?.length ?? 0 },
  ];

  return (
    <Panel
      title="Brand Memory"
      description="The single source of truth the AI uses for every page, lead, and analysis."
      action={
        <Link href="/brand" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
          Open <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {lib === undefined ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4">
          {/* strength */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <BrainCircuit className="size-4 text-brand" /> Memory strength
              </span>
              <span className="tnum font-semibold text-foreground">{strength}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${strength}%` }} />
            </div>
          </div>

          {/* what's captured */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-border bg-surface-sunken p-2.5 text-center">
                  <Icon className="mx-auto size-4 text-muted-foreground" />
                  <div className="tnum mt-1 text-[18px] font-bold text-foreground">{s.value}</div>
                  <div className="text-[10.5px] text-muted-foreground">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* brand colors preview */}
          {colors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-muted-foreground">Brand kit</span>
              <div className="flex gap-1">
                {colors.map((c, i) => (
                  <span key={i} className="size-5 rounded-md ring-1 ring-inset ring-black/10" style={{ background: c }} title={c} />
                ))}
              </div>
              <Link href="/brand?tab=kit" className="ml-auto text-[11.5px] font-medium text-brand hover:underline">
                View brand kit
              </Link>
            </div>
          )}

          <Link
            href="/brand"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[13px] font-semibold text-foreground hover:bg-muted"
          >
            <BrainCircuit className="size-4" /> Manage Brand Memory
          </Link>
        </div>
      )}
    </Panel>
  );
}
