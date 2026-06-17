/**
 * DEMO-ONLY Page Engine fixtures (No-Dummy-Data §6.1, P0-3). The only `@geoseo/mock`
 * importer among the page-engine modules — loaded by `PageEngineStore` via dynamic
 * import ONLY when `resolveMode() === "demo"`, so a production workspace starts empty
 * and is populated by onboarding/provider discovery, never by demo fixtures.
 *
 * Allowlisted in `apps/api/scripts/audit-no-mock-production.mjs`.
 */
export { generatedPages, keywordOpportunities, leads, pageBlueprints } from "@geoseo/mock";
