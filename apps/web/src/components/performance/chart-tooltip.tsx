"use client";

import type { TooltipProps } from "recharts";

/** Series now use gradient strokes (url(#…)), which aren't valid CSS colors for
 *  the legend dot — resolve to the solid base color by series name. */
const DOT_COLOR: Record<string, string> = {
  "Avg rank": "#6C4CF1",
  Impressions: "#2D6BFF",
  Clicks: "#10B981",
};

function dotColor(name?: string, fallback?: string): string {
  if (name && DOT_COLOR[name]) return DOT_COLOR[name];
  if (fallback && !fallback.startsWith("url(")) return fallback;
  return "var(--brand)";
}

/** Shared recharts tooltip — card surface, hairline border, tabular values. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueFormatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-float">
      {label && (
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</div>
      )}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="size-2 rounded-full"
              style={{ background: dotColor(p.name as string, p.color as string) }}
            />
            <span className="capitalize text-muted-foreground">{p.name}</span>
            <span className="tnum ml-auto font-semibold text-foreground">
              {valueFormatter
                ? valueFormatter(p.value as number, p.name as string)
                : (p.value as number)?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
