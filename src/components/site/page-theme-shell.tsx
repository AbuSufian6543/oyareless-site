"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

import {
  PAGE_THEME_COOKIE,
  pageThemeCookieString,
  withPageLightSlug,
} from "@/lib/page-theme";
import { cn } from "@/lib/utils";

function readCookie(): string {
  if (typeof document === "undefined") return "";
  const prefix = `${PAGE_THEME_COOKIE}=`;
  const row = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!row) return "";
  try {
    return decodeURIComponent(row.slice(prefix.length));
  } catch {
    return row.slice(prefix.length);
  }
}

function writeCookie(slug: string, light: boolean) {
  const next = withPageLightSlug(readCookie(), slug, light);
  document.cookie = pageThemeCookieString(next);
}

export function PageThemeShell({
  slug,
  enabled,
  light,
  children,
}: {
  slug: string;
  enabled: boolean;
  light: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!enabled) return children;

  function choose(nextLight: boolean) {
    if (nextLight === light) return;
    writeCookie(slug, nextLight);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div data-page-theme={light ? "light" : "original"}>
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2">
          <p className="text-xs font-semibold text-slate-600">Page look</p>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            role="group"
            aria-label="Page look"
          >
            <button
              type="button"
              aria-pressed={!light}
              disabled={pending}
              onClick={() => choose(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                !light
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-navy-800 hover:bg-white",
              )}
            >
              <Moon className="size-3.5" aria-hidden="true" />
              Original
            </button>
            <button
              type="button"
              aria-pressed={light}
              disabled={pending}
              onClick={() => choose(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                light
                  ? "bg-white text-navy-900 shadow-sm ring-1 ring-slate-200"
                  : "text-navy-800 hover:bg-white",
              )}
            >
              <Sun className="size-3.5" aria-hidden="true" />
              Light
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
