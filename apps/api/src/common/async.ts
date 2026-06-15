import { Logger } from "@nestjs/common";

/**
 * Build the per-provider reject logger for a fan-out aggregate. Usage:
 *   const warn = degradeLogger(this.log, "overview/authority");
 *   const health = settled(healthR, NEUTRAL_HEALTH, warn("domain-health"));
 * Centralizes the `reason → message` formatting so the three degradation sites
 * don't each re-implement it.
 */
export function degradeLogger(log: Logger, scope: string) {
  return (name: string) =>
    (reason: unknown) =>
      log.warn(`${scope}: ${name} unavailable (${reason instanceof Error ? reason.message : "unknown"}) — degraded`);
}

/**
 * Unwrap one `Promise.allSettled` result, returning `fallback` (and optionally
 * logging) when the underlying call rejected.
 *
 * Lets dashboard aggregates that fan out over several provider calls degrade to
 * partial-but-valid data instead of 500-ing the whole response when a single
 * provider fails — the same "never throw, safe fallback" philosophy the env-gated
 * seams already follow. `F` defaults to `T` but may widen (e.g. a `null` fallback
 * for an object provider).
 */
export function settled<T, F = T>(
  result: PromiseSettledResult<T>,
  fallback: F,
  onReject?: (reason: unknown) => void,
): T | F {
  if (result.status === "fulfilled") return result.value;
  onReject?.(result.reason);
  return fallback;
}
