import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addTaskNoteAction, deleteTaskAction, notifyTaskStaffAction, updateTaskAction } from "@/app/admin/tasks/actions";
import type { loadAdminTask } from "@/app/admin/tasks/load-task";
import { Alert, Card, CardTitle, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { CopyReference } from "@/components/workdesk/copy-reference";
import { EmailStaffButton, TaskEmailHint, WorkdeskNotifyMenu } from "@/components/workdesk/notify-menu";
import { PrintWorkOrderLink } from "@/components/workdesk/print-work-order-link";
import { WorkLog, WorkLogSummary } from "@/components/workdesk/work-log";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { hasRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import { dateInputValue, isOverdue } from "@/lib/workdesk/dates";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import { ADMIN_TASK_STATUSES } from "@/lib/workdesk/rules";

type Loaded = NonNullable<Awaited<ReturnType<typeof loadAdminTask>>>;
type Neighbor = { id: string; reference: string } | null;

function taskHref(id: string, backHref: string) {
  if (backHref === "/admin/tasks") return `/admin/tasks/${id}`;
  return `/admin/tasks/${id}?from=${encodeURIComponent(backHref)}`;
}

export function TaskDetailView({
  user,
  task,
  staff,
  catalog,
  notify,
  backHref = "/admin/tasks",
  previous = null,
  next = null,
}: Loaded & {
  notify?: string;
  backHref?: string;
  previous?: Neighbor;
  next?: Neighbor;
}) {
  const selected = new Set(task.assignees.map((row) => row.userId));
  const dueValue = dateInputValue(task.dueAt);
  const assigneeNames = task.assignees.map((row) => row.user.name);
  const overdue = isOverdue(task.dueAt, task.status, ["COMPLETED", "CLOSED"]);
  const backLabel = backHref === "/admin" || backHref.startsWith("/admin?") ? "Back to dashboard" : "Back to tasks";
  const related =
    task.enquiryKind === "submission" && task.enquiryId
      ? { href: `/admin/submissions/${task.enquiryId}`, label: "Related enquiry" }
      : task.enquiryKind === "quote" && task.enquiryId
        ? { href: `/admin/quotes/${task.enquiryId}`, label: "Related quote" }
        : null;
  const hasCreated = task.events.some((event) => event.kind === "CREATED");
  const timeline = [
    ...(hasCreated
      ? []
      : [
          {
            id: `${task.id}-created`,
            kind: "CREATED",
            summary: `Task created by ${task.createdBy.name}`,
            createdAt: task.createdAt,
          },
        ]),
    ...task.events,
    ...task.notes.map((note) => ({
      id: `note-${note.id}`,
      kind: "NOTE",
      summary: `${note.authorName} added a note`,
      createdAt: note.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return (
    <div className="wc-enter space-y-5">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href={backHref} className="font-semibold text-brand-700 hover:underline">
              {backLabel}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/admin" className="hover:text-navy-900">Workdesk</Link>
            <span aria-hidden="true">/</span>
            <Link href="/admin/tasks" className="hover:text-navy-900">Tasks</Link>
            <span aria-hidden="true">/</span>
            <span className="font-mono text-xs font-semibold text-navy-900">{task.reference}</span>
          </nav>
          <div className="flex items-center gap-2">
            {previous ? (
              <Link href={taskHref(previous.id, backHref)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-navy-800 hover:border-brand-300">
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {previous.reference}
              </Link>
            ) : null}
            {next ? (
              <Link href={taskHref(next.id, backHref)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-navy-800 hover:border-brand-300">
                {next.reference}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CopyReference value={task.reference} />
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {overdue ? <span className="text-xs font-semibold text-rose-700">Overdue</span> : null}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900">{task.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Created by {task.createdBy.name}
              {" · "}
              <WorkLogSummary
                minutes={task.timeEntries.reduce((sum, row) => sum + row.minutes, 0)}
                productCount={task.productUsages.length}
              />
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PrintWorkOrderLink kind="task" id={task.id} />
            <EmailStaffButton
              action={notifyTaskStaffAction}
              hiddenFields={{ taskId: task.id, returnTo: taskHref(task.id, backHref) }}
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
        </div>
      </header>
      {notify === "none" ? (
        <Alert tone="warning">Assign someone before sending a reminder.</Alert>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <section className="wc-row rounded-xl border border-slate-200 bg-white p-5" style={{ animationDelay: "40ms" }}>
            <h2 className="text-sm font-bold text-navy-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-navy-900">
              {task.description || "No description yet. Add one from the manage form."}
            </p>
          </section>
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
          <section className="wc-row rounded-xl border border-slate-200 bg-white p-5" style={{ animationDelay: "80ms" }}>
            <h2 className="text-sm font-bold text-navy-900">Notes</h2>
            <ol className="mt-3 space-y-3">
              {task.notes.length === 0 ? <li className="text-sm text-slate-500">No notes yet.</li> : null}
              {task.notes.map((note) => (
                <li key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
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
            <form action={addTaskNoteAction} encType="multipart/form-data" className="mt-4 space-y-3">
              <input type="hidden" name="taskId" value={task.id} />
              <textarea name="body" required rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note" />
              <AttachmentField />
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Add note
              </button>
            </form>
          </section>
          <section className="wc-row rounded-xl border border-slate-200 bg-white p-5" style={{ animationDelay: "120ms" }}>
            <h2 className="text-sm font-bold text-navy-900">Activity</h2>
            <div className="mt-3">
              <ActivityLog events={timeline} />
            </div>
            {hasRole(user, "EMPLOYEE") ? (
              <Link
                href={`/admin/audit?action=task.&q=${encodeURIComponent(task.reference)}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
              >
                Open in audit log
              </Link>
            ) : null}
          </section>
        </div>
        <aside className="wc-row min-w-0 space-y-4" style={{ animationDelay: "60ms" }}>
          <Card>
            <CardTitle>Assigned to</CardTitle>
            <AssigneeAvatars names={assigneeNames} />
          </Card>
          <Card>
            <CardTitle>Details</CardTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd><TaskStatusBadge status={task.status} /></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Priority</dt>
                <dd><PriorityBadge priority={task.priority} /></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Due</dt>
                <dd className={overdue ? "font-semibold text-rose-700" : "text-navy-900"}>
                  {task.dueAt ? `${overdue ? "Overdue " : ""}${formatDate(task.dueAt)}` : "No date"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-right text-navy-900">{formatDateTime(task.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Updated</dt>
                <dd className="text-right text-navy-900">{formatDateTime(task.updatedAt)}</dd>
              </div>
            </dl>
            {related ? (
              <Link href={related.href} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                {related.label}
              </Link>
            ) : null}
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
          <Card className="border-red-200">
            <CardTitle description="Removes the task, notes, and files. Prefer Closed if you want to keep a record.">
              Delete task
            </CardTitle>
            <form action={deleteTaskAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="returnTo" value="/admin/tasks" />
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
    </div>
  );
}
