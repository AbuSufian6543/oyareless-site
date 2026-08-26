import { Download, Users } from "lucide-react";

import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  const [subscribers, counts] = await Promise.all([
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.subscriber.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (status: string) =>
    counts.find((row) => row.status === status)?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Newsletter subscribers"
        description="Double opt-in list. Only confirmed addresses should receive mailings."
        actions={
          <a
            href="/api/admin/subscribers/export"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export confirmed
          </a>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmed", value: countFor("CONFIRMED"), tone: "success" },
          { label: "Awaiting confirmation", value: countFor("PENDING"), tone: "warning" },
          {
            label: "Unsubscribed",
            value: countFor("UNSUBSCRIBED"),
            tone: "neutral",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-navy-900">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {subscribers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-8" aria-hidden="true" />}
            title="No subscribers yet"
            description="The footer signup form adds people here after they confirm by email."
          />
        </Card>
      ) : (
        <DataTable headers={["Email", "Name", "Status", "Signed up", "Confirmed"]}>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 font-medium text-navy-900">
                {subscriber.email}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {subscriber.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  tone={
                    subscriber.status === "CONFIRMED"
                      ? "success"
                      : subscriber.status === "PENDING"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {subscriber.status.toLowerCase()}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(subscriber.createdAt)}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {subscriber.confirmedAt
                  ? formatDate(subscriber.confirmedAt)
                  : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
