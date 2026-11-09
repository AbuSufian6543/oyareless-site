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
  const url = new URL(path, "https://wirelesscom.org");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

const WORK_LIST_PATHS = new Set([
  "/admin/tasks",
  "/admin/tickets",
  "/tech/tasks",
  "/tech/tickets",
]);

/** Stay on the list the person was filtering. Never a detail page or another site. */
export function workListReturnPath(raw: string | null | undefined, fallback: string): string {
  const path = sanitizeAppPath(String(raw ?? ""));
  const url = new URL(path, "https://wirelesscom.org");
  const home = new URL(fallback, "https://wirelesscom.org");
  if (!WORK_LIST_PATHS.has(url.pathname) || url.pathname !== home.pathname) return fallback;

  const kept = new URLSearchParams();
  const view = url.searchParams.get("view");
  const q = url.searchParams.get("q");
  if (view && /^[a-z]{2,20}$/.test(view)) kept.set("view", view);
  if (q) kept.set("q", q.trim().slice(0, 80));
  const search = kept.toString();
  return search ? `${url.pathname}?${search}` : url.pathname;
}

/** Calendar create-task may send people back to the dashboard day they were on. */
export function dashboardDayPath(raw: string | null | undefined): string | null {
  const path = sanitizeAppPath(String(raw ?? ""));
  if (path === "/admin") return path;
  if (!path.startsWith("/admin?")) return null;
  const url = new URL(path, "https://wirelesscom.org");
  if (url.pathname !== "/admin") return null;
  const day = url.searchParams.get("day");
  if (!day) return "/admin";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "/admin";
  return `/admin?day=${day}`;
}
