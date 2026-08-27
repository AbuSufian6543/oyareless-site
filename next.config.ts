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
      { protocol: "https", hostname: "wirelesscom.ca" },
      { protocol: "https", hostname: "www.wirelesscom.ca" },
      { protocol: "https", hostname: "**.wirelesscom.ca" },
      { protocol: "https", hostname: "wirelesscom.org" },
      { protocol: "https", hostname: "www.wirelesscom.org" },
      { protocol: "https", hostname: "hyteraradios.ca" },
      { protocol: "https", hostname: "www.hyteraradios.ca" },
    ],
  },
  serverExternalPackages: ["sharp", "pg", "nodemailer"],
  async headers() {
    return [
      {
        // Stylesheets requested with crossorigin need CORS, or the browser
        // applies them on first paint then drops them after hydration.
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https:",
              "style-src 'self' 'unsafe-inline' blob:",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' blob:",
              "media-src 'self' https: blob:",
              "frame-src 'self' https:",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
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
