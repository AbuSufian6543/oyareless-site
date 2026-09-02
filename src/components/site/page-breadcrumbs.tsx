"use client";

import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Visible trail plus BreadcrumbList JSON-LD. Keep this on public pages so the
 * markup Google reads matches what a person sees.
 */
export function PageBreadcrumbs({
  items,
  tone = "bar",
}: {
  items: Crumb[];
  tone?: "bar" | "onDark";
}) {
  if (items.length < 2) return null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav
        aria-label="Breadcrumb"
        className={cn(
          tone === "bar" && "border-b border-slate-200 bg-slate-50",
        )}
      >
        <ol
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm",
            tone === "bar" ? "container-page py-2.5" : "mb-5",
          )}
        >
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={`${item.href}-${item.name}`} className="flex items-center gap-2">
                {index > 0 ? (
                  <span
                    className={cn(
                      "select-none",
                      tone === "onDark" ? "text-navy-500" : "text-slate-300",
                    )}
                    aria-hidden="true"
                  >
                    /
                  </span>
                ) : null}
                {last ? (
                  <span
                    className={cn(
                      "font-medium",
                      tone === "onDark" ? "text-white" : "text-navy-800",
                    )}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "transition-colors",
                      tone === "onDark"
                        ? "text-navy-300 hover:text-white"
                        : "text-slate-500 hover:text-brand-700",
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
