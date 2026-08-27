import "server-only";

import type { StatusSummary } from "@/lib/monitoring";

/**
 * Database access for the status surfaces, kept separate from `monitoring.ts`
 * so the query layer can be swapped without touching callers.
 *
 * Returns `null` while no monitored endpoints are configured. Callers must
 * render an explicit "not configured" state rather than substituting figures.
 */
export async function loadStatusSummary(): Promise<StatusSummary | null> {
  const { prisma } = await import("@/lib/prisma");

  try {
    const endpoints = await prisma.monitoredEndpoint.findMany({
      where: { enabled: true, isPublic: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { ok: true, latencyMs: true, checkedAt: true },
        },
      },
    });

    if (endpoints.length === 0) return null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [openIncidents, total, successful] = await Promise.all([
      prisma.incident.count({ where: { resolvedAt: null } }),
      prisma.statusCheck.count({ where: { checkedAt: { gte: since } } }),
      prisma.statusCheck.count({ where: { checkedAt: { gte: since }, ok: true } }),
    ]);

    const services = endpoints.map((endpoint) => {
      const latest = endpoint.checks[0];
      return {
        name: endpoint.name,
        operational: latest ? latest.ok : null,
        latencyMs: latest?.latencyMs ?? null,
        checkedAt: latest?.checkedAt ?? null,
      };
    });

    const timestamps = services
      .map((service) => service.checkedAt)
      .filter((value): value is Date => value !== null);

    return {
      services,
      openIncidents,
      // Only meaningful once a day's worth of checks has accumulated.
      uptime24h: total > 0 ? (successful / total) * 100 : null,
      lastCheckedAt:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((date) => date.getTime())))
          : null,
    };
  } catch {
    // Missing tables (before the monitoring migration) or a transient database
    // problem must not take the home page down.
    return null;
  }
}
