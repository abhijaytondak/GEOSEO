"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";

export function Sparkline({
  data,
  color = "var(--brand)",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");

  // Guard empty/degenerate data: never hand recharts an empty series (it can
  // throw on scale computation). Render a flat hairline baseline instead so the
  // decoration still reserves its slot crisply.
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex w-full items-center" aria-hidden="true">
        <div className="h-px w-full bg-border" />
      </div>
    );
  }

  const series = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height }} className="w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
