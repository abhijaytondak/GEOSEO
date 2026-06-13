"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import type { KpiMetric } from "@geoseo/types";
import { DeltaChip } from "./delta-chip";
import { Sparkline } from "./sparkline";

const ACCENT: Record<string, string> = {
  "total-backlinks": "var(--chart-1)",
  "avg-rank": "var(--chart-2)",
  "domain-authority": "var(--chart-3)",
  "ai-visibility": "var(--chart-4)",
};

function useCountUp(target: number, decimals: number, play: boolean, reduce: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    // Reduced-motion (render target directly) or not-yet-in-view → no animation,
    // so no synchronous setState in the effect body.
    if (!play || reduce) return;
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [target, play, reduce]);
  // prefers-reduced-motion jumps straight to the final value.
  return (reduce ? target : val).toFixed(decimals);
}

export function KpiCard({ kpi, index = 0 }: { kpi: KpiMetric; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const decimals = kpi.value % 1 !== 0 ? 1 : 0;
  const display = useCountUp(kpi.value, decimals, inView, !!reduce);
  const color = ACCENT[kpi.id] ?? "var(--brand)";

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float"
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {kpi.label}
        </span>
        <DeltaChip delta={kpi.delta} />
      </div>

      <div className="mt-3 flex items-end gap-1">
        {kpi.prefix && (
          <span className="mb-1 text-xl font-semibold text-muted-foreground">
            {kpi.prefix}
          </span>
        )}
        <span className="tnum text-[32px] font-bold leading-none tracking-[-0.02em] text-foreground">
          {display}
        </span>
        {kpi.unit && (
          <span className="mb-1 text-sm font-medium text-muted-foreground">
            {kpi.unit}
          </span>
        )}
      </div>

      <div className="mt-1 text-[12px] text-muted-foreground">{kpi.caption}</div>

      <div className="mt-3 -mx-1">
        <Sparkline data={kpi.spark} color={color} height={36} />
      </div>
    </div>
  );
}
