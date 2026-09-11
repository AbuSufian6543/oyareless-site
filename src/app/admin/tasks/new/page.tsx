import { createTaskAction } from "@/app/admin/tasks/actions";
import { PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { requireAdminRole } from "@/lib/admin-guard";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "New task" };

export default async function NewTaskPage() {
  await requireAdminRole("EMPLOYEE");
  const staff = await listAssignableStaff();

  return (
    <div className="max-w-2xl">
      <PageHeader
        breadcrumb={{ href: "/admin/tasks", label: "Tasks" }}
        title="New internal task"
        description="Assign one or more technicians. They are emailed and notified in the site."
      />
      <form action={createTaskAction} encType="multipart/form-data" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
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
        <AssigneeChecklist staff={staff} legend="Assign technicians" />
        <AttachmentField />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Create task
        </button>
      </form>
    </div>
  );
}
