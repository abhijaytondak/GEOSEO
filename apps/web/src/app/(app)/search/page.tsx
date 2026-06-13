import { api } from "@/lib/api-client";
import type { SearchEntityType } from "@geoseo/types";
import { PageHeader } from "@/components/shell/page-header";
import { SearchResultsView } from "@/components/search/search-results-view";

export const dynamic = "force-dynamic";

const ENTITY_TYPES: SearchEntityType[] = [
  "prospect",
  "outreach",
  "tracked-page",
  "alert",
  "content",
  "brand",
  "setting",
  "page-opportunity",
  "generated-page",
  "lead",
  "job",
  "audit",
  "command",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const query = q ?? "";
  const scope = type && ENTITY_TYPES.includes(type as SearchEntityType) ? (type as SearchEntityType) : undefined;

  // Seed initial results on the server so the page paints without a loading flash.
  const initial = query.trim()
    ? await api.search(query, { type: scope, limit: 50 })
    : { results: [], total: 0, facets: [], suggestions: [] };

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Search"
        description="Find any page, prospect, alert, lead, content item, job, or setting — and act on it."
      />
      <div className="p-6 sm:p-8">
        <SearchResultsView
          initialQuery={query}
          initialType={scope}
          initialResults={initial.results}
          initialFacets={initial.facets}
          initialTotal={initial.total}
        />
      </div>
    </>
  );
}
