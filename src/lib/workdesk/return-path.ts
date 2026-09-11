import { sanitizeAppPath } from "@/lib/public-url";

export function isAdminTaskPath(path: string): boolean {
  return path === "/admin/tasks" || path.startsWith("/admin/tasks/") || path.startsWith("/admin/tasks?");
}

/** Keep notify/delete redirects on the tasks board, never a foreign URL. */
export function taskReturnPath(raw: string | null | undefined, fallback = "/admin/tasks"): string {
  const path = sanitizeAppPath(String(raw ?? ""));
  return isAdminTaskPath(path) ? path : fallback;
}

export function withQuery(path: string, key: string, value: string): string {
  const url = new URL(path, "https://wirelesscom.ca");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}
