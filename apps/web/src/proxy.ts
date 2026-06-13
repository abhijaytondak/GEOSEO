import { clerkMiddleware } from "@clerk/nextjs/server";

// Bare clerkMiddleware() attaches auth context but protects nothing by default,
// so every route (dashboards, public /feeds, the /api/v1 proxy) stays reachable.
// Runs in Clerk keyless dev mode until the Clerk keys are set in the env.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
