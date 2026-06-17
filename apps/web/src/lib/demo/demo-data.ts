/**
 * DEMO-ONLY data source — the single place the web bundle may touch `@geoseo/mock`.
 *
 * No-Dummy-Data PRD §6.1: production runtime must not serve mock data. The clients
 * that re-export this (`api-client.ts`, `page-engine-client.ts`) only ever call these
 * providers from a fallback path gated behind `FALLBACK_ALLOWED` (demo/build mode);
 * in production/staging those fallbacks throw instead, so nothing here is reachable.
 *
 * This file is the ONLY allowlisted `@geoseo/mock` importer in `apps/web/src`
 * (see `apps/api/scripts/audit-no-mock-production.mjs` ALLOWLIST). Keep it that way:
 * never import `@geoseo/mock` directly from a production client/component.
 */
export { seoProvider, brandSource, outreachDrafter, pageEngine } from "@geoseo/mock";
