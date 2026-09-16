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
  transpilePackages: ["@cloudflare/speedtest"],
  async rewrites() {
    // Edited pages may still point at the old .svg paths after vendors
    // switched to the files they actually publish.
    return {
      beforeFiles: [
        // Weebly-era stream poster. Other sites still fetch this exact URL.
        // Served from public/brand so the Docker uploads volume cannot hide it.
        {
          source: "/uploads/4/6/3/6/46366157/416823.jpg",
          destination: "/brand/legacy-stream-logo.jpg",
        },
      ],
      afterFiles: [
        { source: "/brand/logos/grandstream.svg", destination: "/brand/logos/grandstream.png" },
        { source: "/brand/logos/fanvil.svg", destination: "/brand/logos/fanvil.png" },
        { source: "/brand/logos/paradox.svg", destination: "/brand/logos/paradox.png" },
        { source: "/brand/logos/cisco.svg", destination: "/brand/logos/cisco.png" },
        { source: "/brand/logos/azure.svg", destination: "/brand/logos/azure.png" },
        { source: "/brand/logos/unifi.svg", destination: "/brand/logos/unifi.png" },
        { source: "/brand/logos/mikrotik.svg", destination: "/brand/logos/mikrotik.png" },
        { source: "/brand/logos/juniper.svg", destination: "/brand/logos/juniper.png" },
        { source: "/brand/logos/fortinet.svg", destination: "/brand/logos/fortinet.png" },
        { source: "/brand/logos/barracuda.svg", destination: "/brand/logos/barracuda.png" },
        { source: "/brand/logos/hytera.svg", destination: "/brand/logos/hytera.png" },
        {
          source: "/images/services/digital-marketing/02.webp",
          destination: "/images/services/digital-marketing/02.jpg",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/uploads/4/6/3/6/46366157/416823.jpg",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/brand/legacy-stream-logo.jpg",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/api/legacy/weebly-logo",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
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
