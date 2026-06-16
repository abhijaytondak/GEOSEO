import { Logger } from "@nestjs/common";

/**
 * Observability seam (PRD §15.1). **Dependency-free + env-gated:** Sentry is loaded
 * via a dynamic, non-statically-resolvable import so the package is optional — if
 * `@sentry/node` isn't installed or `SENTRY_DSN` is unset, every call no-ops. This
 * keeps the monorepo install unchanged (no collision with concurrent edits) while
 * letting an operator turn on error monitoring by adding the dep + DSN.
 */

const log = new Logger("observability");
let sentry: { captureException: (e: unknown, hint?: unknown) => void } | null = null;
let initStarted = false;

async function ensureSentry(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // Variable specifier → not statically resolved by tsc/esbuild, so the dep stays optional.
    const spec = "@sentry/node";
    const mod = (await import(spec)) as {
      init: (o: Record<string, unknown>) => void;
      captureException: (e: unknown, hint?: unknown) => void;
    };
    mod.init({
      dsn,
      environment: process.env.GEOSEO_MODE ?? "production",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
    });
    sentry = { captureException: mod.captureException };
    log.log("Sentry initialised");
  } catch {
    log.warn("SENTRY_DSN set but @sentry/node is not installed — error monitoring disabled.");
  }
}

/** Report an error to Sentry when configured; always safe to call. */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  void ensureSentry().then(() => sentry?.captureException(err, context ? { extra: context } : undefined));
}

export const observabilityEnabled = (): boolean => Boolean(process.env.SENTRY_DSN);
