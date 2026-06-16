import type { ReactNode } from "react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import {
  AuthoritySectionNav,
  AUTHORITY_SECTIONS,
  resolveAuthorityView,
} from "@/components/authority/authority-section-nav";
import { CompetitorAnalysisView } from "@/components/competitors/competitor-analysis-view";
import { OpportunitiesView } from "@/components/opportunities/opportunities-view";
import { OpportunityHeaderActions } from "@/components/opportunities/opportunity-actions";

export const dynamic = "force-dynamic";

/**
 * Authority — competitive position and backlink/citation work in one workspace
 * (docs/PRD-workflow-navigation-optimization.md §6.3). A section switcher drives
 * `?view=`, reusing the existing Competitors and Backlink-Opportunities views
 * (the latter carries the outreach drawer + archived-prospect restore, FR4).
 * Overview / Trend / Inventory / Risks fold into Home / Analytics / Alerts as
 * those phases land; `/competitors` and `/opportunities` still work standalone.
 */
export default async function AuthorityPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view = resolveAuthorityView(rawView);
  const meta = AUTHORITY_SECTIONS.find((s) => s.id === view)!;

  let body: ReactNode;
  let actions: ReactNode;
  if (view === "opportunities") {
    const [prospects, brand] = await Promise.all([api.getProspects(), api.getBrandProfile()]);
    body = <OpportunitiesView prospects={prospects} brand={brand} initialQuery="" />;
    actions = <OpportunityHeaderActions />;
  } else {
    body = <CompetitorAnalysisView />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Authority"
        title="Authority"
        description="Build trust and competitive position — competitors, backlink and citation opportunities, and the signals that lift your rankings."
        actions={actions}
      />
      <AuthoritySectionNav active={view} />
      <div className="border-b border-border bg-muted/30 px-6 py-3 sm:px-8">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{meta.title}.</span> {meta.focus}
        </p>
      </div>
      <div className="space-y-5 p-6 sm:p-8">{body}</div>
    </>
  );
}
