"use client";

/**
 * Onboarding completion marker for the first-run gate.
 *
 * The redirect decision now happens SERVER-SIDE in `app/(app)/layout.tsx` (so an
 * unonboarded user never sees a dashboard-shell flash — PRD R1). Demo mode reads the
 * `geoseo_onboarded` cookie; production reads the live API. This module just records
 * completion on BOTH a cookie (server-readable) and localStorage (back-compat), client-side.
 */
const ONBOARDED_KEY = "geoseo_onboarded";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Cookie name the server layout reads to gate the demo onboarding flow. */
export const ONBOARDED_COOKIE = ONBOARDED_KEY;

/** Mark onboarding complete for the first-run gate (cookie + localStorage). */
export function markOnboarded(): void {
  try {
    document.cookie = `${ONBOARDED_KEY}=true; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  } catch {
    /* document unavailable */
  }
  try {
    window.localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {
    /* storage unavailable (private mode) — production still gates on the API */
  }
}
