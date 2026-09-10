import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { technicianOrRedirect } from "@/lib/workdesk/access";

export const metadata = { title: "My tasks" };

export default async function TechTasksPage() {
  const user = await technicianOrRedirect();
  const tasks = await prisma.internalTask.findMany({
    where: { assignees: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Assigned tasks" description="Internal jobs assigned to you." />
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {tasks.map((task) => (
          <li key={task.id} className="px-4 py-3">
            <Link href={`/tech/tasks/${task.id}`} className="font-semibold text-navy-900 hover:text-brand-700">
              {task.reference} — {task.title}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.dueAt ? <span>Due {formatDate(task.dueAt)}</span> : null}
              <span>{formatDateTime(task.updatedAt)}</span>
            </p>
          </li>
        ))}
        {tasks.length === 0 && <li className="px-4 py-8 text-sm text-slate-500">Nothing assigned yet.</li>}
      </ul>
    </div>
  );
}
