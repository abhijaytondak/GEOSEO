import Link from "next/link";
import { Sparkles } from "lucide-react";
import { pageEngineApi } from "@/lib/page-engine-client";
import { PageHeader } from "@/components/shell/page-header";
import { PagesView } from "@/components/pages/pages-view";
import { PublishingSettings } from "@/components/pages/publishing-settings";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  // Only the page list is above-the-fold, so it's the lone blocking fetch — TTFB no longer
  // waits on the slower opportunities/blueprints/recommendations reads (perf audit P1).
  // PagesView fetches those client-side after paint (each is behind a toggle/selection).
  const pages = await pageEngineApi.getPages();

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
        <PagesView pages={pages} />
      </div>
    </>
  );
}
