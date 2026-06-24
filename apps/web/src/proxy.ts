import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Auth enforcement is mode-driven (P0.2): enforced when GEOSEO_REQUIRE_AUTH=true OR
// NEXT_PUBLIC_GEOSEO_MODE=production (so production can't silently stay open); demo
// only attaches Clerk context (open beta — every route reachable). API auth is
// enforced by the BFF route handler (app/api/v1/[...path]); public pages
// (/feeds, sign-in/up) stay open.
const REQUIRE_AUTH =
  process.env.GEOSEO_REQUIRE_AUTH === "true" || (process.env.NEXT_PUBLIC_GEOSEO_MODE ?? "demo") === "production";
const isApiRoute = createRouteMatcher(["/api(.*)"]);
// Public marketing pages must stay open in production so they can rank and capture
// leads: "/" landing, every /platform/* feature page, and the /solutions/:slug
// pages. NOTE: bare "/solutions" is the gated in-app readiness view, so we match
// "/solutions/:slug" (one segment) — never "/solutions" itself.
const isPublicPage = createRouteMatcher([
  "/",
  "/pricing",
  "/product",
  "/use-cases",
  "/demo",
  "/platform(.*)",
  "/solutions/:slug",
  "/feeds(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!REQUIRE_AUTH) return;
  if (isApiRoute(req) || isPublicPage(req)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
