import { AppFeedbackProvider } from "@/components/system/app-feedback";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

/**
 * Full-page onboarding — top-level route (outside the (app) shell), so there's no
 * sidebar/topbar to navigate away from. The (app) layout's OnboardingGate redirects
 * unonboarded users here; the platform isn't reachable until setup completes
 * (markOnboarded fires on finish).
 */
export default function OnboardingPage() {
  return (
    <AppFeedbackProvider>
      <main className="min-h-dvh w-full bg-card">
        <OnboardingWizard />
      </main>
    </AppFeedbackProvider>
  );
}
