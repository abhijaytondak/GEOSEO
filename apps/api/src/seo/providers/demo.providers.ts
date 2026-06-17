/**
 * DEMO-ONLY providers — the single place the API may touch `@geoseo/mock`
 * (No-Dummy-Data §6.1). Loaded by `seo.module.ts` via dynamic import ONLY when
 * `resolveMode() === "demo"`, so mock code is never loaded or bound in production.
 *
 * This file is allowlisted in `apps/api/scripts/audit-no-mock-production.mjs`.
 * Never import `@geoseo/mock` from any other API module.
 */
export { seoProvider, brandSource, outreachDrafter } from "@geoseo/mock";
