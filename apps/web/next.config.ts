import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@geoseo/types", "@geoseo/mock"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // Allow the public tunnel hosts to hit the dev server (HMR / assets / actions).
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.ngrok-free.dev"],
  // Proxy browser/client API calls to the NestJS api so they're same-origin
  // (works through the ngrok tunnel too — the browser never hits :4000 directly).
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
};

export default nextConfig;
