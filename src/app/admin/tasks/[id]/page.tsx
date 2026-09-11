import Link from "next/link";
import { notFound } from "next/navigation";

import { addTaskNoteAction, deleteTaskAction, notifyTaskStaffAction, updateTaskAction } from "@/app/admin/tasks/actions";
import { Alert, Card, CardTitle, PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { EmailStaffButton, TaskEmailHint, WorkdeskNotifyMenu } from "@/components/workdesk/notify-menu";
import { WorkLog, WorkLogSummary } from "@/components/workdesk/work-log";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { requireAdminRole } from "@/lib/admin-guard";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { dateInputValue, isOverdue } from "@/lib/workdesk/dates";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { ADMIN_TASK_STATUSES } from "@/lib/workdesk/rules";
import { TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import { listAssignableStaff } from "@/lib/workdesk/staff";
import { WORK_LOG_INCLUDE } from "@/lib/workdesk/work-log-query";

export default async function AdminTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notify?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const { id } = await params;
  const query = await searchParams;
  const [task, staff, catalog] = await Promise.all([
    prisma.internalTask.findUnique({
      where: { id },
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
        notes: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
        attachments: true,
        events: { orderBy: { createdAt: "asc" } },
        createdBy: { select: { name: true } },
        ...WORK_LOG_INCLUDE,
      },
    }),
    listAssignableStaff(),
    prisma.workProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, category: true },
    }),
  ]);
  if (!task) notFound();

  const selected = new Set(task.assignees.map((row) => row.userId));
  const dueValue = dateInputValue(task.dueAt);
  const assigneeNames = task.assignees.map((row) => row.user.name);
  const overdue = isOverdue(task.dueAt, task.status, ["COMPLETED", "CLOSED"]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <PageHeader
          breadcrumb={{ href: "/admin/tasks", label: "Tasks" }}
          title={`${task.reference}: ${task.title}`}
          description={`${
            assigneeNames.length > 0 ? assigneeNames.join(", ") : "Unassigned"
          } · Created by ${task.createdBy.name}${
            task.dueAt ? ` · ${overdue ? "Overdue " : "Due "}${formatDate(task.dueAt)}` : ""
          }`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <EmailStaffButton
                action={notifyTaskStaffAction}
                hiddenFields={{ taskId: task.id, returnTo: `/admin/tasks/${task.id}` }}
                disabled={assigneeNames.length === 0}
                includesFullTask
              />
              {task.status === "COMPLETED" || task.status === "CLOSED" ? (
                <form action={deleteTaskAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="returnTo" value="/admin/tasks" />
                  <ConfirmSubmit
                    message={`Delete ${task.reference}? This cannot be undone.`}
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          }
        />
        {query.notify === "none" ? (
          <div className="mb-4">
            <Alert tone="warning">Assign someone before sending a reminder.</Alert>
          </div>
        ) : null}
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
          <div className="mb-6 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 text-sm text-navy-900">
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
          canManageAll
          canEdit
          canSaveToCatalog
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
        <form action={addTaskNoteAction} encType="multipart/form-data" className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <input type="hidden" name="taskId" value={task.id} />
          <textarea name="body" required rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note" />
          <AttachmentField />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Add note
          </button>
        </form>
      </div>
      <aside className="space-y-4">
        <Card>
          <CardTitle>Assigned to</CardTitle>
          <AssigneeAvatars names={assigneeNames} />
        </Card>
        <WorkdeskNotifyMenu
          action={notifyTaskStaffAction}
          hiddenFields={{ taskId: task.id }}
          hasRecipients={assigneeNames.length > 0}
          includesFullTask
        />
        <Card>
          <CardTitle description="Everyone assigned is emailed the full current task when you save.">
            Manage
          </CardTitle>
          <form action={updateTaskAction} className="space-y-3">
            <input type="hidden" name="taskId" value={task.id} />
            <TextField label="Title" name="title" required defaultValue={task.title} />
            <TextAreaField label="Description" name="description" rows={5} defaultValue={task.description} />
            <SelectField
              label="Status"
              name="status"
              defaultValue={task.status}
              options={ADMIN_TASK_STATUSES.map((status) => ({
                value: status,
                label: TASK_STATUS_LABELS[status],
              }))}
            />
            <SelectField
              label="Priority"
              name="priority"
              defaultValue={task.priority}
              options={[
                { value: "LOW", label: "Low" },
                { value: "NORMAL", label: "Normal" },
                { value: "HIGH", label: "High" },
                { value: "EMERGENCY", label: "Emergency" },
              ]}
            />
            <TextField label="Due date" name="dueAt" type="date" defaultValue={dueValue} />
            <AssigneeChecklist
              staff={staff}
              selectedIds={[...selected]}
              legend="Assignees"
            />
            <TaskEmailHint tone="save" />
            <button type="submit" className="w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Save and email staff
            </button>
          </form>
        </Card>
        <Card>
          <CardTitle>History</CardTitle>
          <ActivityLog events={task.events} />
          {hasRole(user, "EMPLOYEE") ? (
            <Link
              href={`/admin/audit?action=task.&q=${encodeURIComponent(task.reference)}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Open in audit log
            </Link>
          ) : null}
        </Card>
        <Card className="border-red-200">
          <CardTitle description="Removes the task, notes, and files. Prefer Closed if you want to keep a record.">
            Delete task
          </CardTitle>
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <ConfirmSubmit
              message={`Delete ${task.reference}? This cannot be undone.`}
              className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Delete task
            </ConfirmSubmit>
          </form>
        </Card>
      </aside>
    </div>
  );
}
