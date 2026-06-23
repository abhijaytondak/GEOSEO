/**
 * Product-analytics seam (PRD §15.1). **Env-gated + dependency-free:** PostHog is
 * loaded via a dynamic, non-statically-resolved import, so `posthog-js` is optional —
 * with no `NEXT_PUBLIC_POSTHOG_KEY` set (or the package absent) every call no-ops.
 * Lets us instrument the onboarding/activation funnel without changing the install or
 * colliding with concurrent edits. Mount `initAnalytics()` once on the client when ready.
 */

type PostHog = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
};

let ph: PostHog | null = null;
let started = false;

export async function initAnalytics(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    const spec = "posthog-js";
    const mod = (await import(/* webpackIgnore: true */ spec)) as { default: PostHog };
    mod.default.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
    });
    ph = mod.default;
  } catch {
    // posthog-js not installed — analytics disabled, app unaffected.
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  void initAnalytics().then(() => ph?.capture(event, props));
}

export function identify(id: string, props?: Record<string, unknown>): void {
  void initAnalytics().then(() => ph?.identify(id, props));
}

export const analyticsEnabled = (): boolean => Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

/**
 * Typed onboarding/activation funnel events (PRD §5). Never carries a full URL —
 * pass the normalized domain/origin only, never paths or query strings.
 */
export type OnboardingEvent =
  | { event: "onboarding_step_viewed"; step: number; device: "desktop" | "mobile" }
  | { event: "website_url_focused" }
  | { event: "website_url_validation_failed"; reason: string }
  | { event: "website_analysis_started"; domain?: string }
  | { event: "website_analysis_succeeded"; domain?: string; source?: string }
  | { event: "website_analysis_failed"; reason: string }
  | { event: "onboarding_step_completed"; step: number }
  | { event: "onboarding_help_opened" };

export function trackOnboarding(e: OnboardingEvent): void {
  const { event, ...props } = e;
  track(event, props);
}
