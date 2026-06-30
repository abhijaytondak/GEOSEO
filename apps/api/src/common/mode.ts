/**
 * Runtime product mode (PRD §3). Demo is sales-safe (no external creds required);
 * production/staging may use real persistence + integrations behind auth.
 *
 * Resolution: explicit `GEOSEO_MODE` wins; otherwise a configured `DATABASE_URL`
 * implies a real deployment ("production"), and a bare process is "demo".
 */
export type AppMode = "demo" | "staging" | "production";

export function resolveMode(): AppMode {
  const explicit = process.env.GEOSEO_MODE?.toLowerCase();
  if (explicit === "production" || explicit === "staging" || explicit === "demo") {
    return explicit;
  }
  return process.env.DATABASE_URL ? "production" : "demo";
}

export function persistenceKind(): "postgres" | "memory" {
  return process.env.DATABASE_URL ? "postgres" : "memory";
}

/** True when auth must be enforced. Demo defaults off; prod/staging default on. */
export function authRequired(mode: AppMode = resolveMode()): boolean {
  if (process.env.API_AUTH_REQUIRED === "false") return false;
  if (process.env.API_AUTH_REQUIRED === "true") return true;
  return mode !== "demo";
}

/**
 * Fail fast if a production/staging boot is missing the security config it needs
 * (PRD §3.2 / §9.2). Demo mode never blocks. Throws so `bootstrap()` aborts.
 */
export function assertModeConfig(mode: AppMode = resolveMode()): void {
  if (mode === "demo") return;
  // Fail-closed: auth cannot be explicitly disabled outside demo mode (P0.1).
  if (process.env.API_AUTH_REQUIRED === "false") {
    throw new Error(
      `GEOSEO_MODE=${mode} cannot run with API_AUTH_REQUIRED=false — auth may only be ` +
        `disabled in demo mode. Set GEOSEO_MODE=demo for an open beta, or remove the flag.`,
    );
  }
  if (authRequired(mode) && !process.env.DEV_API_TOKEN && !process.env.CLERK_SECRET_KEY) {
    throw new Error(
      `GEOSEO_MODE=${mode} requires auth config: set DEV_API_TOKEN or CLERK_SECRET_KEY, ` +
        `or API_AUTH_REQUIRED=false to explicitly run unauthenticated.`,
    );
  }
}

/** True when this process is running on a managed hosting platform (Render/Vercel/Railway/Fly),
 *  i.e. a real public deployment rather than a local dev box. */
export function isHostedDeployment(): boolean {
  return Boolean(
    process.env.RENDER ||
      process.env.VERCEL ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.FLY_APP_NAME ||
      process.env.GEOSEO_HOSTED === "true",
  );
}

/**
 * Incident invariant (deep-audit 2026-06-24): a **hosted** deployment that **persists** to a
 * real database must NOT serve the application API **unauthenticated** — that is exactly the
 * "public demo auth + persistent customer data" exposure observed in production. This fires
 * regardless of GEOSEO_MODE (so an explicit `GEOSEO_MODE=demo` can't reopen the hole on a
 * hosted, DB-backed box). Local dev (no hosting env) is unaffected; a deliberate hosted open
 * beta requires the loud, explicit `GEOSEO_ALLOW_OPEN_PERSISTENT=true` opt-in. Throws so
 * `bootstrap()` aborts (better offline than leaking). Acceptance test #7.
 */
export function assertHostedAuthInvariant(): void {
  const hosted = isHostedDeployment();
  const persistent = Boolean(process.env.DATABASE_URL);
  if (hosted && persistent && !authRequired()) {
    if (process.env.GEOSEO_ALLOW_OPEN_PERSISTENT === "true") {
      // Conscious, logged override — the operator accepts an open + persistent deployment.
      // eslint-disable-next-line no-console
      console.warn(
        "[mode] ⚠️ HOSTED + DATABASE_URL + auth disabled, allowed only by " +
          "GEOSEO_ALLOW_OPEN_PERSISTENT=true. The application API is PUBLIC and persisting data.",
      );
      return;
    }
    throw new Error(
      "Refusing to boot: a hosted, database-backed deployment must not serve the application " +
        "API unauthenticated (deep-audit 2026-06-24). Enable auth (production Clerk keys or " +
        "DEV_API_TOKEN with API_AUTH_REQUIRED=true), or — to consciously run an open, persistent " +
        "beta — set GEOSEO_ALLOW_OPEN_PERSISTENT=true.",
    );
  }
}

/**
 * Fail-closed persistence (No-Dummy-Data PRD §6.4). In production/staging the API
 * must NOT run on in-memory state: a missing `DATABASE_URL` aborts boot, and a
 * missing `REDIS_URL` aborts unless `ALLOW_INMEMORY_QUEUE=true` is explicitly set
 * (so jobs can't silently simulate completion). Demo mode is unaffected.
 * (DB *reachability* is asserted separately in bootstrap via an async ping.)
 */
export function assertPersistenceConfig(mode: AppMode = resolveMode()): void {
  if (mode === "demo") return;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      `GEOSEO_MODE=${mode} requires DATABASE_URL — refusing to run on in-memory state in production.`,
    );
  }
  if (!process.env.REDIS_URL && process.env.ALLOW_INMEMORY_QUEUE !== "true") {
    throw new Error(
      `GEOSEO_MODE=${mode} requires REDIS_URL for durable jobs. Set REDIS_URL, or ` +
        `ALLOW_INMEMORY_QUEUE=true to explicitly accept a non-durable in-memory queue.`,
    );
  }
}
