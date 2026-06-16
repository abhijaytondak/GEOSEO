import { PageHeader } from "@/components/shell/page-header";
import { BillingView } from "@/components/billing/billing-view";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Billing & plans"
        description="Manage your subscription. Plans and limits are enforced per workspace; checkout is powered by Stripe."
      />
      <div className="p-6 sm:p-8">
        <BillingView />
      </div>
    </>
  );
}
