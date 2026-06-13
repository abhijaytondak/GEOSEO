/** Compact number formatting for metrics + tables. */
export function compact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function thousands(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function pct(n: number, dp = 1): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(dp)}%`;
}

/** "3h ago", "2d ago" from an ISO timestamp, relative to a fixed anchor. */
const ANCHOR = new Date("2026-06-12T00:00:00Z").getTime();
export function relativeTime(iso: string): string {
  const diffMs = ANCHOR - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

/** Short date label "Jun 12" for chart axes. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
