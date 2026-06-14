import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@geoseo/types", "@geoseo/mock"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // Allow the public tunnel hosts to hit the dev server (HMR / assets / actions).
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.ngrok-free.dev"],
  // NOTE: browser `/api/v1/*` calls are now served by the BFF auth proxy route
  // handler at `app/api/v1/[...path]/route.ts` (Clerk session check + server-token
  // injection), which replaces the old static rewrite.
};

export default nextConfig;
