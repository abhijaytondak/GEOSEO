import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { AppFeedbackProvider } from "@/components/system/app-feedback";
import { DegradedBanner } from "@/components/system/degraded-banner";
import { ONBOARDED_COOKIE } from "@/components/system/onboarding-gate";
import { api } from "@/lib/api-client";

const MODE = (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo").toLowerCase();

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Resolve onboarding state on the SERVER and redirect BEFORE rendering the shell, so
  // an unonboarded user never sees a dashboard-shell flash (PRD R1). Demo: per-browser
  // cookie (set by markOnboarded). Production: the live API (source of truth).
  let onboarded = true;
  if (MODE === "demo") {
    const jar = await cookies();
    const cookieDone = jar.get(ONBOARDED_COOKIE)?.value === "true";
    if (cookieDone) {
      onboarded = true;
    } else {
      // Cookie absent: fall back to API (handles cleared cookies / different browsers).
      // Fail-open so a transient API error doesn't trap users who already completed setup.
      onboarded = await api
        .getOnboardingStatus()
        .then((s) => s.completed !== false)
        .catch(() => true);
    }
  } else {
    onboarded = await api
      .getOnboardingStatus()
      .then((s) => s.completed !== false)
      .catch(() => true); // fail-open: a transient API error must not trap onboarded users
  }
  if (!onboarded) redirect("/onboarding");

  // Real workspace identity (Brand Memory / onboarding) drives the topbar — no demo brand.
  const workspaceName = await api
    .getSettings()
    .then((s) => s.profile?.workspaceName)
    .catch(() => undefined);

  return (
    <AppFeedbackProvider>
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
