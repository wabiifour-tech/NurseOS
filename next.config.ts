import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  // SECURITY: ignoreBuildErrors disabled as part of security hardening.
  // Previously set to true, which masked TypeScript errors in production builds.
  // Build-time type errors must now be fixed before deployment.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        // Route the GSC verification URL to our API handler.
        // Vercel's static file serving may not pick up .html files
        // from public/, so we serve it via a rewrite + route handler.
        source: "/google0ce4def6136e5762.html",
        destination: "/api/gsc-verify",
      },
    ];
  },
};

export default nextConfig;