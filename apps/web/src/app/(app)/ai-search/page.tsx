import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { AiSearchView } from "@/components/ai-search/ai-search-view";

export const dynamic = "force-dynamic";

export default async function AiSearchPage() {
  const [overview, mentions, botActivity] = await Promise.all([
    api.getAiSearchOverview(),
    api.getAiMentions(),
    api.getAiBotActivity(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Solutions"
        title="AI Search Engine"
        description="Turn buyer searches across Google and AI engines into published pages, citations, and qualified leads."
      />
      <div className="p-6 sm:p-8">
        <AiSearchView overview={overview} mentions={mentions} botActivity={botActivity} />
      </div>
    </>
  );
}
