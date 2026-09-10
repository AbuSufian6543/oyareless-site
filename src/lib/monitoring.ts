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
 * Probe targets never leave the server. Company-owned hosts are dropped even
 * when a row is marked public. Page render never waits on live checks.
 */

export type ServiceHealth = {
  /** Stable public key (slug). Not a probe URL. */
  key: string;
  name: string;
  logoUrl: string | null;
  /** Visitor homepage. Probe URLs never appear here. */
  websiteUrl: string | null;
  category: string;
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
  const summary = await loadStatusSummary();

  try {
    const { after } = await import("next/server");
    after(() => {
      void import("@/lib/probes").then(({ refreshStaleProbes }) =>
        refreshStaleProbes({ limit: 36, concurrency: 4 }).catch(() => undefined),
      );
    });
  } catch {
    // `after` is only valid during a request. Seeded or background callers skip it.
  }

  return summary;
});
