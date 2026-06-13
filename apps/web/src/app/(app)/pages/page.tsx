import Link from "next/link";
import { Sparkles } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { PageHeader } from "@/components/shell/page-header";
import { PagesView } from "@/components/pages/pages-view";
import { PublishingSettings } from "@/components/pages/publishing-settings";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const [pages, opportunities, blueprints, recommendations] = await Promise.all([
    pageEngineApi.getPages(),
    pageEngineApi.getOpportunities(),
    pageEngineApi.getBlueprints(),
    pageEngineApi.getRefreshRecommendations(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Pages"
        description="Buyer-intent opportunities become approved blueprints, AI-drafted pages, and published, AI-search-ready content."
        actions={
          <>
            <PublishingSettings />
            <Link href="/research">
              <Button className="h-9 rounded-full px-4">
                <Sparkles className="size-4" />
                Discover opportunities
              </Button>
            </Link>
          </>
        }
      />
      <div className="p-6 sm:p-8">
        <PagesView
          pages={pages}
          opportunities={opportunities}
          blueprints={blueprints}
          recommendations={recommendations}
        />
      </div>
    </>
  );
}
