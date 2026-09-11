import { createTaskAction } from "@/app/admin/tasks/actions";
import { PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { TaskEmailHint } from "@/components/workdesk/notify-menu";
import { TaskEmailPreview } from "@/components/workdesk/task-email-preview";
import { requireAdminRole } from "@/lib/admin-guard";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "New task" };

export default async function NewTaskPage() {
  await requireAdminRole("EMPLOYEE");
  const staff = await listAssignableStaff();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        breadcrumb={{ href: "/admin/tasks", label: "Tasks" }}
        title="New internal task"
        description="Assign the people who should do this work. They are emailed the full task automatically. You can send a reminder later from the task."
      />
      <form action={createTaskAction} encType="multipart/form-data" className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,42,73,0.05)] sm:p-6">
        <TextField label="Title" name="title" required />
        <TextAreaField label="Description" name="description" rows={6} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Priority"
            name="priority"
            defaultValue="NORMAL"
            options={[
              { value: "LOW", label: "Low" },
              { value: "NORMAL", label: "Normal" },
              { value: "HIGH", label: "High" },
              { value: "EMERGENCY", label: "Emergency" },
            ]}
          />
          <TextField label="Due date" name="dueAt" type="date" />
        </div>
        <AssigneeChecklist staff={staff} legend="Assign to" />
        <AttachmentField />
        <TaskEmailHint tone="create" />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Create task and email staff
        </button>
      </form>
      <TaskEmailPreview />
    </div>
  );
}
