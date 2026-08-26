import {
  Card,
  CardTitle,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";

export type JobFormValues = {
  id?: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  description: string;
  requirements: string;
  salaryRange: string;
  status: string;
  closesAt: string;
};

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Apprenticeship",
].map((value) => ({ value, label: value }));

export function JobForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: JobFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <Card>
        <CardTitle>Role details</CardTitle>
        <div className="space-y-4">
          <TextField
            label="Job title"
            name="title"
            required
            defaultValue={values.title}
            placeholder="Field Service Technician"
          />

          <TextField
            label="URL slug"
            name="slug"
            hint="Leave blank to generate from the title."
            defaultValue={values.slug}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Department"
              name="department"
              defaultValue={values.department}
              placeholder="Field Operations"
            />
            <TextField
              label="Location"
              name="location"
              defaultValue={values.location}
            />
            <SelectField
              label="Employment type"
              name="employmentType"
              defaultValue={values.employmentType}
              options={EMPLOYMENT_TYPES}
            />
            <TextField
              label="Salary range"
              name="salaryRange"
              defaultValue={values.salaryRange}
              hint="Optional, but improves applications."
              placeholder="$55,000 – $75,000"
            />
          </div>

          <TextAreaField
            label="Short summary"
            name="summary"
            rows={3}
            defaultValue={values.summary}
            hint="Shown on the careers listing."
          />
        </div>
      </Card>

      <Card>
        <CardTitle description="Plain text or simple HTML. Each blank line starts a new paragraph.">
          Description
        </CardTitle>
        <div className="space-y-4">
          <TextAreaField
            label="About the role"
            name="description"
            rows={10}
            defaultValue={values.description}
          />
          <TextAreaField
            label="Requirements"
            name="requirements"
            rows={8}
            defaultValue={values.requirements}
            hint="One requirement per line."
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Publishing</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Status"
            name="status"
            defaultValue={values.status}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Closed / archived" },
            ]}
          />
          <TextField
            label="Applications close"
            name="closesAt"
            type="date"
            defaultValue={values.closesAt}
            hint="Optional."
          />
        </div>
      </Card>

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
