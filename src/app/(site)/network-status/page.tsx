import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { getStatusSummary } from "@/lib/monitoring";
import { publicMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = publicMetadata({
  title: "Network Status",
  description:
    "Live probes WirelessCom.Ca Inc. runs against services we monitor, plus public incidents. Figures are real checks — never placeholders.",
  path: "/network-status",
});

export default async function NetworkStatusPage() {
  const [summary, incidents, maintenance] = await Promise.all([
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

  return (
    <>
      <PageHero
        eyebrow="Operations"
        title="Network Status"
        description="Every figure on this page comes from probes this application runs, or from incidents an administrator published. If nothing is configured, we say so."
      />
      <section className="bg-white py-12">
        <div className="container-page space-y-10">
          {!summary ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No public monitors are configured yet, so there is nothing honest
              to show. Status is not invented.
            </p>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-navy-900">Monitored services</h2>
              {summary.uptime24h !== null && (
                <p className="mt-1 text-sm text-slate-500">
                  Last 24 hours: {summary.uptime24h.toFixed(2)}% of checks succeeded.
                </p>
              )}
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.services.map((service) => (
                  <li key={service.name} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold text-navy-900">{service.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.operational === null
                        ? "Not yet probed"
                        : service.operational
                          ? "Operational"
                          : "Degraded or down"}
                      {service.latencyMs !== null ? ` · ${service.latencyMs} ms` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {maintenance.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900">Scheduled maintenance</h2>
              <ul className="mt-3 space-y-3">
                {maintenance.map((window) => (
                  <li key={window.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
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
                  <li key={incident.id} className="rounded-xl border border-slate-200 p-5">
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
