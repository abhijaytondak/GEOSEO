/** Deterministic helpers so the demo renders identically every load. */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed "today" anchor — keeps generated date series stable across reloads. */
export const ANCHOR = new Date("2026-06-12T00:00:00Z");

/** ISO date (YYYY-MM-DD) for `daysAgo` days before the anchor. */
export function daysAgo(n: number): string {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Full ISO timestamp `hoursAgo` hours before the anchor. */
export function hoursAgo(n: number): string {
  const d = new Date(ANCHOR);
  d.setUTCHours(d.getUTCHours() - n);
  return d.toISOString();
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
