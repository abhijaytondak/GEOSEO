"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RankPoint } from "@geoseo/types";
import { shortDate } from "@/lib/format";
import { ChartTooltip } from "./chart-tooltip";

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  last: number;
  color: string;
};

/** A glowing "live" dot rendered only at the latest data point. */
function LeadingDot({ cx, cy, index, last, color }: DotProps) {
  if (index !== last || cx == null || cy == null) return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--card)" strokeWidth={2} />
    </g>
  );
}

export function RankChart({ data }: { data: RankPoint[] }) {
  const series = data.map((p) => ({ date: shortDate(p.date), rank: p.rank }));
  const best = Math.max(1, Math.floor(Math.min(...data.map((d) => d.rank)) - 2));
  const worst = Math.ceil(Math.max(...data.map((d) => d.rank)) + 2);
  const last = series.length - 1;

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="rank-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="55%" stopColor="#6C4CF1" />
              <stop offset="100%" stopColor="#4B86FF" />
            </linearGradient>
            <linearGradient id="rank-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C4CF1" stopOpacity={0.26} />
              <stop offset="55%" stopColor="#6C4CF1" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#6C4CF1" stopOpacity={0} />
            </linearGradient>
            <filter id="rank-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6C4CF1" floodOpacity="0.35" />
            </filter>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="2 7" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={48}
            tickMargin={10}
            tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            reversed
            domain={[best, worst]}
            tickLine={false}
            axisLine={false}
            width={34}
            tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => `#${v}`}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(v) => `#${v}`} />}
            cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey="rank"
            name="Avg rank"
            stroke="url(#rank-stroke)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#rank-glow)"
            isAnimationActive={false}
            dot={(p) => (
              <LeadingDot key={`rank-${p.index}`} cx={p.cx} cy={p.cy} index={p.index} last={last} color="#6C4CF1" />
            )}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "#6C4CF1" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
