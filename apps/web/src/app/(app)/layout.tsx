import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { AppFeedbackProvider } from "@/components/system/app-feedback";
import { DegradedBanner } from "@/components/system/degraded-banner";
import { OnboardingGate } from "@/components/system/onboarding-gate";
import { api } from "@/lib/api-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Real workspace identity (Brand Memory / onboarding) drives the topbar — no demo brand.
  const workspaceName = await api
    .getSettings()
    .then((s) => s.profile?.workspaceName)
    .catch(() => undefined);

  return (
    <AppFeedbackProvider>
      <OnboardingGate />
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar workspaceName={workspaceName} />
          <DegradedBanner />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </AppFeedbackProvider>
  );
}
