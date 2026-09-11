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

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-navy-800">{legend}</legend>
      <p className="mb-2 text-xs text-slate-500">
        Only the people you check are emailed. Leave someone unchecked and they will not get this message.
      </p>
      <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
        {staff.map((person) => (
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
              <span className="text-xs text-slate-500">({person.role.toLowerCase()})</span>
            </label>
          </li>
        ))}
        {staff.length === 0 && (
          <li className="text-sm text-slate-500">No staff accounts are available to assign.</li>
        )}
      </ul>
    </fieldset>
  );
}
