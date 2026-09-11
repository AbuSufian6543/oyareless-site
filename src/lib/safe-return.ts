import { sanitizeAppPath } from "@/lib/public-url";

function pathIsUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`) || path.startsWith(`${root}?`);
}

function swapWorkspacePrefix(path: string, from: "/admin" | "/tech", to: "/admin" | "/tech"): string {
  if (path === from) return to;
  if (path.startsWith(`${from}/`) || path.startsWith(`${from}?`)) {
    return `${to}${path.slice(from.length)}`;
  }
  return path;
}

/**
 * Staff/portal return path from `?next=` or an email deep link.
 * Anything outside the app (or `/login` itself) is ignored so we cannot
 * bounce a person onto a foreign site after sign-in.
 */
export function safeStaffReturnPath(raw: string | null | undefined): string {
  const path = sanitizeAppPath(String(raw ?? ""));
  if (!path || path === "/") return "";
  if (path === "/login" || path.startsWith("/login?")) return "";
  if (
    pathIsUnder(path, "/admin") ||
    pathIsUnder(path, "/tech") ||
    pathIsUnder(path, "/portal") ||
    pathIsUnder(path, "/login/reset") ||
    pathIsUnder(path, "/login/forgot")
  ) {
    return path;
  }
  return "";
}

export function loginUrlFor(path: string): string {
  const next = safeStaffReturnPath(path);
  if (!next) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Where to send staff after they sign in, including email deep links.
 * Technicians stay on /tech; employees stay on /admin; viewers stay on the public site.
 */
export function destinationAfterLogin(
  user: { role: string; mustChangePassword?: boolean },
  nextRaw?: string | null,
): string {
  if (user.mustChangePassword) {
    return user.role === "TECHNICIAN" ? "/tech/account?change=1" : "/admin/account?change=1";
  }
  if (user.role === "VIEWER") return "/";

  const next = safeStaffReturnPath(nextRaw);
  if (!next) return user.role === "TECHNICIAN" ? "/tech" : "/admin";

  if (user.role === "TECHNICIAN") {
    if (pathIsUnder(next, "/admin")) {
      return safeStaffReturnPath(swapWorkspacePrefix(next, "/admin", "/tech")) || "/tech";
    }
    return pathIsUnder(next, "/tech") || pathIsUnder(next, "/portal") ? next : "/tech";
  }

  if (pathIsUnder(next, "/tech")) {
    return safeStaffReturnPath(swapWorkspacePrefix(next, "/tech", "/admin")) || "/admin";
  }
  return next;
}
