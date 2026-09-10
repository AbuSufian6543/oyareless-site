import { createTaskAction } from "@/app/admin/tasks/actions";
import { PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { requireAdminRole } from "@/lib/admin-guard";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "New task" };

export default async function NewTaskPage() {
  await requireAdminRole("EDITOR");
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
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-navy-800">Assign technicians</legend>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {staff.map((person) => (
              <li key={person.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="assigneeIds" value={person.id} className="size-4" />
                  {person.name}
                  <span className="text-xs text-slate-500">({person.role.toLowerCase()})</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <AttachmentField />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Create task
        </button>
      </form>
    </div>
  );
}
