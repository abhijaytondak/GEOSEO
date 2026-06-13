import { PageHeader } from "@/components/shell/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Onboarding"
        description="Scan your site, confirm Brand Memory, connect publishing, and seed your first buyer-intent opportunities."
      />
      <div className="p-6 sm:p-8">
        <OnboardingWizard />
      </div>
    </>
  );
}
