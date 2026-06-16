"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

/**
 * Routes a new user through onboarding BEFORE the dashboard — the signup →
 * onboarding → dashboard flow. Belt-and-suspenders behind Clerk's post-signup
 * redirect, which doesn't fire for pre-existing sessions or direct navigation to `/`.
 *
 * - Production: the live API is the source of truth (no mock fallback), so a genuine
 *   `completed:false` redirects; an API error never traps the user.
 * - Demo (no live backend): gate on a first-run localStorage flag so the hosted demo
 *   still shows onboarding first for a new visitor, then never nags again once finished.
 *
 * Skips `/onboarding` itself to avoid a redirect loop.
 */
const MODE = (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo").toLowerCase();
const ONBOARDED_KEY = "geoseo_onboarded";

/** Mark onboarding complete for the demo first-run gate (no-op effect in production). */
export function markOnboarded(): void {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {
    /* storage unavailable (private mode) — production still gates on the API */
  }
}

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname?.startsWith("/onboarding")) return;

    if (MODE === "demo") {
      let done = false;
      try {
        done = window.localStorage.getItem(ONBOARDED_KEY) === "true";
      } catch {
        done = true; // can't read storage → don't trap the visitor
      }
      if (!done) router.replace("/onboarding");
      return;
    }

    let live = true;
    api
      .getOnboardingStatus()
      .then((status) => {
        if (live && status && status.completed === false) router.replace("/onboarding");
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [pathname, router]);

  return null;
}
