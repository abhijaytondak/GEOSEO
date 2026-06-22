"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ImpressionPoint } from "@geoseo/types";
import { compact, shortDate } from "@/lib/format";
import { ChartTooltip } from "./chart-tooltip";

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  last: number;
  color: string;
};

function LeadingDot({ cx, cy, index, last, color }: DotProps) {
  if (index !== last || cx == null || cy == null) return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
    </g>
  );
}

export function TrafficChart({ data }: { data: ImpressionPoint[] }) {
  const series = data.map((p) => ({
    date: shortDate(p.date),
    impressions: p.impressions,
    clicks: p.clicks,
  }));
  const last = series.length - 1;

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="impr-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-2)" />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="impr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.24} />
              <stop offset="60%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicks-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-3)" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="clicks-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
            </linearGradient>
            <filter id="impr-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--chart-2)" floodOpacity="0.3" />
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
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={38}
            tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => compact(v)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={38}
            tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => compact(v)}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="plainline"
            iconSize={14}
            wrapperStyle={{ fontSize: 11.5, color: "var(--muted-foreground)" }}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(v) => v.toLocaleString()} />}
            cursor={{ stroke: "var(--chart-2)", strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.5 }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="impressions"
            name="Impressions"
            stroke="url(#impr-stroke)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#impr-fill)"
            filter="url(#impr-glow)"
            isAnimationActive={false}
            dot={(p) => (
              <LeadingDot key={`impr-${p.index}`} cx={p.cx} cy={p.cy} index={p.index} last={last} color="var(--chart-2)" />
            )}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "#2D6BFF" }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="url(#clicks-stroke)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#clicks-fill)"
            isAnimationActive={false}
            dot={(p) => (
              <LeadingDot key={`clicks-${p.index}`} cx={p.cx} cy={p.cy} index={p.index} last={last} color="var(--chart-3)" />
            )}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "#10B981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
