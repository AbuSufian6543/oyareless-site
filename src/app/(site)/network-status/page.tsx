import type { Metadata } from "next";
import Link from "next/link";

import { NetworkStatusBoard } from "@/components/site/network-status-board";
import { PageHero } from "@/components/site/page-hero";
import { getStatusSummary } from "@/lib/monitoring";
import { publicIncidentVisible } from "@/lib/monitoring-store";
import { prisma } from "@/lib/prisma";
import { publicMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = publicMetadata({
  title: "Network Status",
  description:
    "Live checks of public services people in Sault Ste. Marie rely on — city hall, hospitals, schools, news, and the sites we all use every day. Figures are real probes, never placeholders.",
  path: "/network-status",
});

export default async function NetworkStatusPage() {
  const [summary, incidentRows, maintenanceRows] = await Promise.all([
    getStatusSummary(),
    prisma.incident
      .findMany({
        where: { isPublic: true },
        orderBy: { startedAt: "desc" },
        take: 20,
        include: { updates: { orderBy: { createdAt: "desc" }, take: 5 } },
      })
      .catch(() => []),
    prisma.maintenanceWindow
      .findMany({
        where: { isPublic: true, endsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
      })
      .catch(() => []),
  ]);

  const incidents = incidentRows.filter(publicIncidentVisible);
  const maintenance = maintenanceRows.filter((window) =>
    publicIncidentVisible({
      title: window.title,
      affected: `${window.affected}\n${window.description}`,
    }),
  );

  const up = summary?.services.filter((service) => service.operational === true).length ?? 0;
  const down =
    summary?.services.filter((service) => service.operational === false).length ?? 0;
  const pending =
    summary?.services.filter((service) => service.operational === null).length ?? 0;

  return (
    <>
      <PageHero
        eyebrow="Sault Ste. Marie"
        title="Network Status"
        description="Independent checks of public websites the city relies on — municipal services, hospitals, schools, newsrooms, and everyday platforms. If a site is slow or unreachable from the internet, it shows here. Nothing on this page is invented."
      >
        {summary && (
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="Responding" value={String(up)} tone="up" />
            <HeroStat label="Not responding" value={String(down)} tone={down > 0 ? "down" : "neutral"} />
            <HeroStat label="First check pending" value={String(pending)} tone="neutral" />
            <HeroStat
              label="Open incidents"
              value={String(summary.openIncidents)}
              tone={summary.openIncidents > 0 ? "down" : "neutral"}
            />
          </dl>
        )}
      </PageHero>
      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-page space-y-10">
          {!summary ? (
            <p className="surface-empty">
              No public monitors are configured yet, so there is nothing honest
              to show. Status is not invented.
            </p>
          ) : (
            <NetworkStatusBoard
              services={summary.services.map((service) => ({
                key: service.key,
                name: service.name,
                logoUrl: service.logoUrl,
                websiteUrl: service.websiteUrl,
                category: service.category,
                operational: service.operational,
                latencyMs: service.latencyMs,
                checkedAt: service.checkedAt?.toISOString() ?? null,
              }))}
              uptime24h={summary.uptime24h}
              lastCheckedAt={summary.lastCheckedAt?.toISOString() ?? null}
            />
          )}

          {maintenance.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900">Scheduled maintenance</h2>
              <ul className="mt-3 space-y-3">
                {maintenance.map((window) => (
                  <li key={window.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-navy-900">{window.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {window.startsAt.toLocaleString("en-CA")} –{" "}
                      {window.endsAt.toLocaleString("en-CA")}
                    </p>
                    {window.description && (
                      <p className="mt-2 text-sm text-slate-600">{window.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-navy-900">Incidents</h2>
            {incidents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No public incidents on record.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {incidents.map((incident) => (
                  <li key={incident.id} className="surface-card p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {incident.severity}
                      {incident.resolvedAt ? " · resolved" : " · open"}
                    </p>
                    <h3 className="mt-1 font-bold text-navy-900">{incident.title}</h3>
                    {incident.affected && (
                      <p className="mt-1 text-sm text-slate-500">Affects: {incident.affected}</p>
                    )}
                    {incident.updates.map((update) => (
                      <p key={update.id} className="mt-2 text-sm text-slate-600">
                        {update.body}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm text-slate-500">
            Application health for this website is on{" "}
            <Link href="/system-status" className="font-semibold text-brand-700 hover:underline">
              system status
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}

function HeroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-navy-300">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "up" && "text-emerald-300",
          tone === "down" && "text-amber-300",
          tone === "neutral" && "text-white",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
