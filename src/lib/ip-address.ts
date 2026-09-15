/**
 * Address classification shared by the speed-test API and the browser UI.
 * Kept free of `server-only` so the client can refuse to display loopback.
 */

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

/** True for loopback, RFC1918, link-local, and unique-local addresses. */
export function isPrivateClientIp(ip: string): boolean {
  const host = normalizeIp(ip);
  if (!host || host === "unknown") return true;
  if (host.startsWith("::ffff:")) return isPrivateClientIp(host.slice(7));
  if (
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1" ||
    host === "localhost" ||
    host.startsWith("127.")
  ) {
    return true;
  }
  if (host.startsWith("10.") || host.startsWith("192.168.")) return true;
  if (host.startsWith("169.254.")) return true;
  if (host.includes(":")) {
    if (host.startsWith("fe80:")) return true;
    const hextet = host.split(":")[0] ?? "";
    // Unique local addresses are fc00::/7.
    if (hextet.startsWith("fc") || hextet.startsWith("fd")) return true;
  }
  const match = /^172\.(\d+)\./.exec(host);
  if (match) {
    const second = Number.parseInt(match[1], 10);
    return second >= 16 && second <= 31;
  }
  return false;
}

/** Public address, or null when the value is missing or not globally routable. */
export function publicClientIp(ip: string | null | undefined): string | null {
  const value = ip?.trim() ?? "";
  if (!value || isPrivateClientIp(value)) return null;
  return value;
}
