import Link from "next/link";

import { markNotificationsReadAction } from "@/app/admin/tickets/actions";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { workdeskHref } from "@/lib/workdesk/access";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const user = await requireAdminRole("EMPLOYEE");
  const items = await prisma.workdeskNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Assignment, technician, and customer updates for tickets and tasks. Each alert is also emailed to your staff login address."
        actions={
          <form action={markNotificationsReadAction}>
            <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              Mark all read
            </button>
          </form>
        }
      />
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className={item.readAt ? "px-4 py-3" : "bg-brand-50/60 px-4 py-3"}>
            <Link
              href={workdeskHref(user.role, item)}
              className="block"
            >
              <p className="font-semibold text-navy-900">{item.title}</p>
              <p className="text-sm text-slate-600">{item.body}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</li>
        )}
      </ul>
    </div>
  );
}
