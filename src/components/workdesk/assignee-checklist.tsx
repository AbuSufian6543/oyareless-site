import { OFFICE_ASSIGNABLE_ROLES, staffRoleLabel } from "@/lib/workdesk/rules";

const OFFICE = new Set<string>(OFFICE_ASSIGNABLE_ROLES);

export function AssigneeChecklist({
  staff,
  selectedIds = [],
  legend = "Assign to",
}: {
  staff: { id: string; name: string; role: string }[];
  selectedIds?: string[];
  legend?: string;
}) {
  const selected = new Set(selectedIds);
  const office = staff.filter((person) => OFFICE.has(person.role));
  const field = staff.filter((person) => !OFFICE.has(person.role));
  const groups = [
    office.length > 0 ? { title: "Office", people: office } : null,
    field.length > 0 ? { title: "Field", people: field } : null,
  ].filter((group): group is { title: string; people: typeof staff } =>
    Boolean(group),
  );

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-navy-800">{legend}</legend>
      <p className="mb-2 text-xs text-slate-500">
        Super admins, admins, managers, and employees can be assigned here — not
        only technicians. Only the people you check are emailed.
      </p>
      <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
        {groups.map((group) => (
          <div key={group.title}>
            {groups.length > 1 ? (
              <p className="mb-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
            ) : null}
            <ul className="space-y-1.5">
              {group.people.map((person) => (
                <li key={person.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="assigneeIds"
                      value={person.id}
                      defaultChecked={selected.has(person.id)}
                      className="size-4"
                    />
                    {person.name}
                    <span className="text-xs text-slate-500">
                      ({staffRoleLabel(person.role)})
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="text-sm text-slate-500">No staff accounts are available to assign.</p>
        )}
      </div>
    </fieldset>
  );
}
