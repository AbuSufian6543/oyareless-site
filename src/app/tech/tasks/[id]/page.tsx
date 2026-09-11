import { notFound } from "next/navigation";

import { techAddTaskNoteAction, techUpdateTaskStatusAction } from "@/app/tech/actions";
import { Card, CardTitle, PageHeader, SelectField } from "@/components/admin/ui";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { WorkLog, WorkLogSummary } from "@/components/workdesk/work-log";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { assertTaskAccess, handleWorkdeskAuth, technicianOrRedirect } from "@/lib/workdesk/access";
import { isOverdue } from "@/lib/workdesk/dates";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import { TECHNICIAN_TASK_STATUSES } from "@/lib/workdesk/rules";
import { WORK_LOG_INCLUDE } from "@/lib/workdesk/work-log-query";

export const metadata = { title: "Task" };

export default async function TechTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await technicianOrRedirect();
  const { id } = await params;
  try {
    await assertTaskAccess(user, id);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech/tasks");
  }

  const [task, catalog] = await Promise.all([
    prisma.internalTask.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
        attachments: true,
        events: { orderBy: { createdAt: "asc" } },
        assignees: { include: { user: { select: { name: true } } } },
        ...WORK_LOG_INCLUDE,
      },
    }),
    prisma.workProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, category: true },
    }),
  ]);
  if (!task) notFound();
  const closed = task.status === "CLOSED";
  const overdue = isOverdue(task.dueAt, task.status, ["COMPLETED", "CLOSED"]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <PageHeader
          breadcrumb={{ href: "/tech/tasks", label: "Tasks" }}
          title={`${task.reference}: ${task.title}`}
          description={
            task.dueAt
              ? `${overdue ? "Overdue " : "Due "}${formatDate(task.dueAt)}`
              : "No due date"
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue ? (
            <span className="text-xs font-semibold text-amber-700">Needs attention</span>
          ) : null}
          <WorkLogSummary
            minutes={task.timeEntries.reduce((sum, row) => sum + row.minutes, 0)}
            productCount={task.productUsages.length}
          />
        </div>
        {task.description && (
          <div className="mb-6 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 text-sm">
            {task.description}
          </div>
        )}
        <AttachmentList
          files={task.attachments
            .filter((file) => !file.noteId)
            .map((file) => ({ ...file, url: workdeskFileHref("task", file.id) }))}
        />
        <WorkLog
          taskId={task.id}
          timeEntries={task.timeEntries}
          productUsages={task.productUsages}
          catalog={catalog}
          currentUserId={user.id}
          canManageAll={false}
          canEdit={!closed}
          canSaveToCatalog={false}
        />
        <ol className="mt-6 space-y-3">
          {task.notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <p className="text-xs text-slate-500">
                {note.authorName} · {formatDateTime(note.createdAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
              <AttachmentList
                files={note.attachments.map((file) => ({
                  ...file,
                  url: workdeskFileHref("task", file.id),
                }))}
              />
            </li>
          ))}
        </ol>
        {!closed && (
          <form action={techAddTaskNoteAction} encType="multipart/form-data" className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="taskId" value={task.id} />
            <textarea name="body" required rows={4} placeholder="Add a note for the team" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <AttachmentField />
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Add note
            </button>
          </form>
        )}
      </div>
      <aside className="space-y-4">
        <Card>
          <CardTitle>Assigned to</CardTitle>
          <AssigneeAvatars names={task.assignees.map((row) => row.user.name)} you={user.name} />
        </Card>
        {!closed && (
          <Card>
            <CardTitle>Status</CardTitle>
            <form action={techUpdateTaskStatusAction} className="space-y-2">
              <input type="hidden" name="taskId" value={task.id} />
              <SelectField
                label="Update status"
                name="status"
                defaultValue={
                  TECHNICIAN_TASK_STATUSES.includes(task.status as (typeof TECHNICIAN_TASK_STATUSES)[number])
                    ? task.status
                    : "IN_PROGRESS"
                }
                options={TECHNICIAN_TASK_STATUSES.map((status) => ({
                  value: status,
                  label: TASK_STATUS_LABELS[status],
                }))}
              />
              <button type="submit" className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Save status
              </button>
              <p className="text-xs text-slate-500">Mark completed when you are done. An admin closes the task after review.</p>
            </form>
          </Card>
        )}
        <Card>
          <CardTitle>History</CardTitle>
          <ActivityLog events={task.events} />
        </Card>
      </aside>
    </div>
  );
}
