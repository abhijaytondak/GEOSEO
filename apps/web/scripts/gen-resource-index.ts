/**
 * Generator: emits the body-free src/components/resources/resource-index.ts from the
 * authored CONTENT map. The /resources hub + sitemap import the index (not content.ts)
 * so article bodies never enter their module graph (perf: smaller server graph + payload).
 *
 * Run after adding/editing articles:  pnpm --filter @geoseo/web gen:resource-index
 * (or:  cd apps/web && tsx scripts/gen-resource-index.ts)
 *
 * A build-time drift guard in content.ts fails `next build` if this is stale.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { CONTENT } from "../src/components/resources/content";

const here = dirname(fileURLToPath(import.meta.url));
const dest = resolve(here, "../src/components/resources/resource-index.ts");

const rows = Object.keys(CONTENT)
  .sort()
  .map((s) => {
    const a = CONTENT[s];
    return `  ${JSON.stringify(s)}: { metaDescription: ${JSON.stringify(a.metaDescription)}, updated: ${JSON.stringify(a.updated)}, readMins: ${a.readMins} },`;
  });

const out = `// AUTO-GENERATED from content.ts — body-free metadata for the /resources hub + sitemap.
// Do NOT hand-edit; regenerate via scripts/gen-resource-index.ts (a build guard in content.ts
// fails the build if this drifts). The hub/sitemap import THIS, not content.ts, so authored
// article bodies never enter their module graph.

export interface ResourceMeta {
  metaDescription: string;
  /** ISO date — sitemap lastModified. */
  updated: string;
  readMins: number;
}

export const RESOURCE_INDEX: Record<string, ResourceMeta> = {
${rows.join("\n")}
};

/** Slugs of every published article (body-free). */
export const PUBLISHED_SLUGS: string[] = Object.keys(RESOURCE_INDEX);
`;

writeFileSync(dest, out);
console.log(`wrote ${rows.length} entries → ${dest}`);
