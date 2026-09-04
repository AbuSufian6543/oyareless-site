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
 * when a row is marked public.
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
  const { refreshStaleProbes } = await import("@/lib/probes");
  await refreshStaleProbes({ limit: 10, concurrency: 5 }).catch(() => undefined);

  try {
    const { after } = await import("next/server");
    after(() => {
      void refreshStaleProbes({ limit: 30, concurrency: 4 });
    });
  } catch {
    // `after` is only valid during a request. Seeded or background callers skip it.
  }

  const { loadStatusSummary } = await import("@/lib/monitoring-store");
  return loadStatusSummary();
});
