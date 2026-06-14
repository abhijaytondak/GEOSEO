import { PageHeader } from "@/components/shell/page-header";
import { ConversionAuditView } from "@/components/conversion/conversion-audit-view";

export default function ConversionAuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="Lead Conversion"
        title="Conversion Audit"
        description="Score any page's conversion readiness — lead capture, CTA, headline, social proof, and mobile — with concrete fixes."
      />
      <div className="p-6 sm:p-8">
        <ConversionAuditView />
      </div>
    </>
  );
}
