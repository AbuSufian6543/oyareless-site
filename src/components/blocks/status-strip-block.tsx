import Link from "next/link";
import { Activity, ArrowRight, CircleCheck, CircleMinus, TriangleAlert } from "lucide-react";

import { isDarkBackground, Section } from "@/components/blocks/section";
import type { BlockOf } from "@/lib/blocks";
import { getStatusSummary, type ServiceHealth } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

/**
 * Live service health, read from probes this application runs itself.
 *
 * There is deliberately no fallback data. If no endpoints are configured, or
 * the probe has not run yet, the strip says "not yet reporting" instead of
 * inventing an uptime figure.
 */
export async function StatusStripBlock({
  block,
}: {
  block: BlockOf<"statusStrip">;
}) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);
  const summary = data.showLiveData ? await getStatusSummary() : null;

  const degraded = summary
    ? summary.services.filter((service) => service.operational === false).length
    : 0;
  const reporting = summary?.services.some(
    (service) => service.operational !== null,
  );

  return (
    <Section settings={block.settings} defaultBackground="grid" defaultPadding="md">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              dark ? "bg-accent-500/15 text-accent-300" : "bg-brand-50 text-brand-600",
            )}
          >
            <Activity className="size-5.5" aria-hidden="true" />
          </span>

          <div>
            <h2
              className={cn(
                "text-xl font-bold",
                dark ? "text-white" : "text-navy-900",
              )}
            >
              {data.heading}
            </h2>

            <p
              className={cn(
                "mt-1 text-sm leading-relaxed",
                dark ? "text-navy-300" : "text-slate-600",
              )}
            >
              {statusLine(data.description, summary, degraded, reporting)}
            </p>
          </div>
        </div>

        {summary && summary.services.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {summary.services.slice(0, 5).map((service) => (
              <li key={service.name}>
                <ServicePill service={service} dark={dark} />
              </li>
            ))}
          </ul>
        )}

        {data.href && (
          <Link
            href={data.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
              dark
                ? "border-white/25 text-white hover:bg-white/10"
                : "border-slate-300 text-navy-800 hover:bg-slate-50",
            )}
          >
            {data.linkLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </Section>
  );
}

function statusLine(
  description: string,
  summary: Awaited<ReturnType<typeof getStatusSummary>>,
  degraded: number,
  reporting: boolean | undefined,
): string {
  if (description) return description;
  if (!summary) return "Live monitoring is not yet reporting for this site.";
  if (!reporting) return "Endpoints are configured but have not been probed yet.";

  const parts: string[] = [];
  parts.push(
    degraded === 0
      ? "All monitored services responding."
      : `${degraded} monitored service${degraded === 1 ? "" : "s"} not responding.`,
  );
  if (summary.uptime24h !== null) {
    parts.push(`${summary.uptime24h.toFixed(2)}% of checks passed in the last 24 hours.`);
  }
  if (summary.openIncidents > 0) {
    parts.push(
      `${summary.openIncidents} open incident${summary.openIncidents === 1 ? "" : "s"}.`,
    );
  }
  return parts.join(" ");
}

function ServicePill({
  service,
  dark,
}: {
  service: ServiceHealth;
  dark: boolean;
}) {
  const unknown = service.operational === null;
  const ok = service.operational === true;

  const Icon = unknown ? CircleMinus : ok ? CircleCheck : TriangleAlert;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        dark
          ? "border-navy-700 bg-navy-800/70 text-navy-200"
          : "border-slate-200 bg-white text-navy-700",
      )}
    >
      <Icon
        className={cn(
          "size-3.5",
          unknown
            ? dark
              ? "text-navy-500"
              : "text-slate-400"
            : ok
              ? "text-emerald-500"
              : "text-amber-500",
        )}
        aria-hidden="true"
      />
      {service.name}
      {service.latencyMs !== null && (
        <span className={cn("font-mono font-normal", dark ? "text-navy-400" : "text-slate-400")}>
          {service.latencyMs} ms
        </span>
      )}
      <span className="sr-only">
        {unknown
          ? "status unknown"
          : ok
            ? "responding normally"
            : "not responding"}
      </span>
    </span>
  );
}
