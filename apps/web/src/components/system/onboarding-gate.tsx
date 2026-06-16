"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

/**
 * Forces a signed-up-but-not-onboarded user through the onboarding wizard so the
 * dashboard is never shown empty/un-analyzed (the "no onboarding journey after
 * signup" gap). Belt-and-suspenders behind Clerk's post-signup redirect, which
 * doesn't fire for pre-existing sessions or direct navigation to `/`.
 *
 * Deliberately a no-op in demo mode: there the API client falls back to mock data
 * and `getOnboardingStatus()` always reports `completed:false`, so enforcing would
 * trap demo visitors on a wizard that can't complete without a live backend.
 * In production the client surfaces errors instead of falling back, so a `false`
 * here is genuine. Skips `/onboarding` itself to avoid a redirect loop.
 */
const MODE = (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo").toLowerCase();

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (MODE === "demo") return;
    if (pathname?.startsWith("/onboarding")) return;
    let live = true;
    api
      .getOnboardingStatus()
      .then((status) => {
        if (live && status && status.completed === false) router.replace("/onboarding");
      })
      .catch(() => undefined); // API error → don't trap the user; surface elsewhere
    return () => {
      live = false;
    };
  }, [pathname, router]);

  return null;
}
