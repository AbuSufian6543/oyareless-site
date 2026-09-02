import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { publicMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = publicMetadata({
  title: "System Status",
  description: "Whether the WirelessCom.Ca Inc. website and its supporting services are reachable.",
  path: "/system-status",
});

export default async function SystemStatusPage() {
  const databaseOk = await prisma.$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);

  const checks = [
    { name: "Website", ok: true, note: "This page rendered, so the app process is up." },
    {
      name: "Database",
      ok: databaseOk,
      note: databaseOk ? "Postgres accepted a probe query." : "Postgres did not respond.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Operations"
        title="System Status"
        description="Health of this website — not your office network. For monitored customer services see Network status."
      />
      <section className="bg-white py-12">
        <div className="container-page max-w-2xl space-y-4">
          {checks.map((check) => (
            <div key={check.name} className="rounded-xl border border-slate-200 p-5">
              <p className="font-bold text-navy-900">
                {check.name}{" "}
                <span className={check.ok ? "text-emerald-700" : "text-red-700"}>
                  {check.ok ? "operational" : "unavailable"}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{check.note}</p>
            </div>
          ))}
          <p className="text-sm text-slate-500">
            <Link href="/network-status" className="font-semibold text-brand-700 hover:underline">
              Network status
            </Link>{" "}
            lists probes against services an administrator configured.
          </p>
        </div>
      </section>
    </>
  );
}
