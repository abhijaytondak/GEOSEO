import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { ContentView } from "@/components/content/content-view";
import { ContentHeaderActions } from "@/components/content/content-actions";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [pages, suggestions] = await Promise.all([
    api.getTrackedPages(),
    api.getInternalLinkSuggestions(),
  ]);
  const stalePageIds = pages
    .map((page, index) => ({ id: page.id, days: 14 + ((index * 37) % 120) }))
    .filter((page) => page.days > 90)
    .map((page) => page.id);

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Content Optimization"
        description="AI-driven content refresh, internal-linking intelligence, and stale-page detection across your tracked pages."
        actions={<ContentHeaderActions stalePageIds={stalePageIds} />}
      />

      <div className="p-6 sm:p-8">
        <ContentView pages={pages} suggestions={suggestions} />
      </div>
    </>
  );
}
