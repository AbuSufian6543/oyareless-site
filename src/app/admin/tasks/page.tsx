import Link from "next/link";

import { deleteTaskAction } from "@/app/admin/tasks/actions";
import { PageHeader } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  await requireAdminRole("EDITOR");
  const tasks = await prisma.internalTask.findMany({
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      assignees: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Internal tasks"
        description="Work that is independent of a customer ticket."
        actions={
          <Link
            href="/admin/tasks/new"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New task
          </Link>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Assignees</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/tasks/${task.id}`} className="font-semibold text-brand-700 hover:underline">
                    {task.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">
                  {task.assignees.map((row) => row.user.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {task.dueAt ? formatDate(task.dueAt) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(task.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/tasks/${task.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                      Edit
                    </Link>
                    <form action={deleteTaskAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <ConfirmSubmit
                        message={`Delete ${task.reference}? This cannot be undone.`}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No internal tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
