import "server-only";

import {
  publicWebsiteUrl,
  shouldHidePublicMonitor,
  textMentionsCompanyHost,
} from "@/lib/company-status-hosts";
import type { StatusSummary } from "@/lib/monitoring";

/**
 * Database access for the status surfaces, kept separate from `monitoring.ts`
 * so the query layer can be swapped without touching callers.
 *
 * Returns `null` while no monitored endpoints are configured. Callers must
 * render an explicit "not configured" state rather than substituting figures.
 *
 * The visitor payload never includes probe targets. Company-owned hosts are
 * stripped here even if `isPublic` was left on.
 */
export async function loadStatusSummary(): Promise<StatusSummary | null> {
  const { prisma } = await import("@/lib/prisma");

  try {
    const endpoints = await prisma.monitoredEndpoint.findMany({
      where: { enabled: true, isPublic: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        websiteUrl: true,
        category: true,
        target: true,
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { ok: true, latencyMs: true, checkedAt: true },
        },
      },
    });

    const visible = endpoints.filter((endpoint) => !shouldHidePublicMonitor(endpoint));

    if (visible.length === 0) return null;

    const visibleIds = visible.map((endpoint) => endpoint.id);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [openIncidents, total, successful] = await Promise.all([
      prisma.incident.count({ where: { resolvedAt: null, isPublic: true } }),
      prisma.statusCheck.count({
        where: { endpointId: { in: visibleIds }, checkedAt: { gte: since } },
      }),
      prisma.statusCheck.count({
        where: {
          endpointId: { in: visibleIds },
          checkedAt: { gte: since },
          ok: true,
        },
      }),
    ]);

    const services = visible.map((endpoint) => {
      const latest = endpoint.checks[0];
      return {
        key: endpoint.slug,
        name: endpoint.name,
        logoUrl: endpoint.logoUrl,
        websiteUrl: publicWebsiteUrl(endpoint.websiteUrl),
        category: endpoint.category || "Other",
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

export function publicIncidentVisible(incident: {
  title: string;
  affected: string;
  updates?: Array<{ body: string }>;
}): boolean {
  const blob = [
    incident.title,
    incident.affected,
    ...(incident.updates ?? []).map((update) => update.body),
  ].join("\n");
  return !textMentionsCompanyHost(blob);
}
