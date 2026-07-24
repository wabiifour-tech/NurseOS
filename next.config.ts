import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
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