"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function HealthGauge({
  score,
  grade,
  size = 168,
}: {
  score: number;
  grade: string;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // No backlink/authority data connected yet → show an honest "not measured"
  // state instead of a 0/grade-D gauge that reads like a failing score.
  const notMeasured = score <= 0;

  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // 270° arc (gap at the bottom)
  const arc = 0.75;
  const dash = c * arc;
  const target = dash * (score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--chart-2)" />
            <stop offset="55%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--chart-6)" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        {/* value — omitted entirely when not measured so the round line-cap
            doesn't leave a stray dot on an empty gauge */}
        {!notMeasured && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${mounted ? target : 0} ${c}`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "tnum font-bold leading-none tracking-[-0.02em] text-foreground",
            notMeasured ? "text-[32px] text-muted-foreground" : "text-[40px]",
          )}
        >
          {notMeasured ? "—" : score}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {notMeasured ? "Not measured" : `Health · ${grade}`}
        </span>
      </div>
    </div>
  );
}
