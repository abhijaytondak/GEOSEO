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
  const series = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height }} className="w-full">
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
