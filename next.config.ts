import type { NextConfig } from "next";

/**
 * Security headers for HTML and API responses.
 *
 * Do not set script-src / style-src here. Next.js 16 re-applies CSS after
 * hydration (often as a blob: URL). A style-src policy lets the first paint
 * look correct, then drops the stylesheet and the layout collapses.
 *
 * Clickjacking is still covered by frame-ancestors and X-Frame-Options.
 * Static assets are excluded so CSS/JS are not served with a document CSP.
 */
const securityHeaders = [
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
    value:
      "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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
  async rewrites() {
    // Edited pages may still point at the old .svg paths after Grandstream,
    // Fanvil and Paradox switched to the vendors' own PNG files.
    return [
      { source: "/brand/logos/grandstream.svg", destination: "/brand/logos/grandstream.png" },
      { source: "/brand/logos/fanvil.svg", destination: "/brand/logos/fanvil.png" },
      { source: "/brand/logos/paradox.svg", destination: "/brand/logos/paradox.png" },
      { source: "/brand/logos/cisco.svg", destination: "/brand/logos/cisco.png" },
      { source: "/brand/logos/azure.svg", destination: "/brand/logos/azure.png" },
      { source: "/brand/logos/unifi.svg", destination: "/brand/logos/unifi.png" },
      { source: "/brand/logos/mikrotik.svg", destination: "/brand/logos/mikrotik.png" },
      { source: "/brand/logos/juniper.svg", destination: "/brand/logos/juniper.png" },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Keep CSP off every /_next/* response. Next 16 rewrites CSS after
        // hydration; a document policy on those files drops the stylesheet.
        source: "/((?!_next/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
