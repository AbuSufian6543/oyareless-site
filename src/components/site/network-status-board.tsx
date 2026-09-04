"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleCheck,
  CircleMinus,
  Search,
  TriangleAlert,
} from "lucide-react";

import { STATUS_CATEGORY_ORDER } from "@/lib/status-categories";
import { cn } from "@/lib/utils";

export type PublicStatusCard = {
  key: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  category: string;
  operational: boolean | null;
  latencyMs: number | null;
  checkedAt: string | null;
};

/**
 * Searchable, grouped status board. Receives only the public card payload —
 * never probe URLs.
 */
export function NetworkStatusBoard({
  services,
  uptime24h,
  lastCheckedAt,
}: {
  services: PublicStatusCard[];
  uptime24h: number | null;
  lastCheckedAt: string | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const present = new Set(services.map((service) => service.category || "Other"));
    return [
      "All",
      ...STATUS_CATEGORY_ORDER.filter((label) => present.has(label)),
      ...[...present].filter(
        (label) => !STATUS_CATEGORY_ORDER.includes(label as (typeof STATUS_CATEGORY_ORDER)[number]),
      ),
    ];
  }, [services]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return services.filter((service) => {
      if (category !== "All" && (service.category || "Other") !== category) {
        return false;
      }
      if (!needle) return true;
      return (
        service.name.toLowerCase().includes(needle) ||
        (service.category || "").toLowerCase().includes(needle)
      );
    });
  }, [services, query, category]);

  const groups = useMemo(() => {
    const buckets = new Map<string, PublicStatusCard[]>();
    for (const service of filtered) {
      const label = service.category || "Other";
      const list = buckets.get(label) ?? [];
      list.push(service);
      buckets.set(label, list);
    }

    const ordered = [
      ...STATUS_CATEGORY_ORDER.filter((label) => buckets.has(label)),
      ...[...buckets.keys()].filter(
        (label) => !STATUS_CATEGORY_ORDER.includes(label as (typeof STATUS_CATEGORY_ORDER)[number]),
      ),
    ];

    return ordered.map((label) => ({ label, items: buckets.get(label) ?? [] }));
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy-900">Monitored services</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Each card is a live check of a public homepage. We ask a free
            public uptime API first; if that API is busy we check from our
            own servers. Latency is that check, not your connection.
            {uptime24h !== null
              ? ` ${uptime24h.toFixed(1)}% of checks succeeded in the last 24 hours.`
              : ""}
            {lastCheckedAt
              ? ` Last check ${formatCheckedAt(lastCheckedAt)}.`
              : ""}
          </p>
        </div>

        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search services</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services"
            className="field pl-9"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filter by category">
        {categories.map((label) => {
          const selected = category === label;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(label)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                selected
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-navy-700 hover:border-brand-200 hover:bg-brand-50",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="surface-empty">No services match that filter.</p>
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-labelledby={`status-${slug(group.label)}`}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3
                id={`status-${slug(group.label)}`}
                className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
              >
                {group.label}
              </h3>
              <p className="text-xs text-slate-400">
                {group.items.length} site{group.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((service) => (
                <li key={service.key}>
                  <StatusCard service={service} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function StatusCard({ service }: { service: PublicStatusCard }) {
  const unknown = service.operational === null;
  const ok = service.operational === true;
  const tone = unknown ? "unknown" : ok ? "up" : "down";

  return (
    <article
      className={cn(
        "surface-card surface-card-hover flex h-full gap-4 p-4",
        tone === "down" && "border-amber-200",
      )}
    >
      <LogoPlate name={service.name} src={service.logoUrl} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold leading-snug text-navy-900">{service.name}</h4>
          <StatusBadge tone={tone} />
        </div>

        <p className="mt-1.5 text-sm text-slate-500">
          {unknown
            ? "Waiting for the first check"
            : ok
              ? "Responding"
              : "Not responding"}
          {service.latencyMs !== null ? ` · ${service.latencyMs} ms` : ""}
        </p>

        {service.checkedAt && (
          <p className="mt-0.5 text-xs text-slate-400">
            Checked {formatCheckedAt(service.checkedAt)}
          </p>
        )}

        {service.websiteUrl && (
          <a
            href={service.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            Open site
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

function LogoPlate({ name, src }: { name: string; src: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-[inset_0_0_0_1px_rgba(7,30,57,0.04)]">
      {src ? (
        // Shipped marks skip next/image so they are not re-encoded.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="max-h-12 max-w-full object-contain"
        />
      ) : (
        <span className="text-sm font-bold text-navy-700" aria-hidden="true">
          {initials || "•"}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ tone }: { tone: "up" | "down" | "unknown" }) {
  const Icon = tone === "unknown" ? CircleMinus : tone === "up" ? CircleCheck : TriangleAlert;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
        tone === "up" && "bg-emerald-50 text-emerald-700",
        tone === "down" && "bg-amber-50 text-amber-800",
        tone === "unknown" && "bg-slate-100 text-slate-500",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {tone === "up" ? "Up" : tone === "down" ? "Issue" : "Pending"}
    </span>
  );
}

function formatCheckedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
