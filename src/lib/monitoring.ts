import "server-only";

import { cache } from "react";

/**
 * Reads the most recent probe results for the public status surfaces.
 *
 * Everything here comes from checks this application actually runs against
 * endpoints an administrator has configured. When nothing is configured the
 * functions return `null` and the UI says so — no placeholder uptime figures,
 * latency numbers or incident counts are ever produced.
 *
 * The probe scheduler and the `MonitoredEndpoint` / `StatusCheck` /
 * `Incident` tables are introduced with the monitoring admin section; until an
 * administrator adds endpoints there is genuinely nothing to report.
 */

export type ServiceHealth = {
  name: string;
  /** Null when the endpoint has never been probed. */
  operational: boolean | null;
  latencyMs: number | null;
  checkedAt: Date | null;
};

export type StatusSummary = {
  services: ServiceHealth[];
  openIncidents: number;
  /** Null until at least one full day of checks exists. */
  uptime24h: number | null;
  lastCheckedAt: Date | null;
};

export const getStatusSummary = cache(async (): Promise<StatusSummary | null> => {
  const { loadStatusSummary } = await import("@/lib/monitoring-store");
  return loadStatusSummary();
});
