import type { NextConfig } from "next";

/**
 * `standalone` output keeps the runtime image small; the Docker build copies
 * only `.next/standalone` plus static assets.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  // Stops `next dev` from writing AGENTS.md / CLAUDE.md into the repo root.
  agentRules: false,
  images: {
    // Uploaded media is served from the app itself, so no remote loader is
    // needed. Admins may still reference off-site images in blocks.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  serverExternalPackages: ["sharp", "pg", "nodemailer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
