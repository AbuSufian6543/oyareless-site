/**
 * Where the public speed test actually measures. Kept in a tiny module so the
 * browser client and the info API can share it without pulling Cloudflare's
 * browser-only SDK onto the server.
 */
export const SPEEDTEST_PROVIDER = {
  host: "speed.cloudflare.com",
  location: "Cloudflare edge (nearest)",
} as const;
