import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
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

  // Real workspace identity drives the topbar — but it is NON-critical chrome, so we DON'T
  // block the whole shell on the /settings read. Kick it off here and stream it into the
  // topbar via <Suspense>: the sidebar + main content (children) paint immediately while
  // the workspace name fills in. (Previously this `await` serialized the entire response
  // behind a ~430ms settings read on every app navigation — perf audit P0.)
  const workspaceNamePromise = api
    .getSettings()
    .then((s) => s.profile?.workspaceName)
    .catch(() => undefined);

  // ClerkProvider is scoped to the gated product app (and the auth routes) so the
  // public marketing/feeds pages never load Clerk client JS. The topbar's Clerk
  // components (UserButton/SignInButton/Show) sit inside this provider.
  return (
    <ClerkProvider>
      <AppFeedbackProvider>
        <div className="flex h-dvh overflow-hidden bg-background">
          <Sidebar className="hidden lg:flex" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Suspense fallback={<Topbar />}>
              <WorkspaceTopbar workspaceNamePromise={workspaceNamePromise} />
            </Suspense>
            <DegradedBanner />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
        <CommandPalette />
      </AppFeedbackProvider>
    </ClerkProvider>
  );
}

/** Streams the workspace name into the topbar without blocking the shell render. */
async function WorkspaceTopbar({
  workspaceNamePromise,
}: {
  workspaceNamePromise: Promise<string | undefined>;
}) {
  const workspaceName = await workspaceNamePromise;
  return <Topbar workspaceName={workspaceName} />;
}
